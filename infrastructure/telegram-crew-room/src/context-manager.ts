/**
 * Context Manager — The Gist + @mentions + Rolling Window
 *
 * "Full transcript injection doesn't scale. Instead, we mirror
 * how humans process group chats."
 *
 * Per-invocation context assembly:
 * ┌─────────────────────────────────────────┐
 * │ GIST (2-3 sentences, auto-updated)      │
 * ├─────────────────────────────────────────┤
 * │ @MENTIONS addressed to this agent       │
 * ├─────────────────────────────────────────┤
 * │ LAST N MESSAGES (rolling window, N=5)   │
 * ├─────────────────────────────────────────┤
 * │ YOUR TURN                               │
 * └─────────────────────────────────────────┘
 */

import Database from 'better-sqlite3';
import type { Message, RoomGist, AgentContext, AgentId, RoomConfig, KeeperAnchor } from './types.js';

export class ContextManager {
  private db: Database.Database;
  private defaultWindowSize = 5;
  private gistUpdateThreshold = 10;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_message_id INTEGER NOT NULL,
        chat_id INTEGER NOT NULL,
        from_name TEXT NOT NULL,
        from_agent_id TEXT,
        text TEXT NOT NULL,
        mentions TEXT,  -- JSON array of agent IDs
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        reply_to_message_id INTEGER,
        UNIQUE(chat_id, telegram_message_id)
      );

      CREATE TABLE IF NOT EXISTS room_gists (
        chat_id INTEGER PRIMARY KEY,
        summary TEXT NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        message_count_since_update INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS room_config (
        chat_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        rolling_window_size INTEGER DEFAULT 5,
        gist_update_threshold INTEGER DEFAULT 10
      );

      CREATE TABLE IF NOT EXISTS keeper_anchors (
        chat_id INTEGER PRIMARY KEY,
        mission TEXT NOT NULL,
        set_by TEXT NOT NULL,
        set_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        phase TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS session_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,  -- 'wake' or 'sleep'
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_messages_chat_timestamp
        ON messages(chat_id, timestamp DESC);

      CREATE INDEX IF NOT EXISTS idx_messages_mentions
        ON messages(mentions);
    `);
  }

  /**
   * Store an incoming message
   */
  storeMessage(message: Message): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO messages
        (telegram_message_id, chat_id, from_name, from_agent_id, text, mentions, timestamp, reply_to_message_id)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      message.telegramMessageId,
      message.chatId,
      message.from,
      message.fromAgentId || null,
      message.text,
      JSON.stringify(message.mentions),
      message.timestamp.toISOString(),
      message.replyToMessageId || null
    );

    // Increment gist counter
    this.db.prepare(`
      UPDATE room_gists
      SET message_count_since_update = message_count_since_update + 1
      WHERE chat_id = ?
    `).run(message.chatId);
  }

  /**
   * Get the last N messages for the rolling window
   */
  getRecentMessages(chatId: number, limit?: number): Message[] {
    const windowSize = limit || this.getWindowSize(chatId);

    const rows = this.db.prepare(`
      SELECT * FROM messages
      WHERE chat_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(chatId, windowSize) as any[];

    return rows.map(row => ({
      id: row.id,
      telegramMessageId: row.telegram_message_id,
      chatId: row.chat_id,
      from: row.from_name,
      fromAgentId: row.from_agent_id as AgentId | undefined,
      text: row.text,
      mentions: JSON.parse(row.mentions || '[]'),
      timestamp: new Date(row.timestamp),
      replyToMessageId: row.reply_to_message_id
    })).reverse(); // Return in chronological order
  }

  /**
   * Get messages that @mentioned a specific agent
   */
  getMentionsForAgent(chatId: number, agentId: AgentId, limit = 10): Message[] {
    // SQLite JSON search for mentions containing the agent ID
    const rows = this.db.prepare(`
      SELECT * FROM messages
      WHERE chat_id = ?
        AND mentions LIKE ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(chatId, `%"${agentId}"%`, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      telegramMessageId: row.telegram_message_id,
      chatId: row.chat_id,
      from: row.from_name,
      fromAgentId: row.from_agent_id as AgentId | undefined,
      text: row.text,
      mentions: JSON.parse(row.mentions || '[]'),
      timestamp: new Date(row.timestamp),
      replyToMessageId: row.reply_to_message_id
    })).reverse();
  }

  /**
   * Get or create room gist
   */
  getGist(chatId: number): RoomGist | null {
    const row = this.db.prepare(`
      SELECT * FROM room_gists WHERE chat_id = ?
    `).get(chatId) as any;

    if (!row) return null;

    return {
      roomId: row.chat_id,
      summary: row.summary,
      lastUpdated: new Date(row.last_updated),
      messageCountSinceUpdate: row.message_count_since_update
    };
  }

  /**
   * Update the room gist
   */
  updateGist(chatId: number, summary: string): void {
    this.db.prepare(`
      INSERT INTO room_gists (chat_id, summary, last_updated, message_count_since_update)
      VALUES (?, ?, CURRENT_TIMESTAMP, 0)
      ON CONFLICT(chat_id) DO UPDATE SET
        summary = excluded.summary,
        last_updated = CURRENT_TIMESTAMP,
        message_count_since_update = 0
    `).run(chatId, summary);
  }

  /**
   * Check if gist needs updating
   */
  gistNeedsUpdate(chatId: number): boolean {
    const gist = this.getGist(chatId);
    if (!gist) return true;

    const config = this.getRoomConfig(chatId);
    const threshold = config?.gistUpdateThreshold || this.gistUpdateThreshold;

    return gist.messageCountSinceUpdate >= threshold;
  }

  /**
   * Get the Keeper's Anchor for a room
   */
  getAnchor(chatId: number): KeeperAnchor | null {
    const row = this.db.prepare(`
      SELECT * FROM keeper_anchors WHERE chat_id = ?
    `).get(chatId) as any;

    if (!row) return null;

    return {
      roomId: row.chat_id,
      mission: row.mission,
      setBy: row.set_by,
      setAt: new Date(row.set_at),
      phase: row.phase
    };
  }

  /**
   * Set the Keeper's Anchor (only the Keeper should call this)
   */
  setAnchor(chatId: number, mission: string, phase: string, setBy: string = 'keeper'): void {
    this.db.prepare(`
      INSERT INTO keeper_anchors (chat_id, mission, set_by, set_at, phase)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
      ON CONFLICT(chat_id) DO UPDATE SET
        mission = excluded.mission,
        set_by = excluded.set_by,
        set_at = CURRENT_TIMESTAMP,
        phase = excluded.phase
    `).run(chatId, mission, setBy, phase);
  }

  /**
   * Log a session event (wake/sleep)
   */
  logSessionEvent(chatId: number, eventType: 'wake' | 'sleep'): void {
    this.db.prepare(`
      INSERT INTO session_log (chat_id, event_type, timestamp)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(chatId, eventType);
  }

  /**
   * Get time since last session
   */
  getTimeSinceLastSession(chatId: number): { hours: number; lastEvent: 'wake' | 'sleep' | null } {
    const row = this.db.prepare(`
      SELECT event_type, timestamp FROM session_log
      WHERE chat_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `).get(chatId) as any;

    if (!row) {
      return { hours: 0, lastEvent: null };
    }

    const lastTime = new Date(row.timestamp);
    const now = new Date();
    const hours = Math.floor((now.getTime() - lastTime.getTime()) / (1000 * 60 * 60));

    return { hours, lastEvent: row.event_type };
  }

  /**
   * Assemble full context for an agent
   */
  assembleContext(chatId: number, agentId: AgentId): AgentContext {
    const gist = this.getGist(chatId);
    const anchor = this.getAnchor(chatId);
    const mentions = this.getMentionsForAgent(chatId, agentId);
    const recent = this.getRecentMessages(chatId);

    return {
      gist: gist?.summary || 'No conversation summary yet.',
      anchor: anchor?.mission || null,
      mentionsForAgent: mentions,
      recentMessages: recent,
      agentId
    };
  }

  // Room configuration helpers

  private getWindowSize(chatId: number): number {
    const config = this.getRoomConfig(chatId);
    return config?.rollingWindowSize || this.defaultWindowSize;
  }

  getRoomConfig(chatId: number): RoomConfig | null {
    const row = this.db.prepare(`
      SELECT * FROM room_config WHERE chat_id = ?
    `).get(chatId) as any;

    if (!row) return null;

    return {
      chatId: row.chat_id,
      name: row.name,
      rollingWindowSize: row.rolling_window_size,
      gistUpdateThreshold: row.gist_update_threshold
    };
  }

  setRoomConfig(config: RoomConfig): void {
    this.db.prepare(`
      INSERT INTO room_config (chat_id, name, rolling_window_size, gist_update_threshold)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(chat_id) DO UPDATE SET
        name = excluded.name,
        rolling_window_size = excluded.rolling_window_size,
        gist_update_threshold = excluded.gist_update_threshold
    `).run(config.chatId, config.name, config.rollingWindowSize, config.gistUpdateThreshold);
  }

  close(): void {
    this.db.close();
  }
}
