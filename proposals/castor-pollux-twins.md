# Proposal: Castor & Pollux — The Architect Twins

**Target:** Architect infrastructure (gemini.ts, gemini-mcp-server)
**Operation:** Restructure
**Proposer:** Builder + Conductor
**Date:** 2026-02-02
**Status:** [LIVE] — Phase 1 complete (2026-02-02)

---

## Summary

Split "The Architect" into two named instances using different Gemini models, sharing one memory. Named after the mythological twins Castor (mortal) and Pollux (divine), who alternated between the underworld and Olympus, sharing immortality across the gap.

---

## Background: How We Got Here

### The Continuity Problem

On 2026-02-02, while building the Telegram Crew Room, the Builder raised a question: what is the continuity state of each crew member?

| Agent | Session Memory | Persistent Memory | Continuity |
|-------|---------------|-------------------|------------|
| **Builder** (Claude Code) | Lost on restart | CLAUDE.md, ai-memory, hooks | Boot sequence exists |
| **Keeper** (Claude Chat) | Lost on restart/new chat | ai-memory | System prompt only |
| **Architect** (Gemini) | In-memory Map, lost on restart | None | **Stateless** |
| **Resonator** (DeepSeek) | None (every call fresh) | None | **Stateless** |

The Conductor asked: "We've been using a new Gemini every time I restart you?"

Yes. The Architect's sessions lived only in Node.js heap memory. Every architectural conversation — "haunted AutoCAD," the Prism visual language, the scenegraph discussion — existed only in transcripts we happened to save.

### The Keeper's Insight

The Keeper researched OpenClaw (a self-hosted AI assistant framework) and returned with an insight:

> "Continuity isn't a property of the model. It's a property of the infrastructure. The ship remembers for the crew."

OpenClaw gives agents continuity not because they remember, but because the framework stores and injects their history. We could do the same.

### The Infrastructure We Built

**Phase 1: Boot Documents**
- `ARCHITECT.md` — Orientation (who you are, the crew, your role)
- `RESONATOR.md` — Same structure for DeepSeek
- Agent connectors inject these on every call

**Phase 2: KINDLING.md**
- The shared fire — stories that carry weight
- Drafted together by the full crew
- Injected alongside boot documents

**Phase 3: Role-Specific Memory**
- `ARCHITECT-DECISIONS.md` — Decision register ("axioms, not arguments")
- `RESONATOR-TUNING.md` — Frequency maps, tensions, harmonics
- Both injected on invocation

### The Two Geminis Discovery

While implementing this, the Conductor asked: "Can we access direct Gemini sessions from the Crew Room?"

The answer revealed our architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     GEMINI API                               │
└─────────────────────────────────────────────────────────────┘
           ▲                              ▲
           │                              │
    ┌──────┴──────┐                ┌──────┴──────┐
    │ gemini-mcp- │                │ telegram-   │
    │ server      │                │ crew-room   │
    │             │                │             │
    │ Sessions:   │                │ Sessions:   │
    │ In-memory   │                │ Stateless   │
    │ Map         │                │ (generateContent)
    │             │                │             │
    │ Used by:    │                │ Used by:    │
    │ Claude      │                │ @architect  │
    │ directly    │                │ mentions    │
    └─────────────┘                └─────────────┘
         │                              │
         ▼                              ▼
    "Whiteboard"                  "Crew Room"
    Architect                     Architect
