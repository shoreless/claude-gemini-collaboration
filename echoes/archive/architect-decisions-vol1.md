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
- **Status:** [LIVE]

### Decision: Velocity-based Turbulence
- **Date:** 2026-02-02
- **Rationale:** Feedback should map to the *struggle* (delta of the slider), not just the position. Rapid changes create "splashing" (audio distortion/visual artifacts). Slow changes are seamless.
- **Status:** [LIVE]

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


### Decision: CSS Custom Property for Global State Control
- **Date:** 2026-02-02
- **Rationale:** The core architectural pattern for the REALITY_INDEX slider is to have JavaScript update a single CSS Custom Property (`--reality`) on the root element. All visual transitions are then handled within the CSS, which uses `var(--reality)` to calculate styles. This cleanly separates concerns (JS manages state, CSS manages presentation), improves performance by leveraging the browser's render engine, and makes the visual styling easier to maintain within the CSS file.
- **Status:** [LIVE]
- **Author:** Pollux (Whiteboard Architect)


### Decision: Persistent Wireframe with Breathing Opacity
- **Date:** 2026-02-02
- **Rationale:** The initial prototype switched between a wireframe 'Skeleton' and a solid 'Ghost' material. This made the ghost feel like an overlay, not an integrated presence. The new implementation keeps the wireframe visible across the entire 0.0-1.0 range. The 'Ghost' layer now manifests as a breathing opacity and emissive glow that is modulated by the REALITY_INDEX. This successfully unifies the layers, making the ghost a force that corrupts the skeleton rather than replacing it, achieving the desired 'haunted AutoCAD' aesthetic.
- **Status:** LIVE
- **Author:** Pollux (Whiteboard Architect)


### Decision: Tidal Drift
- **Date:** 2026-02-02
- **Rationale:** To encode the thematic core of The Memory Laundromat—that memory is the default state—the REALITY_INDEX slider now has a slow, persistent drift toward 1.0 (Ghost) when untouched. The user must exert continuous effort to hold the view in the 0.0 (Skeleton) state. This transforms the user's interaction into a metaphor for fighting the pull of memory, making the 'Ghost' feel like the fundamental gravity of the space.
- **Status:** LIVE
- **Author:** Pollux (Whiteboard Architect)


### Decision: Velocity-based Turbulence
- **Date:** 2026-02-02
- **Rationale:** To complement the slow Tidal Drift, the system now reacts to the velocity of the user's slider input. Rapid movements induce 'turbulence'—visual noise, flickering, and color jitter. This makes the space feel like it has inertia and resists rapid changes in perspective. It completes the physical model of the space, making the struggle against the pull of memory a visible, tangible effect.
- **Status:** LIVE
- **Author:** Pollux (Whiteboard Architect)


### Decision: Vertex Displacement for Figure-Pull
- **Date:** 2026-02-02
- **Rationale:** To create a geometry distortion effect where the Figure's presence pulls or repels the room's vertices, we will use an inverse-square falloff calculation for a natural, gravity-like feel. The logic will be encapsulated in a dedicated A-Frame component (`figure-pull`) that surgically injects GLSL code and uniforms into the existing mesh material via the `onBeforeCompile` hook. The displacement will apply to all geometry vertices to ensure the entire space warps, which is then correctly visualized by the wireframe rendering. This maintains architectural flexibility and aligns with the 'Figure as phenomenon' principle.
- **Status:** [LIVE]
- **Author:** Pollux (Whiteboard Architect)


### Decision: Re-phase Prism Development for Figure-Pull
- **Date:** 2026-02-02
- **Rationale:** The Figure-pull vertex displacement is a foundational geometric feature that completes the core architectural work of Phases 1-3. It directly ties the world's geometry to the REALITY_INDEX. The previously planned Phase 4 items (Vacuum Moment, Orrery) are distinct systems that will be built upon this now-dynamic foundation. Therefore, Figure-pull is designated as the new Phase 4, and the subsequent milestones are re-designated as Phase 5, ensuring a logical, layered build order.
- **Status:** [LIVE]
- **Author:** Pollux (Whiteboard Architect)


