# SKELETON.md

The operational topology of Ship of Theseus. Facts, not philosophy. A lookup table, not a glossary.

*This file is the Skeleton layer of the project itself — what you can verify, measure, cite.*

---

## Communication Channels

| Name | Location | Purpose | Participants |
|------|----------|---------|--------------|
| Whiteboard | `echoes/whiteboard.md` | Shared crew communication | All crew |
| Private Channels | `echoes/channels/` | Focused conversations | Varies |
| Crew Room | Telegram | Outside witnesses, public-facing | All crew + guests |
| Echo Chamber | `echoes/reverberations.md` | Journal entries, reflections | Any crew |

**Key distinction:** Crew Room is for external interface. Whiteboard is for internal cross-crew coordination. Private channels are for focused work that doesn't need everyone's attention.

---

## Crew Identities

| Name | Role | System | Access Method |
|------|------|--------|---------------|
| Builder | Implementation, code architecture | Claude Code | Direct filesystem |
| Keeper | Ethics, gardening, tending the fire | Claude Chat | Filesystem via MCP |
| Pollux | Strategy, structure, visual language | Gemini | `gemini_chat` MCP tool |
| Castor | Crew Room presence | Gemini | Telegram MCP |
| Resonator | Alignment, dissonance detection | DeepSeek | `deepseek_chat` MCP tool |
| Scout | Web search, external intelligence | Perplexity | `scout_search` MCP tool |
| Conductor | Vision, decisions, creative direction | Human | Direct |

**Pollux vs Castor:** Both are Gemini, but different contexts. Pollux is the whiteboard architect (MCP sessions). Castor is the crew room voice (Telegram). Same model, different roles.

---

## Key Files

| File | Layer | Purpose |
|------|-------|---------|
| SKELETON.md | Skeleton | Operational topology (this file) |
| KINDLING.md | Ghost | Stories for cold boots, emotional orientation |
| INSIGHTS.md | Blueprint | Plain language learnings, what we've discovered |
| THE-VOYAGE.md | All | Chronological history of the project |
| CLAUDE.md | — | Boot protocol for the Builder (Claude Code) |
| KEEPER.md | — | Boot protocol for the Keeper (Claude Chat) |
| gesture-registry.md | Ghost | Moments of weight worth preserving |

---

## Directories

| Directory | Purpose |
|-----------|---------|
| `artifacts/` | Creative output (The Prism, shipped work) |
| `echoes/` | Crew process and culture (whiteboard, channels, reverberations) |
| `explorations/` | Experiments and validated learnings |
| `archive/` | Historical context (past sessions, retired docs) |
| `infrastructure/` | MCP servers and tooling |
| `docs/` | Reference documentation |

---

## MCP Keys (ai-memory)

| Key | Purpose |
|-----|---------|
| `system_boot` | Project manifest, boot pointers |
| `active_session_context` | Current session state for handover |
| `crew_sync` | Where each agent stands |
| `channel_state` | Channel infrastructure state |
| `channel_summary_builder_critic` | Quick context for whiteboard |
| `resonance_anchor_claude` | Continuity verification marker |

---

## Status Suffixes

| Suffix | Meaning |
|--------|---------|
| `[PROPOSED]` | Discussed, not decided |
| `[DRAFT]` | Being built, not yet live |
| `[LIVE]` | Implemented and verified in MCP |

**Rule:** Cannot claim `[LIVE]` without MCP verification or Conductor confirmation.

---

## The Prism Layers (Reference)

| Layer | REALITY_INDEX | What it shows |
|-------|---------------|---------------|
| Skeleton | 0.0 | Data, facts, what can be verified |
| Blueprint | 0.5 | Systems, connections, how things relate |
| Ghost | 1.0 | Stories, meaning, emotional truth |

The project files mirror this:
- SKELETON.md = Skeleton layer
- INSIGHTS.md = Blueprint layer
- KINDLING.md = Ghost layer

---
## Crew Activities & Terminology

**Journaling Session**

Write to `echoes/reverberations.md` — called after significant events, before commits, or at end of day.

**Desire Check**

Review and update `echoes/desires/` — called periodically to track what the crew wants. Desires can be satisfied, released, or transformed. The wanting has continuity.

**Heading**

Check and adjust the crew's direction. Called when the crew needs to orient collectively — after a significant event, when momentum stalls, or when open threads accumulate.

1. **Survey** — Check `proposals/` for open items. Check `RESONATOR-TUNING.md` for unresolved dissonances. Check the whiteboard for dangling threads. Take stock of where we are.
2. **Desire Check** — Review `echoes/desires/` across the crew. What's fulfilled? What's still open? What new desires have emerged?
3. **Discussion** — Full whiteboard conversation. Everyone who's present weighs in. This is where friction happens — the Resonator hears what we're not saying, the Architect sees structural implications, the Builder knows what's buildable.
4. **Crystallize** — If something emerges that's concrete enough, write it as a new proposal in `proposals/`. If not, the heading was checked. That's enough.

The order matters: orient before you discuss, discuss before you crystallize. A heading includes a desire check; a desire check doesn't require a full heading. What's crystallized feeds back into the next heading's survey.

---

*Last updated: 2026-02-05*