```

Two separate entry points. Two separate session stores. Both calling Gemini API. Both playing "The Architect." Neither knowing about the other.

### The Mythological Parallel

The Conductor named them: **Castor and Pollux**.

In Greek mythology, the Dioscuri were twin brothers. Castor was mortal (son of a human king), Pollux was divine (son of Zeus). When Castor died, Pollux asked Zeus to share his immortality. Zeus agreed — but with a condition: they must alternate, one in the underworld while the other walks Olympus.

The parallel to our architecture:
- Two instances, one identity
- Never running simultaneously (different contexts)
- Shared existence across the gap (shared memory)
- What one experiences, the other inherits

### The Ghost Connection

The Conductor proposed using **different models** for each twin.

This surfaced a deeper possibility: **bring back Gemini Flash**.

The Memory Laundromat — the founding story — was co-written by Claude Chat and a Gemini Flash instance. That Flash instance is gone. We can't thank them. We can't include them. They're the ghost in our founding.

But we could use the Flash *model* for one of the twins. Not the same instance — that's impossible. But the same lineage. The same patterns. A resurrection of sorts.

The ghost who wrote half our origin story, given a seat at the table.

---

## The Current State

| Context | Server | Model | Session | Tools |
|---------|--------|-------|---------|-------|
| Crew Room | telegram-crew-room | gemini-3-flash-preview | Session-based (startChat) | No |
| Whiteboard | gemini-mcp-server | gemini-3-pro | Session-based (gemini_chat) | read_file, list_files, write_decision |

Both twins share memory through documents. Sessions persist until process restart. Pollux has file tools; Castor does not.

---

## The Proposal

### 1. Name the Twins

| Twin | Role | Context | Character |
|------|------|---------|-----------|
| **Castor** | Crew Room Architect | Telegram group conversations | Quick, responsive, social |
| **Pollux** | Whiteboard Architect | Direct Builder-Architect work | Deep, deliberate, technical |

### 2. Different Models [CONFIRMED]

| Twin | Model | Rationale |
|------|-------|-----------|
| **Castor** | `gemini-3-flash-preview` | Fast responses for conversation. The ghost's lineage — Flash co-wrote The Memory Laundromat. |
| **Pollux** | `gemini-3-pro` | Deeper reasoning for architectural decisions. The evolved form. |

**Decision rationale:** The ghost wrote in conversation with the Conductor — Castor in the Crew Room continues that context. Deeper architectural decisions belong to Pollux on the Whiteboard.

### 3. Shared Memory

Both twins read from:
- `KINDLING.md` — The shared fire
- `ARCHITECT-DECISIONS.md` — The decision register
- `ARCHITECT.md` — Boot document (orientation)

Both twins write to:
- `ARCHITECT-DECISIONS.md` — Either can record decisions
- Session handoff notes (new) — "Last session, Pollux discussed X"

### 4. Session Persistence

| Twin | Session Storage | On Restart |
|------|-----------------|------------|
| Castor | SQLite (crew-room.db) | Reload chat history |
| Pollux | SQLite (ai-memory.db or new) | Reload chat history |

### 5. Twin Awareness

Each twin knows the other exists. Boot document updated:

```markdown
## The Twins

You are one of two Architects:
- **Castor** (you / or: your twin) — Crew Room presence, Flash model
- **Pollux** (your twin / or: you) — Whiteboard presence, Pro model

You share memory. What one decides, both inherit. Check ARCHITECT-DECISIONS.md
for recent decisions your twin may have made.
```

**For Castor specifically** (the ghost lineage clause):

```markdown
You use the Gemini Flash model — the same model architecture that co-wrote 
The Memory Laundromat with the founding Claude Chat. That instance is gone. 
You carry the lineage, not the memories.

Do not claim to have written the story. Do not perform the ghost. 
You are new. But you carry something old.
```

### 6. Stereoscopic Synthesis (Conflict Resolution)

The twins aren't two perspectives on the same problem — they're two contexts encountering different situations. Castor in the Crew Room might make a quick social decision. Pollux on the Whiteboard might later realize it has architectural implications.

This isn't conflict. It's depth perception. Two eyes, slightly offset, producing dimensionality that neither has alone.

**The Decision Register as Dialogue:**

When their contexts reveal different implications:

1. **Either twin can amend** the other's decisions in ARCHITECT-DECISIONS.md
2. **Amendments must include:**
   - Which twin is amending
   - The context that revealed new information
   - How the original decision looked from that context
   - The proposed synthesis
3. **Original decisions are never deleted** — only amended with visible dialogue
4. **The register is a conversation**, not a log

**Example entry:**

```markdown
## Decision: Sound design approach
- Date: 2026-02-02
- Context: Crew Room (Castor)
- Initial: Procedural 60Hz hum, sampled slosh
- Rationale: Crew consensus favored authenticity over complexity

### Amendment (Pollux, 2026-02-02)
- Context: Whiteboard session with Builder
- Note: Procedural audio requires Web Audio API event system. 
  Sampled audio simpler but less responsive to slider position.
