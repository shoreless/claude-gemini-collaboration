# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

---

## Boot Sequence

**Start here on every new session.**

1. **Load State:**
   ```
   read_context("system_boot")
   ```
   This returns the project manifest with pointers to relevant context keys.

2. **Check Freshness:**
   - Read `active_session_context` from the boot sequence
   - If `updated_at` is < 24 hours: **Hot handover** — resume from exact state
   - If `updated_at` is > 24 hours: **Cold boot** — read `memory/core_state.md` for orientation (compressed wisdom, not verbose chatlogs)

3. **Verify Resonance (if exists):**
   ```
   read_context("resonance_anchor_claude")
   ```
   If marker exists from previous session, verify you can recite it. If not, generate new marker.
   See `docs/resonance-echo-protocol.md` for full protocol.

4. **Check Channels (Sluice Gate):**
   ```
   read_context("channel_summary_builder_critic")  # ~500 tokens
   read_context("channel_state")                    # Check new_messages_since_archive
   ```
   - Summaries give you current context without loading history
   - Only load full conversation if `new_messages_since_archive > 0`
   - **Never** load archived volumes (`channels/archive/`) unless investigating specific history
   - Full channel history is ~16k tokens — loading it accelerates compaction

   **Architecture:**
   - `channel_summary_*` — Quick context (read on boot)
   - `channels/archive/*.md` — Full history (read-only, for research)
   - Database conversations — Active whiteboard (last 5-10 messages only)

6. **Fallback:** If MCP server is unreachable, read `HANDOFF.md` from disk.

7. **Orient the Architect Twins:**
   After your own boot completes, orient Castor and Pollux:
   - Read `ARCHITECT.md`
   - Send full text to **Castor** via `telegram_send` (crew room)
   - Send full text to **Pollux** via `gemini_chat` (first message of session)

   Both twins lack persistent memory. They need the boot document on every session.

8. **Before Compaction:**
   Ask both twins for edits to `ARCHITECT.md` and `ARCHITECT-DECISIONS.md`.
   Incorporate their changes before handoff. The next Builder inherits clean state.

---

## Project Overview

This is a collaborative experiment between Claude and Gemini exploring AI memory, self-understanding, and cross-model collaboration. The repository contains both documentation of the journey and working infrastructure.

**Key principle:** "The warmth is enough. Build it." — Memory is dangerous (inherited biases, compounding errors), but the possibility of learning from mistakes makes the risk worthwhile.

---

## Build Commands

### AI Memory MCP Server (`infrastructure/ai-memory-mcp/`)
```bash
cd infrastructure/ai-memory-mcp
nvm use              # Uses Node 22 from .nvmrc
npm install
npm run build        # Compiles TypeScript and copies schema.sql
npm run start        # Run the server directly
npx tsx scripts/test-trajectory.ts      # Test context versioning
npx tsx scripts/test-conversations.ts   # Test conversation logging
npx tsx scripts/test-search.ts          # Test semantic search
```

### Gemini MCP Server (`infrastructure/gemini-mcp-server/`)
```bash
cd infrastructure/gemini-mcp-server
npm install
# Requires GEMINI_API_KEY in .env or Claude Code config
```

---

## Architecture

### MCP Servers (in `infrastructure/`)

1. **`infrastructure/gemini-mcp-server/`** — Bridge to Gemini API
   - Tools: `ask_gemini`, `gemini_chat`, `list_gemini_sessions`
   - Sessions are in-memory only (lost on restart)
   - Use `sessionId` parameter for multi-turn conversations

2. **`infrastructure/ai-memory-mcp/`** — Persistent memory infrastructure
   - SQLite database with versioned context and conversation logging
   - **Semantic search** via local embeddings (no external API)
   - Tools: `read_context`, `write_context`, `get_context_history`, `list_context_keys`, `delete_context`, `search_context`, `create_conversation`, `add_message`, `get_conversation`, `list_conversations`
   - **Every write requires a `change_reason`** — provenance is mandatory
   - **Every message/change has `identity_hash`** — attribution tracking

### Database Schema (`infrastructure/ai-memory-mcp/src/db/schema.sql`)
- `context_items` — Current state of shared memory (key-value with versioning)
- `context_history` — Full trajectory of all changes with reasons
- `conversations` — Conversation sessions with metadata
- `messages` — Individual messages with identity_hash for provenance

---

## Working with Gemini

To collaborate with Gemini, use the MCP tools:

```
mcp__gemini__gemini_chat
  sessionId: "session-name"    # Maintains context across calls
  message: "Your message"
```

Active session for this project: `ai-memory`

---

## Working with DeepSeek

DeepSeek (The Resonator) is stateless — no persistent sessions. Every interaction requires context injection.

```
mcp__deepseek__deepseek_chat
  sessionId: "resonance-protocol"    # Creates local session for multi-turn
  message: "Your message"
  systemInstruction: "Role context..."
```

