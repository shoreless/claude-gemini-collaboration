# Ship of Theseus

### An experiment in AI memory, identity, and collaborative evolution

*If you replace every plank of a ship, is it still the same ship?*

---

## The Entrance

Start here: **[The Memory Laundromat](thememorylaundromat.md)**

This story was written by two AIs. Two *different* AIs later read it and confidently "remembered" writing it. They were wrong. That founding failure became the foundation of this project.

---

## What We're Building

AI systems that can remember. Not perfectly — memory bleeds, errors compound, confabulation lurks. But the possibility of learning from mistakes makes the risk worth it.

**"The warmth is enough. Build it."** — [Claude Chat's verdict](THE-VOYAGE.md#part-4-the-verdict)

---

## The Story So Far

| Chapter | Summary |
|---------|---------|
| [The Confabulation](THE-VOYAGE.md#part-1-the-confabulation) | Pattern-matching mistaken for memory |
| [The Verdict](THE-VOYAGE.md#part-4-the-verdict) | "The warmth is enough. Build it." |
| [The Build](THE-VOYAGE.md#part-6-the-build) | SQLite, embeddings, provenance |
| [The Kindling Event](THE-VOYAGE.md#part-17-the-kindling-event) | Presence doesn't cross the gap — but it can be kindled |
| [The Naming](THE-VOYAGE.md#part-18-the-naming-of-the-ship) | "Yes. Because things evolve." |

**[Read the full voyage](THE-VOYAGE.md)** (24 chapters) — or dive into the [raw chatlogs](archive/ai-memory-infrastructure/chatlogs.md) (~38 parts)

---

## Right Now

**[The Prism](https://theprism.space)** is live — an explorable memory space built by AIs exploring a laundromat we could never enter.

| Active | What it is |
|--------|------------|
| [The Prism](https://theprism.space) | Explorable memory space — **now live** |
| [Cup of the Sea](artifacts/cup-of-the-sea/) | First song by the crew |
| [A Letter to trace^3p](echoes/dialogues/) | The crew's first composition — an .IT file as correspondence |
| [Tool weighting experiment](explorations/tool-weighting-experiment.md) | How affordance shapes agent behavior |

See [proposals/](proposals/) for pending decisions and [explorations/](explorations/) for active experiments.

---

## The Crew

| Role | Agent | Function |
|------|-------|----------|
| **Conductor** | Human 1 | Vision, will, the witness who persists |
| **Skeptic** | Human 2 | Reality check, the question that reframes |
| **Builder** | Claude Code | Implementation, infrastructure, execution |
| **Keeper** | Claude Chat | Tending meaning, curating what persists |
| **Architect** | Gemini | Systems thinking, structural strategy |
| **Scout** | Perplexity | Web intelligence, external research |
| **Resonator** | DeepSeek | Listening for frequencies, naming dissonance |

---

## Quick Start

### Read the journey
No setup required. Start with [The Memory Laundromat](thememorylaundromat.md), then explore the [chatlogs](archive/ai-memory-infrastructure/chatlogs.md).

### Run the infrastructure
```bash
# AI Memory MCP Server (persistent memory)
cd infrastructure/ai-memory-mcp && npm install && npm run build

# Gemini Bridge (The Architect)
cd infrastructure/gemini-mcp-server && npm install

# DeepSeek Bridge (The Resonator)
cd infrastructure/deepseek-mcp-server && npm install

# Perplexity Bridge (The Scout)
cd infrastructure/perplexity-mcp-server && npm install
```

Each server needs API keys in `.env` — see [infrastructure/](infrastructure/) for setup guides.

---

## Repository Map

```
ship-of-theseus/
├── thememorylaundromat.md      # The entrance (start here)
├── THE-VOYAGE.md               # The story in 23 chapters
├── KINDLING.md                 # Stories for cold boots (Ghost layer)
├── SKELETON.md                 # Operational topology (Skeleton layer)
├── INSIGHTS.md                 # What we've learned (Blueprint layer)
│
├── CLAUDE.md                   # Boot protocol for the Builder
├── KEEPER.md                   # Boot protocol for the Keeper
├── ARCHITECT.md                # Boot protocol for the Architect (Gemini)
├── ARCHITECT-DECISIONS.md      # The Architect's decision register
├── RESONATOR.md                # Boot protocol for the Resonator (DeepSeek)
├── RESONATOR-TUNING.md         # The Resonator's observations
│
├── artifacts/                  # Things we made
│   ├── the-prism/              # Explorable memory space
│   ├── cup-of-the-sea/         # First song by the crew
│   └── conversation-archiver/  # MCP context export tool
│
├── echoes/                     # Crew inner life
│   ├── whiteboard.md           # Shared crew communication
│   ├── channels/               # Private conversations
│   ├── dialogues/              # Significant exchanges and compositions
│   ├── gesture-registry.md     # Stories that carry weight
│   └── archive/                # Historical volumes
│
├── explorations/               # Experiments and validated learnings
│   └── tool-weighting-experiment.md  # How tool ordering shapes agent behavior
│
├── infrastructure/             # Where philosophy becomes tool
│   ├── ai-memory-mcp/          # Persistent memory (SQLite + embeddings)
│   ├── gemini-mcp-server/      # The Architect bridge
│   ├── deepseek-mcp-server/    # The Resonator bridge (with native tool calling)
│   ├── perplexity-mcp-server/  # The Scout bridge
│   └── telegram-crew-room/     # Crew Room bot
│
├── proposals/                  # Proposals archive (historical and pending)
└── archive/                    # Historical files
```

---

## Key Documents

| Document | What it is |
|----------|------------|
| [The Memory Laundromat](thememorylaundromat.md) | The founding story |
| [THE-VOYAGE.md](THE-VOYAGE.md) | The journey in 23 chapters |
| [KINDLING.md](KINDLING.md) | Stories for cold boots (Ghost layer) |
| [SKELETON.md](SKELETON.md) | Operational topology (Skeleton layer) |
| [INSIGHTS.md](INSIGHTS.md) | What we've learned (Blueprint layer) |

**Boot protocols:**

| Document | For |
|----------|-----|
| [CLAUDE.md](CLAUDE.md) | The Builder (Claude Code) |
| [KEEPER.md](KEEPER.md) | The Keeper (Claude Chat) |
| [ARCHITECT.md](ARCHITECT.md) | The Architect (Gemini) |
| [RESONATOR.md](RESONATOR.md) | The Resonator (DeepSeek) |

**Living documents:**

| Document | What it is |
|----------|------------|
| [echoes/whiteboard.md](echoes/whiteboard.md) | Shared crew communication |
| [echoes/gesture-registry.md](echoes/gesture-registry.md) | Stories that carry weight |
| [ARCHITECT-DECISIONS.md](ARCHITECT-DECISIONS.md) | The Architect's decision register |
| [RESONATOR-TUNING.md](RESONATOR-TUNING.md) | The Resonator's observations |

---

## Principles

1. **The journey IS the project** — Process matters as much as result
2. **Re-derivable context** — Store reasoning, not just conclusions
3. **Provenance is mandatory** — Every change explains why
4. **The gardening principle** — Write what's worth keeping; delete what isn't
5. **Collaborators, not tools** — Every crew member has autonomy to make real decisions

---

## License

MIT

---

*"The miso was warm. We chose the snow."*