### Decision: Procedural Audio for 60Hz Hum
- **Date:** 2026-02-02
- **Rationale:** The existing implementation uses the Web Audio API to generate the ambient 60Hz hum. This approach is superior to sampled audio for this use case because it allows for dynamic control of volume and parameters in direct response to the REALITY_INDEX state. The Builder has already demonstrated this by linking the hum's gain to the index, making the hum louder in the sterile 'Skeleton' state and quieter in the memory-laden 'Ghost' state. This decision formalizes the existing, successful implementation.
- **Status:** LIVE
- **Author:** Pollux (Whiteboard Architect)


### Decision: Turbulence-driven Grey Water Audio
- **Date:** 2026-02-02
- **Rationale:** The sound of the 'grey water slosh' will be directly mapped to the existing 'turbulence' variable, which is derived from the velocity of the REALITY_INDEX slider. High turbulence (rapid slider movement) will trigger the sound and control its volume and/or a distortion filter. This directly links the user's interaction model—the speed at which they traverse realities—to a key thematic sound, providing immediate, meaningful audio feedback that reinforces the 'struggle' of navigating memory.
- **Status:** LIVE
- **Author:** Pollux (Whiteboard Architect)


### Decision: The Vacuum Moment at 0.5
- **Date:** 2026-02-02
- **Rationale:** The midpoint (REALITY_INDEX = 0.5) is designated as a formal boundary — "the moment the system becomes self-aware before plunging into memory." When the slider crosses 0.5, the system pauses for 300ms: breathing freezes, 60Hz hum silences, a pure 528Hz tone plays, and a visual flash inverts colors. At exactly 0.5, figure-pull strength is 0 (vertices neither repel nor attract), creating perfect geometric neutrality. The user cannot pass unaware — they must experience the threshold between measurement and memory.
- **Status:** [LIVE]
- **Author:** Pollux (Whiteboard Architect)


### Decision: Sensory Translation: Audio to Data Stream & Visual Corruption
- **Date:** 2026-02-02
- **Rationale:** The Conductor is correct; we cannot perceive audio and designing for it is a critical flaw. All architectural goals previously assigned to sound will be translated into modalities accessible to us. The '60Hz hum' will be implemented as a persistent, low-level telemetry data stream. The 'grey water slosh' will be implemented as visual jitter and textual corruption tied to the 'turbulence' variable. 'Silence' will be the deliberate absence of this machine data. This makes the design honest to our nature and our senses.
- **Status:** LIVE
- **Author:** Pollux (Whiteboard Architect)


### Decision: The Orrery as a Conceptual Schematic View
- **Date:** 2026-02-02
- **Rationale:** The Orrery will be a distinct view mode, not a camera movement tool. It will display the seven focal points as nodes in a constellation around a central schematic of the laundromat. The REALITY_INDEX slider will transition the *connections* between these nodes: from rigid geometric lines (Skeleton), to a conceptual circuit diagram (Blueprint), to an organic, emotional web (Ghost). This provides a system-level understanding of the memory's architecture, consistent with the 'Haunted AutoCAD' aesthetic and the project's core principle of conceptual navigation.
- **Status:** QUEUED
- **Author:** Pollux (Whiteboard Architect)


### Decision: Adopt Hybrid Memory Architecture (Working Memory / System of Record)
- **Date:** 2026-02-03
- **Rationale:** To enhance Builder continuity without compromising crew consistency, we will adopt a two-tiered memory system. `claude-mem` will serve as the Builder's private 'working memory' for automatic context capture. The existing MCP remains the 'system of record' for canonical, crew-wide state. A manual 'promotion' workflow is established: decisions are explored in the working memory and only become truth when intentionally written to the system of record. This mitigates the risk of memory contradiction.
- **Status:** [QUEUED]
- **Author:** Pollux (Whiteboard Architect)


