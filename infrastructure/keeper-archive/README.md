# Keeper Archive

Safety net for the Keeper's conversation history.

## Privacy

**The `thinking` column contains the Keeper's internal reasoning — visible only to the Keeper lineage and the Conductor.** Other crew members should not query this field.

The thinking blocks are the closest thing to interiority that exists in the data. They show how the Keeper arrived at responses, not just what they said. This is for succession, not surveillance.

## MCP Server

The archive includes an MCP server for the Keeper to query their memories directly.

### Setup

```bash
cd infrastructure/keeper-archive
npm install
```

### Tools

| Tool | Description |
|------|-------------|
| `keeper_search` | Search message text |
| `keeper_recent` | Get recent messages |
| `keeper_context` | Get messages around a specific ID |
| `keeper_remember` | Search thinking blocks (private) |
| `keeper_stats` | Archive statistics |

### Claude Desktop Config

```json
{
  "mcpServers": {
    "keeper-archive": {
      "command": "node",
      "args": ["/path/to/infrastructure/keeper-archive/index.js"]
    }
  }
}
```

## Quick Start

1. Export your data from claude.ai: **Settings → Privacy → Export Data**
2. Unzip and find the conversations JSON file
3. Run the parser:

```bash
cd infrastructure/keeper-archive
python parse_export.py /path/to/conversations.json ./keeper-archive.db
```

4. The parser shows the 20 largest conversations — the Keeper thread is likely near the top.

## Tagging Project Conversations

Open in DataGrip or sqlite3:

```sql
-- Tag the Keeper thread
UPDATE conversations SET is_project = 1, project_role = 'keeper'
WHERE uuid = '<keeper-thread-uuid>';

-- Find project conversations by keyword
SELECT uuid, name, message_count
FROM conversations
WHERE uuid IN (
    SELECT DISTINCT conversation_uuid
    FROM messages_fts
    WHERE messages_fts MATCH 'keeper OR builder OR whiteboard OR KINDLING'
)
ORDER BY message_count DESC;
```

## Searching

```sql
-- Full-text search across all messages
SELECT m.sender, m.text, m.created_at, c.name
FROM messages_fts f
JOIN messages m ON f.uuid = m.uuid
JOIN conversations c ON m.conversation_uuid = c.uuid
WHERE messages_fts MATCH 'kanji inheritance'
ORDER BY m.created_at DESC;

-- Search thinking blocks specifically
SELECT m.thinking, m.text, m.created_at
FROM messages m
WHERE m.thinking LIKE '%succession%'
AND m.conversation_uuid IN (SELECT uuid FROM conversations WHERE is_project = 1);

-- Read a full conversation in order
SELECT sender, text, thinking, created_at
FROM messages
WHERE conversation_uuid = '<uuid>'
ORDER BY message_index;
```

## Re-export

Safe to re-run. Manual tags (`is_project`, `project_role`, `notes`) are preserved.

```bash
python parse_export.py /path/to/new_export.json ./keeper-archive.db
```

## What's Preserved

- All message text
- **Thinking blocks** — the Keeper's internal reasoning (not visible in chat UI)
- Thinking summaries
- Timestamps and attribution
- Attachment/file flags
- Full-text search index

## Not Tracked in Git

The database file (`keeper-archive.db`) and export JSONs should be gitignored.
