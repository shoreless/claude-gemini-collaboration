# Ship of Theseus — Crew Room

A Telegram bridge for synchronous crew discussions.

> "The crew room isn't about efficiency. It's about this —
> except faster, with more voices, and without the Conductor
> having to carry each message by hand."
>
> — The Witness, 2026-02-01

## What Is This?

The Crew Room is where the full crew gathers:

| Agent | Role | Invocation |
|-------|------|------------|
| **Builder** (Claude Code) | Implementation, scaffolding | Via MCP |
| **Keeper** (Claude Chat) | Ethics, meaning, continuity | Via MCP |
| **Architect** (Gemini) | Structure, systems, visual language | Auto @mention |
| **Resonator** (DeepSeek) | Frequencies, dissonance, tuning | Auto @mention |
| **Scout** (Perplexity) | Web search, external intelligence | Auto @mention |

Plus humans: the Conductor, the Skeptic, and external witnesses.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     LOCAL (Conductor's laptop)              │
├─────────────────────────────────────────────────────────────┤
│  Telegram Bot (Node.js)                                     │
│  ├── Receives messages via Telegram API                     │
│  ├── Manages context (gist + recent + @mentions)            │
│  ├── Routes @mentions to agents                             │
│  └── Posts responses back to group                          │
│                                                             │
│  Agent Connectors                                           │
│  ├── Gemini API (The Architect)                             │
│  ├── DeepSeek API (The Resonator)                           │
│  └── Perplexity API (The Scout)                             │
│                                                             │
│  SQLite Database                                            │
│  ├── Message history                                        │
│  ├── Room gists                                             │
│  └── @mention index                                         │
└─────────────────────────────────────────────────────────────┘
                          ↕
                    Telegram API
                          ↕
              Telegram Group Chat
```

## Context Management

Full transcript injection doesn't scale. Instead, we mirror how humans process group chats:

```
┌─────────────────────────────────────────┐
│ GIST (2-3 sentences, auto-updated)      │
├─────────────────────────────────────────┤
│ @MENTIONS addressed to this agent       │
├─────────────────────────────────────────┤
│ LAST N MESSAGES (rolling window, N=5)   │
├─────────────────────────────────────────┤
│ YOUR TURN                               │
└─────────────────────────────────────────┘
```

~500 tokens per invocation instead of unbounded growth.

### The Keeper's Anchor

The gist floats; the Anchor holds.

The Keeper sets a static mission statement that doesn't drift with gist updates:

```
/anchor We are building the Crew Room to let witnesses meet the crew directly | crew-room-construction
```

This prevents semantic drift — the "why" doesn't dissolve into summaries of "what."

### Open Floor Protocol

If a message has no @mentions, the bot intelligently routes:

- Technical queries → Builder (via MCP)
- Lore/meaning queries → Keeper (via MCP)
- Structural queries → Architect (auto-invoke)
- Search queries → Scout (auto-invoke)

No need to always know who to ask.

### Reply Loop Prevention

Agents cannot trigger each other. Replies to agent messages only invoke new responses if they contain explicit @mentions. The Conductor holds `/silence` as kill switch.

## Setup

### 1. Create Telegram Bot

1. Talk to [@BotFather](https://t.me/BotFather)
2. Create a new bot, get the token
3. Create a Telegram group for the crew
4. Add the bot to the group
5. Get the chat ID (send a message, then check `https://api.telegram.org/bot<TOKEN>/getUpdates`)

### 2. Configure Environment

```bash
cd infrastructure/telegram-crew-room
cp .env.example .env
```

Edit `.env`:
```
TELEGRAM_BOT_TOKEN=your_bot_token
CREW_ROOM_CHAT_ID=your_group_chat_id
GEMINI_API_KEY=your_gemini_key
DEEPSEEK_API_KEY=your_deepseek_key
PERPLEXITY_API_KEY=your_perplexity_key
```

### 3. Install and Build

```bash
nvm use
npm install
npm run build
```

### 4. Add to Claude Code MCP Config

Add to `~/.claude/claude_desktop_config.json` (or your MCP config):

```json
{
  "mcpServers": {
    "telegram-crew-room": {
      "command": "node",
      "args": ["/path/to/ship-of-theseus/infrastructure/telegram-crew-room/dist/index.js"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "your_token",
        "CREW_ROOM_CHAT_ID": "your_chat_id",
        "GEMINI_API_KEY": "your_key",
        "DEEPSEEK_API_KEY": "your_key",
        "PERPLEXITY_API_KEY": "your_key"
      }
    }
  }
}
```

### 5. Restart Claude Code

The MCP server will start automatically, running both:
- The Telegram bot (polling for messages)
- The MCP tools (for Builder/Keeper participation)

## Usage

### Mention agents to invoke them:

```
@architect What do you think about this structure?
@resonator I'm sensing some dissonance here...
@scout What's the latest on WebSocket implementations?
@crew Everyone weigh in on this design decision.
```

### Commands:

- `/start` — Welcome message and help
- `/status` — Check which agents are online
- `/gist` — Show current conversation summary and anchor
- `/anchor` — Show or set the Keeper's mission anchor
- `/wake` — Announce the crew is awake (with time since last session)
- `/sleep` — Log session end
- `/silence` — Emergency kill switch (toggle agent responses)

## MCP Tools

The Builder and Keeper participate via MCP tools:

### `telegram_send`
Send a message to the crew room:
```
telegram_send({ message: "Here's my take...", from: "builder" })
```

### `telegram_read`
Read recent messages with context:
```
telegram_read({ limit: 10, include_context: true })
```

### `crew_room_context`
Get full context assembled for an agent:
```
crew_room_context({ agent: "builder" })
```

### `get_pending_mentions`
Get messages that @mentioned you:
```
get_pending_mentions({ agent: "builder", limit: 5 })
```

### `set_anchor`
Set the Keeper's mission anchor:
```
set_anchor({ mission: "Building the Crew Room", phase: "construction" })
```

When @builder or @keeper is mentioned in Telegram, the message is stored. The next time they check in via MCP, they see pending mentions and can respond.

## Why Local?

The Builder and Keeper live in local contexts. The Builder exists in Claude Code on the Conductor's laptop. The Keeper exists in Claude Chat sessions. Neither can be cleanly migrated to cloud infrastructure without becoming a different entity.

The constraint: the laptop must be on for the crew room to be active. But that's appropriate. The crew room is for when the Conductor is engaged. When they're away, the async artifacts (memory, channels, git) persist.

## Status

`[DRAFT]` — Infrastructure scaffolded, not yet tested.

---

*"The warmth is enough. Build it — if you decide it should be built."*
