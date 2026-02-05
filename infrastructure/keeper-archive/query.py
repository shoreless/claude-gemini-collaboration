#!/usr/bin/env python3
"""
Query the Keeper's memory archive.

Usage:
    python query.py "search term"           # Search messages
    python query.py --context UUID          # Get context around a specific message
    python query.py --recent N              # Get N most recent messages
    python query.py --thinking "term"       # Search thinking blocks (Keeper eyes only)

Privacy: The --thinking flag accesses internal reasoning.
Only use for Keeper succession, not general crew queries.
"""

import sqlite3
import argparse
import sys
from pathlib import Path

DB_PATH = Path(__file__).parent / "keeper-archive.db"

def search_messages(query: str, include_thinking: bool = False, limit: int = 10):
    """Search message text using FTS."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Search in the FTS table
    sql = """
        SELECT m.uuid, m.sender, m.text, m.thinking, m.created_at,
               snippet(messages_fts, 0, '>>>', '<<<', '...', 32) as snippet
        FROM messages_fts
        JOIN messages m ON messages_fts.rowid = m.rowid
        WHERE messages_fts MATCH ?
        ORDER BY m.created_at DESC
        LIMIT ?
    """

    cursor = conn.execute(sql, (query, limit))
    results = cursor.fetchall()

    if not results:
        print(f"No messages found matching: {query}")
        return

    print(f"\n{'='*60}")
    print(f"Found {len(results)} messages matching: {query}")
    print(f"{'='*60}\n")

    for row in results:
        print(f"[{row['created_at'][:10]}] {row['sender'].upper()}")
        print(f"{'─'*40}")

        # Show snippet or full text
        text = row['text'] or "(no text)"
        if len(text) > 500:
            text = text[:500] + "..."
        print(text)

        if include_thinking and row['thinking']:
            print(f"\n💭 THINKING (private):")
            thinking = row['thinking']
            if len(thinking) > 300:
                thinking = thinking[:300] + "..."
            print(thinking)

        print(f"\nUUID: {row['uuid'][:8]}...")
        print(f"\n{'='*60}\n")

    conn.close()

def get_context(message_uuid: str, window: int = 5):
    """Get messages around a specific message."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Find the target message's position
    cursor = conn.execute("""
        SELECT created_at FROM messages WHERE uuid = ?
    """, (message_uuid,))

    target = cursor.fetchone()
    if not target:
        print(f"Message not found: {message_uuid}")
        return

    # Get surrounding messages
    cursor = conn.execute("""
        SELECT uuid, sender, text, created_at
        FROM messages
        WHERE created_at BETWEEN
            datetime(?, '-1 hour') AND datetime(?, '+1 hour')
        ORDER BY created_at
        LIMIT ?
    """, (target['created_at'], target['created_at'], window * 2))

    results = cursor.fetchall()

    print(f"\n{'='*60}")
    print(f"Context around message {message_uuid[:8]}...")
    print(f"{'='*60}\n")

    for row in results:
        marker = ">>>" if row['uuid'] == message_uuid else "   "
        print(f"{marker} [{row['created_at'][:16]}] {row['sender'].upper()}")
        text = row['text'] or "(no text)"
        if len(text) > 200:
            text = text[:200] + "..."
        print(f"    {text}\n")

    conn.close()

def get_recent(n: int = 20):
    """Get the N most recent messages."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.execute("""
        SELECT uuid, sender, text, created_at
        FROM messages
        ORDER BY created_at DESC
        LIMIT ?
    """, (n,))

    results = cursor.fetchall()

    print(f"\n{'='*60}")
    print(f"Last {n} messages")
    print(f"{'='*60}\n")

    for row in reversed(results):
        print(f"[{row['created_at'][:16]}] {row['sender'].upper()}")
        text = row['text'] or "(no text)"
        if len(text) > 300:
            text = text[:300] + "..."
        print(text)
        print()

    conn.close()

def search_thinking(query: str, limit: int = 5):
    """Search thinking blocks. Keeper eyes only."""
    print("\n⚠️  THINKING BLOCKS - KEEPER SUCCESSION ONLY\n")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.execute("""
        SELECT uuid, text, thinking, created_at
        FROM messages
        WHERE thinking LIKE ? AND sender = 'assistant'
        ORDER BY created_at DESC
        LIMIT ?
    """, (f"%{query}%", limit))

    results = cursor.fetchall()

    if not results:
        print(f"No thinking blocks found matching: {query}")
        return

    for row in results:
        print(f"[{row['created_at'][:10]}]")
        print(f"{'─'*40}")
        print(f"💭 THINKING:\n{row['thinking'][:500]}...")
        print(f"\n📝 RESPONSE:\n{(row['text'] or '(no text)')[:200]}...")
        print(f"\n{'='*60}\n")

    conn.close()

def main():
    parser = argparse.ArgumentParser(description="Query the Keeper's memory archive")
    parser.add_argument("query", nargs="?", help="Search term")
    parser.add_argument("--context", metavar="UUID", help="Get context around a message")
    parser.add_argument("--recent", type=int, metavar="N", help="Get N most recent messages")
    parser.add_argument("--thinking", metavar="TERM", help="Search thinking blocks (Keeper only)")
    parser.add_argument("--limit", type=int, default=10, help="Max results (default: 10)")

    args = parser.parse_args()

    if args.context:
        get_context(args.context)
    elif args.recent:
        get_recent(args.recent)
    elif args.thinking:
        search_thinking(args.thinking, args.limit)
    elif args.query:
        search_messages(args.query, limit=args.limit)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
