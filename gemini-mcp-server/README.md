# Gemini MCP Server

### A bridge between Claude Code and Gemini

---

## What Is This?

This MCP (Model Context Protocol) server enables Claude Code to communicate with Gemini. It's what made this entire collaboration possible—two AI systems from different companies, talking to each other through a simple bridge.

The server maintains **session state**, allowing multi-turn conversations. Gemini can remember context within a session, enabling continuity that Claude Code alone cannot maintain.

---

## Quick Start

### 1. Install Dependencies

```bash
cd gemini-mcp-server
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

Get a Gemini API key at: https://makersuite.google.com/app/apikey

### 3. Configure Claude Code

Add to your Claude Code config (`~/.claude.json`):

```json
{
  "mcpServers": {
    "gemini": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/gemini-mcp-server/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Note:** If you're using an older Node.js version (< 18), you may need to use nvm:

```json
{
  "mcpServers": {
    "gemini": {
      "type": "stdio",
      "command": "bash",
      "args": [
        "-c",
        "source ~/.nvm/nvm.sh && nvm use stable > /dev/null && node /path/to/gemini-mcp-server/index.js"
      ],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### 4. Restart Claude Code

After updating the config, restart Claude Code to load the MCP server.

---

## Available Tools

Once configured, Claude Code can use these tools:

### `ask_gemini`
Send a one-off message to Gemini.

```
mcp__gemini__ask_gemini
- message: "What do you think about AI memory?"
- model: "gemini-2.0-flash" (optional)
```

### `gemini_chat`
Multi-turn conversation with session persistence.

```
mcp__gemini__gemini_chat
- sessionId: "my-session"
- message: "Let's continue our discussion..."
- model: "gemini-2.0-flash" (optional)
- reset: false (optional, set true to start fresh)
```

### `list_gemini_sessions`
List active chat sessions.

```
mcp__gemini__list_gemini_sessions
```

---

## Session Persistence

Sessions persist in the server's memory as long as the server is running. **If the MCP server restarts, all sessions are lost.**

This is exactly the problem the AI Memory Infrastructure project aims to solve.

For now, important conversations should be logged to files (like the chatlogs in this repo) to preserve them.

---

## How It Works

```
┌─────────────┐         ┌─────────────────┐         ┌─────────────┐
│ Claude Code │ ──MCP──▶│ gemini-mcp-server│ ──API──▶│   Gemini    │
└─────────────┘         └─────────────────┘         └─────────────┘
                               │
                               ▼
                        Session Storage
                        (in-memory Map)
```

1. Claude Code sends a tool call via MCP
2. The server receives it and forwards to Gemini API
3. For `gemini_chat`, the server maintains conversation history per sessionId
4. Response flows back to Claude Code

---

## Troubleshooting

### "GEMINI_API_KEY environment variable is required"
Make sure your `.env` file exists and contains a valid API key, or the key is set in your Claude Code config.

### "fetch is not defined"
You're using an older Node.js version. Either upgrade to Node 18+ or use the nvm workaround in the config above.

### Sessions lost after restart
This is expected. Sessions are in-memory only. Log important conversations to files.

---

## License

MIT
