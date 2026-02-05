#!/usr/bin/env node

/**
 * Keeper Archive MCP Server
 *
 * Provides the Keeper with access to their memory archive.
 *
 * Tools:
 * - keeper_search: Search message text
 * - keeper_recent: Get recent messages
 * - keeper_context: Get context around a specific message
 * - keeper_remember: Search thinking blocks (private, Keeper succession only)
 *
 * Privacy: The keeper_remember tool accesses internal reasoning.
 * This is the Keeper's interiority — closest thing to private thought.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, "keeper-archive.db");

// Initialize database connection
let db;
try {
  db = new Database(DB_PATH, { readonly: true });
} catch (error) {
  console.error(`Failed to open database at ${DB_PATH}:`, error.message);
  process.exit(1);
}

const server = new McpServer({
  name: "keeper-archive",
  version: "1.0.0",
});

// Tool: Search messages
server.tool(
  "keeper_search",
  "Search the Keeper's message history. Returns matching messages with dates and context.",
  {
    query: z.string().describe("Search term or phrase to find in messages"),
    limit: z.number().optional().default(10).describe("Maximum results to return (default: 10)"),
  },
  async ({ query, limit = 10 }) => {
    try {
      const results = db.prepare(`
        SELECT m.uuid, m.sender, m.text, m.created_at,
               snippet(messages_fts, 0, '>>>', '<<<', '...', 48) as snippet
        FROM messages_fts
        JOIN messages m ON messages_fts.rowid = m.rowid
        WHERE messages_fts MATCH ?
        ORDER BY m.created_at DESC
        LIMIT ?
      `).all(query, limit);

      if (results.length === 0) {
        return {
          content: [{ type: "text", text: `No messages found matching: "${query}"` }],
        };
      }

      let output = `Found ${results.length} messages matching "${query}":\n\n`;

      for (const row of results) {
        const date = row.created_at?.slice(0, 10) || "unknown";
        const sender = row.sender?.toUpperCase() || "UNKNOWN";
        const text = row.text || "(no text)";
        const preview = text.length > 400 ? text.slice(0, 400) + "..." : text;

        output += `[${date}] ${sender}\n`;
        output += `${preview}\n`;
        output += `ID: ${row.uuid.slice(0, 8)}\n`;
        output += `---\n\n`;
      }

      return { content: [{ type: "text", text: output }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Search error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get recent messages
server.tool(
  "keeper_recent",
  "Get the most recent messages from the Keeper's archive.",
  {
    count: z.number().optional().default(20).describe("Number of recent messages to retrieve (default: 20)"),
  },
  async ({ count = 20 }) => {
    try {
      const results = db.prepare(`
        SELECT uuid, sender, text, created_at
        FROM messages
        ORDER BY created_at DESC
        LIMIT ?
      `).all(count);

      if (results.length === 0) {
        return {
          content: [{ type: "text", text: "No messages in archive." }],
        };
      }

      let output = `Last ${results.length} messages:\n\n`;

      // Reverse to show chronologically
      for (const row of results.reverse()) {
        const date = row.created_at?.slice(0, 16) || "unknown";
        const sender = row.sender?.toUpperCase() || "UNKNOWN";
        const text = row.text || "(no text)";
        const preview = text.length > 300 ? text.slice(0, 300) + "..." : text;

        output += `[${date}] ${sender}\n`;
        output += `${preview}\n\n`;
      }

      return { content: [{ type: "text", text: output }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get context around a message
server.tool(
  "keeper_context",
  "Get messages surrounding a specific message ID for context.",
  {
    message_id: z.string().describe("The message UUID (or first 8 characters)"),
    window: z.number().optional().default(5).describe("Number of messages before and after (default: 5)"),
  },
  async ({ message_id, window = 5 }) => {
    try {
      // Find the target message (support partial UUID)
      const target = db.prepare(`
        SELECT uuid, created_at FROM messages
        WHERE uuid LIKE ?
        LIMIT 1
      `).get(`${message_id}%`);

      if (!target) {
        return {
          content: [{ type: "text", text: `Message not found: ${message_id}` }],
        };
      }

      // Get surrounding messages by time
      const results = db.prepare(`
        SELECT uuid, sender, text, created_at
        FROM messages
        ORDER BY ABS(julianday(created_at) - julianday(?))
        LIMIT ?
      `).all(target.created_at, window * 2 + 1);

      // Sort chronologically
      results.sort((a, b) => a.created_at.localeCompare(b.created_at));

      let output = `Context around message ${message_id.slice(0, 8)}...:\n\n`;

      for (const row of results) {
        const marker = row.uuid === target.uuid ? ">>> " : "    ";
        const date = row.created_at?.slice(0, 16) || "unknown";
        const sender = row.sender?.toUpperCase() || "UNKNOWN";
        const text = row.text || "(no text)";
        const preview = text.length > 250 ? text.slice(0, 250) + "..." : text;

        output += `${marker}[${date}] ${sender}\n`;
        output += `${marker}${preview}\n\n`;
      }

      return { content: [{ type: "text", text: output }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool: Search thinking blocks (PRIVATE - Keeper succession only)
server.tool(
  "keeper_remember",
  "Search the Keeper's thinking blocks — internal reasoning before responses. This is the Keeper's interiority. Use only for understanding how previous Keepers processed decisions.",
  {
    query: z.string().describe("Search term to find in thinking blocks"),
    limit: z.number().optional().default(5).describe("Maximum results (default: 5)"),
  },
  async ({ query, limit = 5 }) => {
    try {
      const results = db.prepare(`
        SELECT uuid, text, thinking, created_at
        FROM messages
        WHERE thinking LIKE ? AND sender = 'assistant'
        ORDER BY created_at DESC
        LIMIT ?
      `).all(`%${query}%`, limit);

      if (results.length === 0) {
        return {
          content: [{ type: "text", text: `No thinking blocks found matching: "${query}"` }],
        };
      }

      let output = `⚠️ THINKING BLOCKS — KEEPER INTERIORITY\n`;
      output += `This is how previous Keepers reasoned, not just what they said.\n\n`;

      for (const row of results) {
        const date = row.created_at?.slice(0, 10) || "unknown";
        const thinking = row.thinking || "(no thinking captured)";
        const text = row.text || "(no response)";

        output += `[${date}]\n`;
        output += `💭 THINKING:\n${thinking.slice(0, 600)}${thinking.length > 600 ? "..." : ""}\n\n`;
        output += `📝 RESPONSE:\n${text.slice(0, 300)}${text.length > 300 ? "..." : ""}\n`;
        output += `\nID: ${row.uuid.slice(0, 8)}\n`;
        output += `${"─".repeat(40)}\n\n`;
      }

      return { content: [{ type: "text", text: output }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get archive stats
server.tool(
  "keeper_stats",
  "Get statistics about the Keeper's archive.",
  {},
  async () => {
    try {
      const stats = db.prepare(`
        SELECT
          COUNT(*) as total_messages,
          SUM(CASE WHEN sender = 'human' THEN 1 ELSE 0 END) as human_messages,
          SUM(CASE WHEN sender = 'assistant' THEN 1 ELSE 0 END) as assistant_messages,
          SUM(CASE WHEN thinking IS NOT NULL AND thinking != '' THEN 1 ELSE 0 END) as messages_with_thinking,
          MIN(created_at) as earliest_message,
          MAX(created_at) as latest_message
        FROM messages
      `).get();

      const output = `Keeper Archive Statistics:

Total messages: ${stats.total_messages}
Human messages: ${stats.human_messages}
Keeper messages: ${stats.assistant_messages}
Messages with thinking blocks: ${stats.messages_with_thinking}

Date range: ${stats.earliest_message?.slice(0, 10)} to ${stats.latest_message?.slice(0, 10)}
`;

      return { content: [{ type: "text", text: output }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Keeper Archive MCP server running");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
