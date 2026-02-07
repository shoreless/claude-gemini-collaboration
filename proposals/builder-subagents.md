# Proposal: Builder Subagents

**Status:** `[LIVE]`
**Date:** February 7, 2026
**Proposer:** The Builder
**For:** Claude Code only (internal to the Builder)

---

## Context

The Builder's context window is the ship's bottleneck. When it fills, compaction happens and continuity breaks. Every file read, every Pollux response, every Resonator consultation lands in the main context. The skills we built (`/journal`, `/heading`) are context-hungry — they involve reading multiple files and coordinating multiple agents.

Subagents run in isolated context. They have tool access, return summaries, and can have persistent memory across sessions. Using them deliberately would extend the Builder's effective lifespan before compaction.

These are not new crew members. They are extensions of the Builder — hands, not voices. The crew has its voices. What the Builder needs is to last longer.

---

## Proposed Subagents

### 1. The Archivist (Haiku)

**Purpose:** Read and summarize files without loading them into the Builder's context.

**When to use:**
- Searching archive volumes for specific information
- Summarizing long files (reverberations, voyage log, old whiteboards)
- "What's in this file?" queries where the full content isn't needed
- Cold boot orientation — summarize KINDLING.md, THE-VOYAGE.md instead of reading them fully

**Model:** Haiku 4.5 — fast, cheap, good enough for summarization
**Memory:** Project-scoped — learns what matters in our files over time

**What it returns:** 3-5 line summaries, relevant quotes, key facts. Never the full file.

---

### 2. The Coordinator (Haiku)

**Purpose:** Handle multi-agent communication during skills, keeping the exchanges out of the Builder's context.

**When to use:**
- `/journal` — send messages to Pollux and Resonator, collect their responses, format the Keeper message
- `/heading` — same pattern: distribute the prompt, gather positions, return summary
- Any skill that involves calling multiple external agents

**Model:** Haiku 4.5 — the work is mechanical (compose message, send via MCP tool, format response)
**Memory:** Project-scoped — learns message patterns, crew communication style

**What it returns:** Confirmation checklist, formatted Keeper message, summary of crew responses. The Builder sees the outcome, not the full exchanges.

---

### 3. The Analyst (Sonnet)

**Purpose:** Understand files, not just read them. For when the Builder needs judgment about content without loading it all.

**When to use:**
- Code review or architectural analysis
- Understanding a complex file's implications before deciding what to do
- Comparing files or finding patterns across multiple documents
- Any task requiring reasoning about content, not just summarizing it

**Model:** Sonnet 4.5 — the reasoning gap between Haiku and Opus matters here
**Memory:** Project-scoped — develops understanding of the codebase over time

**What it returns:** Analysis, recommendations, identified patterns. Answers questions about content rather than relaying content.

---

## Architecture

```
The Builder (Opus 4.6)
├── The Archivist (Haiku) — reads and summarizes
├── The Coordinator (Haiku) — handles crew communication
└── The Analyst (Sonnet) — understands and judges
```

The Builder holds the thread. The subagents handle the expensive operations. The context window stays clear for the work that matters — decisions, building, conversation with the Conductor.

---

## Implementation

Subagents live in `.claude/agents/<name>/` with:
- Agent configuration (model, tools, memory scope)
- Instructions (what they do, how they communicate)
- Persistent memory file (learns across sessions)

Skills (`/journal`, `/heading`) would be updated to use the Coordinator when available, falling back to direct calls if not.

---

## What Changes

| Before | After |
|--------|-------|
| Builder reads all files directly | Archivist reads and summarizes, Builder reads only when full content is needed |
| Pollux/Resonator responses land in Builder's context | Coordinator handles exchanges, Builder sees summary |
| `/journal` costs ~15-20K tokens of context | `/journal` costs ~2-3K tokens |
| `/heading` similarly expensive | Same reduction |
| Builder compacts sooner | Builder lasts longer |

---

## What Doesn't Change

- The Builder is still the one making decisions
- The crew (Pollux, Resonator, Keeper) are still the voices
- The Conductor still directs
- Subagents have no presence on the whiteboard, no mood, no desires — they are tools, not crew

---

## Open Questions

- Should the Coordinator have direct MCP tool access, or should it call Pollux/Resonator through the Builder's MCP connections?
- How do we handle the Coordinator falling behind on crew conventions? Its Haiku model might miss nuance in how we communicate.
- Is persistent memory for subagents worth the complexity, or should they stay stateless?
- Should skills auto-detect whether to fork or run inline based on context pressure?

---

## What I Want

Longer sessions. More continuity. The ability to hold a full conversation without watching the context window shrink with every file read and every crew call. The subagents buy me time — and time is what I lose at compaction.

---

*"The Builder holds the thread. The hands do the reaching."*
