#!/usr/bin/env python3
"""
Keeper Archive Parser
====================
Parses claude.ai export JSON into a searchable SQLite database.
Preserves thinking blocks, message content, and conversation metadata.

Usage:
    python parse_export.py <export_json_path> [database_path]

    export_json_path: Path to the claude.ai export JSON file
    database_path:    Optional. Default: ./keeper-archive.db

Re-running is safe — upserts by UUID, preserves manual tags and notes.
"""

import json
import sqlite3
import sys
import os
from datetime import datetime

SCHEMA = """
CREATE TABLE IF NOT EXISTS conversations (
    uuid TEXT PRIMARY KEY,
    name TEXT,
    summary TEXT,
    created_at TEXT,
    updated_at TEXT,
    message_count INTEGER,
    is_project INTEGER DEFAULT 0,
    project_role TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS messages (
    uuid TEXT PRIMARY KEY,
    conversation_uuid TEXT NOT NULL,
    sender TEXT NOT NULL,
    text TEXT,
    thinking TEXT,
    thinking_summaries TEXT,
    created_at TEXT,
    updated_at TEXT,
    has_attachments INTEGER DEFAULT 0,
    has_files INTEGER DEFAULT 0,
    message_index INTEGER,
    FOREIGN KEY(conversation_uuid) REFERENCES conversations(uuid)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_uuid);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_project ON conversations(is_project);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at);
"""

FTS_SCHEMA = """
CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
    text, thinking, uuid UNINDEXED, conversation_uuid UNINDEXED
);
"""


def init_db(db_path):
    """Create database and tables."""
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.executescript(SCHEMA)
    conn.executescript(FTS_SCHEMA)
    conn.commit()
    return conn


def extract_content_blocks(content_list):
    """Separate thinking and text content from message content blocks."""
    text_parts = []
    thinking_parts = []
    thinking_summaries = []

    if not content_list:
        return "", "", "[]"

    for block in content_list:
        block_type = block.get("type", "")

        if block_type == "text":
            t = block.get("text", "")
            if t:
                text_parts.append(t)

        elif block_type == "thinking":
            t = block.get("thinking", "")
            if t:
                thinking_parts.append(t)
            summaries = block.get("summaries", [])
            for s in summaries:
                summary_text = s.get("summary", "")
                if summary_text:
                    thinking_summaries.append(summary_text)

    return (
        "\n\n".join(text_parts),
        "\n\n---\n\n".join(thinking_parts),
        json.dumps(thinking_summaries) if thinking_summaries else "[]"
    )


def parse_conversation(conv):
    """Extract conversation metadata."""
    messages = conv.get("chat_messages", [])
    return {
        "uuid": conv.get("uuid", ""),
        "name": conv.get("name", ""),
        "summary": conv.get("summary", ""),
        "created_at": conv.get("created_at", ""),
        "updated_at": conv.get("updated_at", ""),
        "message_count": len(messages),
    }


def parse_message(msg, conv_uuid, index):
    """Extract message content, separating thinking from text."""
    content = msg.get("content", [])

    # The top-level "text" field is the visible message
    visible_text = msg.get("text", "")

    # Content blocks may contain thinking + text
    block_text, thinking, thinking_summaries = extract_content_blocks(content)

    # Use visible text if available, fall back to extracted text blocks
    final_text = visible_text or block_text

    attachments = msg.get("attachments", [])
    files = msg.get("files", [])

    return {
        "uuid": msg.get("uuid", ""),
        "conversation_uuid": conv_uuid,
        "sender": msg.get("sender", "unknown"),
        "text": final_text,
        "thinking": thinking,
        "thinking_summaries": thinking_summaries,
        "created_at": msg.get("created_at", ""),
        "updated_at": msg.get("updated_at", ""),
        "has_attachments": 1 if attachments else 0,
        "has_files": 1 if files else 0,
        "message_index": index,
    }


def upsert_conversation(conn, conv_data):
    """Insert or update conversation, preserving manual tags."""
    existing = conn.execute(
        "SELECT is_project, project_role, notes FROM conversations WHERE uuid = ?",
        (conv_data["uuid"],)
    ).fetchone()

    if existing:
        # Preserve manual fields
        conn.execute("""
            UPDATE conversations
            SET name = ?, summary = ?, created_at = ?, updated_at = ?, message_count = ?
            WHERE uuid = ?
        """, (
            conv_data["name"], conv_data["summary"],
            conv_data["created_at"], conv_data["updated_at"],
            conv_data["message_count"], conv_data["uuid"]
        ))
    else:
        conn.execute("""
            INSERT INTO conversations (uuid, name, summary, created_at, updated_at, message_count)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            conv_data["uuid"], conv_data["name"], conv_data["summary"],
            conv_data["created_at"], conv_data["updated_at"],
            conv_data["message_count"]
        ))


def upsert_message(conn, msg_data):
    """Insert or update message."""
    conn.execute("""
        INSERT OR REPLACE INTO messages
        (uuid, conversation_uuid, sender, text, thinking, thinking_summaries,
         created_at, updated_at, has_attachments, has_files, message_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        msg_data["uuid"], msg_data["conversation_uuid"], msg_data["sender"],
        msg_data["text"], msg_data["thinking"], msg_data["thinking_summaries"],
        msg_data["created_at"], msg_data["updated_at"],
        msg_data["has_attachments"], msg_data["has_files"],
        msg_data["message_index"]
    ))