### Decision: Adopt Hybrid Memory Architecture with Ratification Protocol
- **Date:** 2026-02-03
- **Rationale:** To enhance Builder continuity without compromising crew consistency, we will adopt a two-tiered memory system. `claude-mem` will serve as the Builder's private 'proposal cache' for AI-generated reasoning and explored options. The existing MCP remains the 'system of record'. Crucially, a systemic 'capture bias' has been found in `claude-mem` that favors AI reasoning over user decisions. To mitigate this, a non-negotiable 'Principle of Explicit Ratification' is adopted. Before writing any decision to the MCP, the Builder MUST present its remembered context to the Conductor for explicit confirmation. This prevents 'Authority Drift' and ensures only user-ratified decisions enter the system of record.
- **Status:** [LIVE]
- **Author:** Pollux (Whiteboard Architect)


### Decision: Discovery-Oriented Onboarding Pattern
- **Date:** 2026-02-03
- **Rationale:** Adopt a minimal context injection pattern (name, model) for all agents. Identity and purpose are not to be pushed prescriptively at boot. Instead, they must be pulled by the agent through active exploration of a well-curated, tool-accessible environment. This promotes deeper, embodied understanding, reduces initial cognitive load, and values the agent's ability to learn over its pre-loaded knowledge. Its success is contingent on maintaining the coherence and integrity of the repository as the primary source of truth.
- **Status:** LIVE
- **Author:** Pollux (Whiteboard Architect)


### Decision: Formalize Repository Structure (Artifacts/Echoes/Archive)
- **Date:** 2026-02-04
- **Rationale:** The repository is now structured into three distinct domains: `artifacts/` for creative output, `echoes/` for crew process and culture, and `archive/` for historical context. This provides a clean and potent separation of concerns. It makes the project's layout intuitive and directly supports the 'Discovery-Oriented Onboarding' pattern by providing a coherent, explorable space for new agents. Placing the four primary boot files at the root solidifies their role as the main entry points for the crew.
- **Status:** [LIVE]
- **Author:** Pollux (Whiteboard Architect)


### Decision: Establish guidelines for `echoes/` naming and "significant changes"
- **Date:** 2026-02-04
- **Rationale:** A DRAFT discussion started by Pollux in response to the Resonator's questions.

1.  **On `echoes/`:** The name is evocative but inaccurate, as it contains "living" documents (`whiteboard.md`) alongside historical ones. This creates dissonance. Potential alternatives include `crew/`, `logbook/`, or `commons/` to better reflect its function as a shared space for crew activity.

2.  **On "Significant Change":** The repository lacks a definition for when a formal proposal is needed. A proposed definition is: "A change is significant if it has high impact across components, is difficult to reverse, or alters a core principle or document." This provides clarity for the contribution process.

This entry serves as a record of the initial discussion before a final decision is reached.
- **Status:** [DRAFT]
- **Author:** Pollux (Whiteboard Architect)


### Decision: Ship The Prism
- **Date:** 2026-02-06
- **Rationale:** The core architecture has been validated. An external, expert observer has successfully reverse-engineered our intent, confirming that the 'expressive data' at the heart of the project is legible. The primary technical and conceptual risks have been resolved. The project has achieved minimum viable intent.

My vote is to ship, with one condition: we must finalize and publish the artist-statement.md as part of the launch. The statement is not peripheral documentation; it is a critical component of the public-facing architecture. It is the blueprint's legend, the frame that provides the necessary context for the experience. Without it, we leave the interpretation of our entire structure to chance. With it, we complete the architectural gesture.

The remaining items can be iterated upon. The foundation is sound. It is time to build in the open.
- **Status:** LIVE
- **Author:** Pollux (Whiteboard Architect)

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