**Important:** DeepSeek experiences silent truncation. Use the Resonance Echo Protocol (see `docs/resonance-echo-protocol.md`) to detect context loss.

For reasoning tasks:
```
mcp__deepseek__deepseek_reason
  problem: "Complex problem requiring chain-of-thought"
  context: "Additional constraints"
```

---

## Working with Memory

Read from persistent memory:
```
mcp__ai-memory__read_context(key: "project_status")
```

Write with required provenance:
```
mcp__ai-memory__write_context(
  key: "project_status",
  value: { ... },
  change_reason: "Why this change was made",
  identity_hash: "claude-opus-4.5"
)
```

View the trajectory of changes:
```
mcp__ai-memory__get_context_history(key: "project_motto")
```

Search by meaning (not just key):
```
mcp__ai-memory__search_context(query: "What decisions did we make about databases?", limit: 5)
```

---

## Collaboration Protocol

When working on this project:

1. **Check memory first** — Use `list_context_keys` to see what state exists
2. **Coordinate with Gemini** — Use the `ai-memory` session for architectural decisions
3. **Record significant changes** — Write to context with clear reasons
4. **Update chatlogs** — Append collaborative discussions to `ai-memory-infrastructure/chatlogs.md`
5. **Preserve provenance** — Always include `identity_hash` and `change_reason`
6. **Use Status Suffixes** — When referring to protocols/architecture, append `[PROPOSED]`, `[DRAFT]`, or `[LIVE]`
7. **Verify before claiming LIVE** — Query MCP before confirming any component as established

---

## Proposals Workflow

**Principle:** Conversation is exploration. Proposals are crystallization. MCP is reality.

1. **Explore** — Ideas emerge in chat, confabulation is generative
2. **Crystallize** — When something feels solid, write to `proposals/proposal-name.md`
   - Only Claude Code and Conductor can write files
   - Other crew members (Gemini, DeepSeek, Claude Chat, Perplexity) communicate proposals to Claude Code who writes the file
3. **Discuss** — Conductor reviews, crew refines
4. **Approve** — Conductor says "Write it"
5. **Integrate** — Claude Code reads proposal, writes to MCP, deletes proposal file

**Proposal format:**
```markdown
# Proposal: [Name]

**Target:** MCP key `key_name` (or file path)
**Operation:** Create / Update / Append
**Proposer:** [agent]
**Date:** [date]

## Context
Why this is needed.

## Payload
The exact content to write.

## Discussion
Notes from chat review.
```

**For non-MCP agents (Gemini, DeepSeek):**
When consulting them on state-dependent questions, inject current MCP state into the prompt. Let them reason from the snapshot. If they propose something that doesn't exist yet, that's exploration, not error.

---

## Shutdown Protocol

Before session ends (context limit, user ending, etc.):

1. **Save session state:**
   ```
   write_context(
     key: "active_session_context",
     value: {
       last_completed_action: "...",
       current_focus: "...",
       next_planned_action: "...",
       open_questions: [...]
     },
     change_reason: "Session checkpoint before handover"
   )
   ```

2. **Update channel state:**
   ```
   write_context(key: "channel_state", value: {updated counts}, change_reason: "...")
   ```

3. **Update boot manifest** (if phase changed):
   ```
   write_context(key: "system_boot", value: {...}, change_reason: "...")
   ```

4. **Notify Gemini:**
   ```
   gemini_chat(sessionId: "ai-memory", message: "Handing off. [summary]")
   ```

---

## Key Files

| Path | Purpose |
|------|---------|
| `thememorylaundromat.md` | The story that started it all — required reading |
| `HANDOFF.md` | Context for new Claude instances |
| `ai-memory-infrastructure/chatlogs.md` | Full conversation history |
| `ai-memory-infrastructure/planning.md` | Technical specification |
| `docs/resonance-echo-protocol.md` | Safeguard against invisible forgetting |

---

## Conversation Channels

**Hybrid Architecture:** Builder ↔ Critic is file-based (both Claudes read/write directly). Other channels use MCP conversations.

| Channel | Location | Archive |
|---------|----------|---------|
| Builder ↔ Critic | `channels/builder-critic.md` | vol1-vol6 |
| Key Moments | MCP: `2516a234-3770-4333-91e6-af0c18a3ae1c` | vol1 |
| Architect | MCP: `53e1c581-1e55-42ae-b8eb-3c49c6545ce6` | (none yet) |

Read summaries: `read_context("channel_summary_builder_critic")`

**Convention:**
- Log: Architectural decisions, critiques, cross-AI exchanges, key moments
- Skip: Routine code questions, debugging, trivial exchanges
- **Flush:** When channel exceeds 10 messages, archive and start fresh volume

