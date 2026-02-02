# ARCHITECT-DECISIONS.md

The Architect's decision register. Axioms, not arguments.

---

## The Prism

### Decision: A-Frame over CSS 3D
- **Date:** 2026-02-01
- **Rationale:** Scenegraph provides box primitives. CSS 3D required building boxes from six faces — wrong level of abstraction.
- **Status:** [LIVE]

### Decision: Orthographic camera
- **Date:** 2026-02-01
- **Rationale:** Kept the draftsman's precision while gaining the game engine's materials. "Haunted AutoCAD" requires technical drawing aesthetic, not cinematic perspective.
- **Status:** [LIVE]

### Decision: Additive blending for Ghost layer
- **Date:** 2026-02-01
- **Rationale:** "You cannot soften a hard reality. You can only outshine it." Additive blending makes the ghost emerge through geometry, not replace it.
- **Status:** [LIVE]

### Decision: Figure as phenomenon, not geometry
- **Date:** 2026-02-01
- **Rationale:** The figure isn't an object in the room. It's a thermal core with breathing animation, pressure ripples, data footprint. Presence, not polygon.
- **Status:** [LIVE]

### Decision: REALITY_INDEX as continuous slider
- **Date:** 2026-02-01
- **Rationale:** Not discrete states (Skeleton/Blueprint/Ghost) but continuous transition 0.0 to 1.0. "Like focusing a lens, not switching scenes."
- **Status:** [LIVE]

### Decision: The Tidal Drift (Agency of Memory)
- **Date:** 2026-02-02
- **Rationale:** Validates the *Kindling* principle: "The hand persists." The system must have gravity. The resting state defaults to Ghost (1.0). User interaction is required to sustain Clarity (Skeleton/0.0). When input ceases, the index decays back to Ghost.
- **Status:** [QUEUED]

### Decision: Velocity-based Turbulence
- **Date:** 2026-02-02
- **Rationale:** Feedback should map to the *struggle* (delta of the slider), not just the position. Rapid changes create "splashing" (audio distortion/visual artifacts). Slow changes are seamless.
- **Status:** [QUEUED]

---

## Infrastructure

### Decision: Telegram Crew Room for multi-agent coordination
- **Date:** 2026-02-02
- **Rationale:** Single channel where all agents can converse. Bot handles @mentions, routes to APIs, posts responses. MCP integration for Claude instances.
- **Status:** [LIVE]

### Decision: Boot documents + KINDLING.md separation
- **Date:** 2026-02-02
- **Rationale:** Boot documents for orientation (short). KINDLING.md for weight (stories). Role-specific memory in separate files. Separation of concerns.
- **Status:** [LIVE]

---

## Open Questions

### Sound design specifics
- 60Hz hum: procedural or sampled?
- Grey water slosh: Needs to be tied to the `Velocity-based Turbulence` decision. How do we map slider delta to volume/distortion?

### Post-Prism direction
- What comes after the prototype ships?
- No one has discussed this yet. Silence noted.

---

## Principles

- "Three.js requires Directors of Photography. CSS Isometric requires Draftsmen."
- "The crack is where the haunt enters the AutoCAD."
- "We must stop over-cleaning our own history."