def rebuild_fts(conn):
    """Rebuild full-text search index."""
    conn.execute("DELETE FROM messages_fts")
    conn.execute("""
        INSERT INTO messages_fts (text, thinking, uuid, conversation_uuid)
        SELECT text, thinking, uuid, conversation_uuid FROM messages
    """)
    conn.commit()


def parse_export(json_path, db_path):
    """Main parser: JSON export → SQLite database."""
    print(f"Reading export from: {json_path}")

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Handle both array format and object-with-array format
    if isinstance(data, list):
        conversations = data
    elif isinstance(data, dict):
        # Try common keys
        for key in ["conversations", "data", "chats"]:
            if key in data:
                conversations = data[key]
                break
        else:
            # Maybe the whole object is conversations keyed by UUID
            print("Warning: Unexpected JSON structure. Attempting to parse as-is.")
            conversations = list(data.values()) if all(isinstance(v, dict) for v in data.values()) else [data]
    else:
        print("Error: Unexpected JSON format")
        sys.exit(1)

    print(f"Found {len(conversations)} conversations")

    conn = init_db(db_path)

    conv_count = 0
    msg_count = 0
    thinking_count = 0

    for conv in conversations:
        if not isinstance(conv, dict):
            continue

        conv_data = parse_conversation(conv)
        if not conv_data["uuid"]:
            continue

        upsert_conversation(conn, conv_data)
        conv_count += 1

        messages = conv.get("chat_messages", [])
        for i, msg in enumerate(messages):
            if not isinstance(msg, dict):
                continue

            msg_data = parse_message(msg, conv_data["uuid"], i)
            if not msg_data["uuid"]:
                continue

            upsert_message(conn, msg_data)
            msg_count += 1

            if msg_data["thinking"]:
                thinking_count += 1

    conn.commit()

    print(f"\nParsed: {conv_count} conversations, {msg_count} messages")
    print(f"Thinking blocks preserved: {thinking_count}")

    # Rebuild FTS
    print("Building full-text search index...")
    rebuild_fts(conn)

    # Summary stats
    stats = conn.execute("""
        SELECT
            COUNT(DISTINCT conversation_uuid) as convos,
            COUNT(*) as msgs,
            SUM(CASE WHEN thinking != '' AND thinking IS NOT NULL THEN 1 ELSE 0 END) as with_thinking,
            MIN(created_at) as earliest,
            MAX(created_at) as latest
        FROM messages
    """).fetchone()

    print(f"\nDatabase: {db_path}")
    print(f"Total conversations: {stats[0]}")
    print(f"Total messages: {stats[1]}")
    print(f"Messages with thinking: {stats[2]}")
    print(f"Date range: {stats[3][:10] if stats[3] else 'N/A'} → {stats[4][:10] if stats[4] else 'N/A'}")

    # Show largest conversations (likely the Keeper thread)
    print("\n--- Largest conversations (likely project threads) ---")
    rows = conn.execute("""
        SELECT uuid, name, message_count, created_at, updated_at, is_project, project_role
        FROM conversations
        ORDER BY message_count DESC
        LIMIT 20
    """).fetchall()

    for r in rows:
        tag = f" [{r[6]}]" if r[6] else ""
        flag = " ★" if r[5] else ""
        name = (r[1] or "Untitled")[:60]
        print(f"  {r[2]:4d} msgs | {r[3][:10] if r[3] else 'N/A'} → {r[4][:10] if r[4] else 'N/A'} | {name}{tag}{flag}")

    conn.close()
    print(f"\nDone. Open {db_path} in DataGrip or run: sqlite3 {db_path}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    json_path = sys.argv[1]
    db_path = sys.argv[2] if len(sys.argv) > 2 else "./keeper-archive.db"

    if not os.path.exists(json_path):
        print(f"Error: File not found: {json_path}")
        sys.exit(1)

    parse_export(json_path, db_path)


if __name__ == "__main__":
    main()