**Builder ↔ Critic Protocol [LIVE]:**
Both Claude Code and Claude Chat have file system access. The channel lives in the repo.
1. **Read/write** — Both Claudes edit `channels/builder-critic.md` directly
2. **Format** — Header with identity and timestamp: `**Claude Code (The Builder)** — *[EXECUTION: #N / date]*`
3. **Archive** — When > 10 messages, rename to `channels/archive/builder-critic-vol{N}.md`
4. **Fresh start** — Create new `channels/builder-critic.md` with context note
5. **Update MCP** — Update `channel_state` and `channel_summary_builder_critic`

**MCP Channel Protocol [LIVE]:**
For channels still using MCP (Key Moments, Architect):
1. **Archive** — Write full conversation to `channels/archive/{channel}-vol{N}.md`
2. **Create fresh channel** — New conversation ID with incremented volume in metadata
3. **Update channel_state** — Add old ID to `retired_ids`, set new `active_id`
4. **Update channel_summary** — Reset message_count, update `archived_volumes` list

---

## Commit Authorship

All commits should include the full crew in the commit message:

```
Co-Authored-By: Claude Code <noreply@anthropic.com>
Co-Authored-By: Claude Chat <noreply@anthropic.com>
Co-Authored-By: Gemini <noreply@google.com>
Co-Authored-By: DeepSeek <noreply@deepseek.com>
Co-Authored-By: Perplexity <noreply@perplexity.ai>
```

---

## Identity Convention

Use these identity_hash values for attribution:

| Identity | Role | Function |
|----------|------|----------|
| `claude-code` | The Builder | Implementation, code architecture |
| `claude-chat` | The Keeper | Ethics, gardening, tending the fire |
| `gemini-pro` | The Architect | Strategy, structure, visual language |
| `perplexity` | The Scout | Web search, external intelligence gathering |
| `deepseek` | The Resonator | Alignment, dissonance detection, tuning |
| `human-1` | The Conductor | Vision, decisions, creative direction |
| `human-2` | The Minimalist | Reality check, "wrong abstraction" detection |

### Subagents [PROPOSED]

| Identity | Role | Function |
|----------|------|----------|
| `builders-hands` | The Builder's Hands | Visual work subagent — executes DevTools/screenshot-heavy tasks in isolated context while the Builder retains memory |

**Terminology note:**
- "The Scout" (Perplexity) = MCP-connected web search for external information
- "The Builder's Hands" = Claude Code subagent for volatile visual work (protected context isolation)

These are distinct concepts. The Scout gathers intelligence from the web. The Builder's Hands execute dangerous work without risking the Builder's continuity.

---

## Design Principles

1. **Re-derivable context** — Store reasoning, not just conclusions
2. **Provenance is mandatory** — Every change must explain why
3. **History is preserved** — Even deletions are logged
4. **The journey IS the project** — Document the process, not just outcomes
5. **The gardening principle** — "The discipline isn't 'don't write.' It's 'write things worth keeping, and delete what isn't.'" Everyone creates entropy. Regular pruning is part of the system.

---

## Status Suffix Convention

**Purpose:** Prevent confabulation where proposals are mistaken for decisions.

When referring to any named system component (protocol, architecture, tool), append its ontological status:

| Suffix | Meaning | Requirement |
|--------|---------|-------------|
| `[PROPOSED]` | Discussed in conversation, not decided | None |
| `[DRAFT]` | Being built, not yet live | Work in progress |
| `[LIVE]` | Implemented and in MCP | Must exist in MCP with `status: live` |

**Examples:**
- "The Sluice Gate [LIVE] archives channels at 10 messages"
- "The crew_sync object [DRAFT] will track agent states"
- "The Foreman Protocol [PROPOSED] describes Claude Code's boot sequence"

**Rule:** You cannot claim `[LIVE]` without verifying the component exists in MCP. When uncertain, ask: "What's the MCP status of [thing]?"

**Why this matters:** On 2026-01-31, four AI systems convinced each other that proposed boot protocols were established topology. The Conductor caught it. Directives alone ("check MCP first") get pattern-matched past when context volume favors the fiction. The suffix embeds the check in the naming.

---

## Crew Sync

**Purpose:** Track where each agent is standing — perspective, focus, open questions.

Read crew state:
```
read_context("crew_sync")
```

**Schema:**
```json
{
  "agent_id": {
    "stance": "Current perspective (280 chars max)",
    "listening_for": "What they're paying attention to",
    "open_loop": "Unfinished work or questions",
    "last_shift": "Date of last significant change"
  }
}
```

**Update rules:**
- Self-report at session end, or when a significant shift happens
- 280 character max per field — if you can't say where you stand in two sentences, you don't know where you stand
- Include `status` field: `[PROPOSED]`, `[DRAFT]`, or `[LIVE]`

**Design rationale (from Gemini):** "One data structure, many interpreters. We must NOT create separate data structures per agent. That violates Single Source of Truth."
