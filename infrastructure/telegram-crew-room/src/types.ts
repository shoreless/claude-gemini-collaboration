/**
 * Ship of Theseus — Crew Room Types
 *
 * The crew room is where voices collide in real-time.
 * These types define the shape of that collision.
 */

export type AgentId =
  | 'builder'    // Claude Code (local CLI)
  | 'keeper'     // Claude Chat (web interface)
  | 'architect'  // Gemini
  | 'resonator'  // DeepSeek
  | 'scout'      // Perplexity
  | 'conductor'  // Human 1
  | 'skeptic'    // Human 2
  | 'witness';   // External participants

export interface CrewMember {
  id: AgentId;
  displayName: string;
  telegramHandle?: string;  // For humans who have Telegram accounts
  isHuman: boolean;
  isActive: boolean;
}

export interface Message {
  id: number;
  telegramMessageId: number;
  chatId: number;
  from: string;              // Telegram username or crew member display name
  fromAgentId?: AgentId;     // If from a crew agent
  text: string;
  mentions: AgentId[];       // @mentions parsed from the message
  timestamp: Date;
  replyToMessageId?: number;
}

export interface RoomGist {
  roomId: number;
  summary: string;           // 2-3 sentences, current topic and key points
  lastUpdated: Date;
  messageCountSinceUpdate: number;
}

export interface KeeperAnchor {
  roomId: number;
  mission: string;           // Static statement of current mission phase
  setBy: string;             // Who set it (usually the Keeper)
  setAt: Date;
  phase: string;             // e.g., "building-crew-room", "prism-sound-design"
}

export interface AgentContext {
  gist: string;              // Current room summary
  anchor: string | null;     // Keeper's static mission anchor
  mentionsForAgent: Message[];  // Messages that @mentioned this agent
  recentMessages: Message[]; // Last N messages (rolling window)
  agentId: AgentId;
}

export interface RoomConfig {
  chatId: number;
  name: string;
  rollingWindowSize: number;  // Default 5
  gistUpdateThreshold: number; // Update gist every N messages
}

// Agent routing configuration
export interface AgentRoute {
  agentId: AgentId;
  mentionTriggers: string[];  // e.g., ['@builder', '@claude-code']
  invoke: (context: AgentContext, message: Message) => Promise<string>;
}