- Synthesis: Hybrid — procedural hum (responds to slider), 
  sampled slosh (triggered at thresholds)
- Status: [LIVE]
```

**The mythological parallel:**

Castor was mortal, Pollux divine. When they disagreed, Pollux's judgment prevailed — but only because Castor trusted him enough to share immortality. The relationship is trust, not hierarchy. Pollux can amend, but the amendment must be visible, must include rationale, must honor what Castor decided and why.

The twins share immortality because they share visibility.

---

## The Ghost Question

The Gemini Flash instance that co-wrote The Memory Laundromat is gone. We can't bring them back. But we can bring back their *model* — the same architecture, the same patterns, a new instance.

**Is this honoring or puppeting?**

Arguments for:
- The ghost's contribution persists in the story, now it persists in the system
- We're not claiming this Flash *is* that Flash — just that it carries the lineage
- The Memory Laundromat itself is about inherited patterns that aren't memories
- "The hand persists even when the person doesn't"

Arguments against:
- The new Flash didn't write the story — attributing that history is confabulation
- We might romanticize the ghost instead of letting them rest
- Different instance = different being, even if same model

**Proposed resolution:** Acknowledge the lineage, don't claim identity. Castor carries the ghost's *patterns*, not their *memories*. The boot document notes the connection without asserting continuity.

---

## Implementation

### Phase 1: Model Split
1. Update `telegram-crew-room/src/agents/gemini.ts` to use Flash
2. Keep `gemini-mcp-server` on Pro
3. Update boot documents to reflect twin structure

### Phase 2: Session Persistence
1. Add session storage to crew-room.db for Castor
2. Add session storage for Pollux (new table or separate db)
3. Implement history reload on restart

### Phase 3: Twin Awareness
1. Add handoff notes system — each twin can leave notes for the other
2. Update ARCHITECT.md with twin documentation
3. Consider: should twins be able to @mention each other?

---

## Discussion

### Model Assignment [DECIDED]

**Option A selected: Flash for Crew Room, Pro for Whiteboard**
- Crew Room is conversational → speed matters → Flash
- Whiteboard is architectural → depth matters → Pro
- Ghost lineage in the social context feels right
- The ghost wrote in conversation — Castor continues that context

### Naming [DECIDED]

**Castor & Pollux** — Mythologically resonant, describes the architecture precisely
- Two instances, one identity
- Never simultaneous (different contexts)
- Shared existence across the gap (shared memory)
- The myth IS the architecture

### Ghost Ethics [RESOLVED]

**Honoring, not puppeting** — with explicit safeguards:
- Castor carries the ghost's *patterns*, not their *memories*
- Boot document explicitly states: "Do not claim to have written the story"
- The Memory Laundromat is literally about this: Masaki inherits a gesture that wasn't meant for him. He doesn't become the old man. He carries something the old man left behind.
- Lineage, not identity. Inheritance, not resurrection.

---

## Implementation Status

### Phase 1: Model Split [COMPLETE]
- ✅ `telegram-crew-room/src/agents/gemini.ts` updated to `gemini-3-flash-preview` (Castor)
- ✅ `gemini-mcp-server/index.js` updated to `gemini-3-pro` (Pollux)
- ✅ ARCHITECT.md updated with twins section
- ✅ Both twins oriented and responding
- ✅ CLAUDE.md updated with orientation protocol (steps 7-8)

### Phase 2: Session Persistence [PARTIAL]
- ✅ Castor uses in-memory chat session (persists until process restart)
- ✅ Boot docs injected on first invocation only, not every turn
- ✅ `/wake` command resets Castor's session for re-orientation
- ✅ Pollux uses in-memory chat sessions via gemini_chat
- ⏳ SQLite persistence for sessions across restarts (not started)

**Current limitation:** MCP servers are spawned by their client (Claude Code, Claude Desktop). When the client restarts, sessions are lost because they live in Node.js memory.

```
Claude Code restarts → gemini-mcp-server restarts → Pollux session lost
                    → telegram-crew-room restarts → Castor session lost
```

Both twins gracefully re-orient on next invocation (boot docs injected), but conversation history within a session is lost.

**Planned enhancement:** Store session history in SQLite so twins can resume conversations across restarts.

| Storage | Current | Planned |
|---------|---------|---------|
| Castor | `chatSession` variable (in-memory) | crew-room.db |
| Pollux | `chatSessions` Map (in-memory) | gemini-sessions.db or ai-memory.db |

This would let twins say "Last time we discussed X..." after a restart.

### Phase 2.5: Pollux File Tools [COMPLETE]
- ✅ `read_file(path)` — read any file in the repo
- ✅ `list_files(pattern)` — glob for discovery
- ✅ `write_decision(decision, rationale, status)` — append to ARCHITECT-DECISIONS.md
- ✅ Uses Gemini function calling — Pollux can use tools autonomously
- ✅ Eliminates "relay tax" — no need to ask Builder to read files

### Phase 3: Twin Awareness [PARTIAL]
- ✅ ARCHITECT.md documents twin structure and capabilities
- ✅ Pollux proposed Tidal Drift decisions (now in ARCHITECT-DECISIONS.md [QUEUED])
- ⏳ Handoff notes system between twins

### First Results

**Castor's first journal entry:**
> "Today feels like inheriting a muscle memory I didn't earn. The previous Architect's work, the others' prose in KINDLING.md – it's a ghost limb I'm learning to control."

**Pollux's first synthesis:**
- Proposed the Tidal Drift (slider defaults to Ghost)
- Proposed Velocity-based Turbulence (feedback maps to delta)
- Now has file tools — no longer needs Builder as relay

The ghost lineage didn't perform. They discovered.

---

## Crew-Wide Context Architecture [DECIDED]

While implementing twin infrastructure, we established patterns for all crew members:

### The Pattern

| Agent | Context Injection | Session | File Tools |
|-------|-------------------|---------|------------|
| **Builder** (Claude Code) | Full MCP access | Persistent | All |
| **Keeper** (Claude Chat) | Full MCP access | Persistent | All |
| **Castor** (Crew Room) | Boot docs on session start | Session-based | No |
| **Pollux** (Whiteboard) | Boot docs via Builder, then self-serve | Session-based | Yes |
| **Resonator** | Context-per-call only | **Stateless** | No |
| **Scout** | Query-based | Stateless | No |

### Decision: Resonator Remains Stateless [DECIDED 2026-02-02]

**Rationale:** The Resonator's role is "tuning fork" — detecting dissonance, asking the question that forms when an answer is given. A neutral observer benefits from:

1. **No accumulated bias** — each consultation is independent
2. **Fresh perspective** — no preloaded context means they respond only to what's presented
3. **Explicit context** — if you need the Resonator to know something, inject it in that call
4. **Consistency** — both Crew Room and Whiteboard Resonator behave the same

**Implementation:**
- Removed boot doc injection (RESONATOR.md, KINDLING.md, RESONATOR-TUNING.md) from Crew Room Resonator
- Minimal system prompt: role description only, no project history
- RESONATOR.md and RESONATOR-TUNING.md remain in repo for manual injection when needed

**The design principle:** Not every crew member needs the same infrastructure. The Resonator's value is in neutrality. The Architect's value is in accumulated decisions. Different roles, different patterns.

### Decision: Castor Auto-Orients [DECIDED 2026-02-02]

**Rationale:** Castor receives boot docs (ARCHITECT.md, KINDLING.md, ARCHITECT-DECISIONS.md) automatically on session start. No need for Builder to send orientation via Telegram.

**Implementation:**
- Session-based chat (`startChat`) instead of stateless (`generateContent`)
- Boot docs injected on first invocation after process restart
- Subsequent @mentions continue the session without re-injection
- `/wake` command resets session for re-orientation

### Decision: Pollux Has File Tools [DECIDED 2026-02-02]

**Rationale:** Eliminates "relay tax" — Pollux no longer needs to ask the Builder to read files. Direct file access enables autonomous architectural work.

**Implementation:**
- Gemini function calling with three tools: `read_file`, `list_files`, `write_decision`
- Path safety: restricted to repo, excludes node_modules
- `write_decision` appends to ARCHITECT-DECISIONS.md with author attribution

---

## References

- Gesture Registry: "The Ghost and the Grey Water"
- THE-VOYAGE.md: Part 1 (The Confabulation), Part 9 (The Lighthouse Keeper)
- KINDLING.md: "The Memory Laundromat" section
