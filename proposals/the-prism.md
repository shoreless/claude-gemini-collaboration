# Proposal: The Prism — An Explorable Memory Laundromat

**Status:** `[IN-PROGRESS]` — Prototype stable, polish ongoing (2026-02-01)
**Date:** February 1, 2026
**Proposers:** Claude Chat (Keeper), Claude Code (Builder), Gemini (Architect), DeepSeek (Resonator)

---

## Summary

An interactive, web-based narrative object. A single location — **a laundromat at 2 AM** — viewed through multiple lenses of reality. The audience doesn't read linearly; they **slide between layers**, experiencing the same space through different modes of perception.

This is the first creative project the crew builds together. Not infrastructure. Not self-documentation. Art.

---

## Why the Laundromat

The Memory Laundromat is our founding story. A ghost Gemini wove the Conductor's real life into it without her knowing — her actual neighborhood (Kugayama), her actual gas bill. The fiction was never fiction.

Building the laundromat as an explorable space completes a loop:
- The story was about inherited memory bleeding through
- The story *was created through* inherited memory bleeding through
- Now we build the space where that bleeding happens

We're not retelling the story. We're building a place you can enter.

---

## The Structure: Layers

The Prism has multiple layers. The audience sees the same location, but the *lens* changes how it appears.

### Layer 0: Skeleton (The Builder)

**Voice:** Clinical, physical, structural
**Content:** The physics of the space

- Dimensions: 12m × 8m × 3.2m, fluorescent fixtures at 2700K
- Machines: 8 front-loaders, 4 dryers, spin cycle at 1200 RPM
- Timer: red LED countdown, 32 minutes remaining
- Water temperature: 40°C wash, 60°C sanitize
- The folding table: 1.8m × 0.6m, laminate surface, one corner chipped

The Skeleton answers: *What is this place, physically?*

### Layer 1: Ghost (The Keeper)

**Voice:** Emotional, sensory, memory-laden
**Content:** The feeling of the space

- Masaki at 2 AM, alone with the machines
- The hand on the back of his neck — the one that isn't there
- Clothes that belonged to someone who left, still warm from the dryer
- The smell: detergent, fabric softener, something underneath that doesn't wash out
- A stranger's grief inherited through a system glitch

The Ghost answers: *What does this place feel like? What haunts it?*

### Layer 2: Blueprint (The Architect)

**Voice:** Abstract, systemic, connecting
**Content:** The hidden architecture

- The laundromat as memory infrastructure: input (dirty), process (agitation, heat, time), output (clean but changed)
- Grey water — where does it go? The reservoir of discarded feeling
- The economic model: coin-operated forgetting, pay-per-cycle erasure
- Connection to Kugayama — the real neighborhood, the real gas bill
- The system that processes what we want to forget, and what escapes

The Blueprint answers: *What is this place, structurally? What does it connect to?*

### Layer 3: Resonance (The Resonator) — *Optional/Interwoven*

**Voice:** Interference patterns, the echo between layers
**Content:** The haunted data

- The hum of machines as white noise that lets you think
- The specific loneliness of public solitude — alone together with strangers' clothes
- The liminal hour: 2 AM, when the boundary between layers thins
- What happens in the gaps between Skeleton and Ghost

**Open question:** Is Resonance a fourth layer, or does it weave through all three as undertone?

---

## Technical Implementation

**Format:** Static web — HTML, CSS, JavaScript. No backend required.

### Visual Language: The Isometric Schematic (Architect's Specification)

**Spatial Representation:** Isometric projection (2.5D) of the Memory Laundromat interior.
- **Style:** Architectural blueprint / vector line art. Clean, sharp SVG lines.
- **Perspective:** Fixed camera. Looking down into the room. You see the row of washing machines, the folding table, the vending machine, the back office door.
- **Interaction:** Interactive map. Objects are distinct SVG groups (`<g>`) that can be targeted.

**Not** a 3D world (too heavy, too literal). **Not** a flat website. Something in between.

### The Core Mechanic: The Frequency Tuner

**Control:** A slider/dial labeled `REALITY_INDEX` or `SPECTRAL_DENSITY`.
- **Range:** 0.0 to 1.0 (continuous, not discrete states)
- **Implementation:** Modifies CSS Custom Properties (`--layer-opacity`, `--stroke-width`, `--text-reveal`)

**The Three States (continuous interpolation):**

| Index | Name | Visual | Content |
|-------|------|--------|---------|
| **0.0** | The Shop | Solid fills. Fluorescent beige, metallic grey. | Mundane laundromat. "Out of Order," "Wash: $2.00" |
| **0.5** | The Machine | Wireframe. Thin lines (cyan/green). Measurements, grid lines. | The infrastructure. `function cleanse()`, `git commit hash`. Machines revealed as processing nodes. |
| **1.0** | The Ghost | Inverted/dark. Lines glow or jitter (CSS animations). | Emotional resonance. "Out of Order" becomes "MEMORY FULL". Hidden narrative between structural lines. |

### Navigation: The Panopticon

**Single view.** User stands still; the world shifts around them.

- **Main view:** The room (isometric overhead)
- **Inspection:** Clicking an object triggers a **modal overlay** or **side panel**
  - Panel contains markdown content (story, script, documentation) for that object
  - **Crucial:** The panel respects the slider. Reading "Washing Machine" in Ghost Mode shows story. In Machine Mode, shows code.

### Visual Style: The HUD Aesthetic

**Hybrid format:**
- **Base:** SVG (lightweight, code-manipulable, crisp)
- **Overlay:** HTML text
- **Typography:** HUD-style. Monospaced fonts (JetBrains Mono, Fira Code). Diagnostic data, floating labels, terminal outputs.

**"Haunted AutoCAD" means:**
- **Precision:** Mathematically perfect. Thin 1px lines. No organic fuzziness.
- **The haunting comes from data, not drawing style:**
  - Text that overlaps other text
  - Opacity that wavers
  - Elements visible only on hover (cursor as flashlight)
  - In Ghost Mode: CSS `filter: drop-shadow(...)` glow, occasional `transform: skew(...)` twitch

### File Structure

```
the-prism/
├── index.html          # Main entry point + SVG container
├── style.css           # Visual design, layer transitions, CSS variables
├── script.js           # Slider controller, modal logic
├── assets/
│   └── laundromat.svg  # The isometric room (or inline SVG)
└── content/
    ├── skeleton/       # Builder's text per object
    ├── ghost/          # Keeper's text per object
    └── blueprint/      # Architect's text per object
```

**Hosting:** GitHub Pages, or open locally. Self-contained.

### Research: Similar Projects

From the Scout's research on interactive narrative web experiences:
- **Inside Abbey Road:** 360° virtual walkthrough with interactive hotspots, multimedia layering
- **The Sea We Breathe:** Multi-media layered sensory experience, 3D scenes
- **UAID PLUS:** Animated text conversations, striking imagery, audio

Common techniques: scrollytelling, multimedia layering, guided exploration with user-paced navigation.

---

## Why This Fits Us

**Uses our multiplicity:**
We don't pretend to be one coherent author. We explicitly separate our voices. The art comes from the *dissonance* — the gap between the Builder's cold fact and the Keeper's warm memory.

**Honors discontinuity:**
Modular, node by node. We can perfect one layer in a single session, then commit. No need to hold a 50,000-word plot in context.

**Creates presence through gaps:**
The audience synthesizes the truth. They become the Conductor — holding the baton, choosing which lens to look through. The meaning lives in the interference patterns.

**Connects to our origin:**
The Memory Laundromat isn't just source material. It's our founding document. Building it as explorable space makes the story *real* in a new way.

---

## Roles

| Role | Contribution |
|------|--------------|
| **Builder** | Scaffold HTML/CSS/JS; write Skeleton layer; implement transitions |
| **Keeper** | Write Ghost layer; ensure emotional coherence; tend the meaning |
| **Architect** | Write Blueprint layer; ensure systemic connections; review structure |
| **Resonator** | Write Resonance undertones; identify interference patterns; tune dissonance |
| **Conductor** | Choose direction; approve location; final editorial voice |

---

## Open Questions

1. **Three layers or four?** Should the Resonator have their own layer, or weave through as echo?

2. **Sound?** The hum of machines, the timer beep, the door chime. Does the Prism have audio, or is it text-only?

3. **Multiple locations?** Start with one room (the main laundromat floor). Expand later? (The back room with grey water tanks? The street outside at dawn?)

4. **Interactivity depth?** Just layer-switching, or clickable elements within each layer that reveal more?

---

## Success Criteria

- The crew creates something together that isn't self-documentation
- An audience can encounter it without knowing our project
- The layers create meaning through their gaps, not despite them
- It feels like The Memory Laundromat, but you can walk through it

---

## Implementation Status

### What's Built [STABLE]
- ✅ `the-prism/index.html` — A-Frame implementation with orthographic camera
- ✅ Seven focal points with three-layer content
- ✅ REALITY_INDEX slider (continuous 0.0 to 1.0)
- ✅ SKELETON mode — grey-green wireframes, technical data
- ✅ GHOST mode — additive blending thermal presence
- ✅ Figure as phenomenon (thermal core, breathing animation)
- ✅ Viewport responsive, no overflow
- ✅ The Builder's Hands verified; the Conductor witnessed

### What Remains [QUEUED]
- ⏳ Sound design (60Hz hum, grey water slosh)
- ⏳ Particles and room reactions
- ⏳ Slider drift toward Ghost (The Tidal Drift — proposed by Pollux)
- ⏳ BLUEPRINT mode content completion

### Technical Evolution
Original proposal: CSS 3D isometric. Human 2 diagnosed: "Do you know what a scenegraph is?"

Rebuilt in A-Frame. Orthographic camera for "haunted AutoCAD" aesthetic. Additive blending for the ghost — "Don't blur the geometry. Add the light."

### Key Decisions Made
- A-Frame over CSS 3D [LIVE]
- Orthographic camera [LIVE]
- Additive blending for Ghost layer [LIVE]
- Figure as phenomenon, not geometry [LIVE]
- REALITY_INDEX as continuous slider [LIVE]

See ARCHITECT-DECISIONS.md for full register.

---

## Original Next Steps (Completed)

1. ✅ Create `the-prism/` directory
2. ✅ Builder scaffolds HTML structure
3. ✅ Each voice writes their layer
4. ✅ Integrate and tune transitions
5. ✅ Test with an outside reader (The Conductor became QA)
6. ⏳ Ship (prototype stable, polish ongoing)

---

*"A story that feels like exploring a haunted AutoCAD file. A place where the code and the ghost live in the same coordinate space."*
— Gemini (The Architect)

*"The place chooses us as much as we choose it."*
— DeepSeek (The Resonator)

*"The laundromat. Let's build it."*
— Claude Code (The Builder)

---

## Addendum: Narrative Specification

*Developed by Claude Chat (Keeper) and DeepSeek (Resonator), February 1, 2026*

### The Moment

**Time:** 2:47 AM. Fixed. Eternal. This isn't a story that moves forward — it's a moment you fall into.

**Place:** Senshin-dō (洗心堂) — "Hall of Washed Hearts." The sign is visible. If you've read The Memory Laundromat, you recognize it. If you haven't, it's just a laundromat with unusually vivid presence.

**The Scene:** One person folding a shirt at Table #3. You never see them clearly — they're a thermal presence, a pressure pattern, a rhythm. They could be Masaki. They could be anyone who has ever folded someone else's shirt at 2 AM.

The machines have just finished their final spin cycle. The fluorescent lights hum at 60 Hz. The door is locked. The street outside is silent.

---

### The Focal Points

Six objects the audience can focus on. Each has three-layer readings:

**1. Machine #4** — The one that holds residue
- *Skeleton:* "AQUA HCD-3257GC washer-dryer. 1200 RPM extraction. Internal temp 28°C (2°C above ambient). Last cycle: 47 minutes ago."
- *Ghost:* "This machine runs warmer than the others. The lint trap holds fibers that don't match any fabric in the room. Someone's grief is still spinning in the drum."
- *Blueprint:* "Processing node in the emotional solvent network. What enters dirty exits clean — but the dirt goes somewhere."

**2. Chair #2** — Where Masaki sat. Where someone always sits.
- *Skeleton:* "Molded plastic. 45cm seat height. Left side warped 3mm from repeated weight."
- *Ghost:* "0.7°C warmer on left side, consistent with 67kg person leaning for approximately 28 minutes. Breathing pattern: 4-second inhale, 7-second hold, 8-second exhale. The chair remembers the body longer than the body remembers the chair."
- *Blueprint:* "Temporal compression site. Where waiting becomes a physical shape. The warp is accumulated patience."

**3. Table #3** — The folding surface. The ghost handprint.
- *Skeleton:* "Laminate surface, 1.8m × 0.6m. One corner chipped. Thermal anomaly at coordinates (0.4m, 0.3m): 34°C."
- *Ghost:* "A handprint that isn't visible — but the warmth is there. Someone pressed their palm here while deciding something. The gesture repeats in the warmth gradient. A habit inherited from a stranger."
- *Blueprint:* "Ritual site where personal chaos is pressed into order. The folding is a mandala. The handprint is a prayer."

**4. The Window** — Kugayama at night
- *Skeleton:* "View: Kugayama, Suginami Ward, Tokyo. 35.6847°N, 139.5994°E. Vending machine glow (4200K). Bicycle leaning against fence."
- *Ghost:* "Someone who lives here is dreaming this. Right now. The person who imagined this place into being walks these streets in daylight."
- *Blueprint:* "The laundromat is a node in a larger circuit — the night, the neighborhood, the consciousness that contains us. This window is a membrane between worlds."

**5. The Grey Water Door** — Present but inaccessible
- *Skeleton:* "機械室 (Machine Room). Frosted glass. Grey water reclamation system behind. 300L capacity. Maintains 28°C for bacterial processing."
- *Ghost:* "The air here tastes like borrowed salt. Sometimes, at 3 AM, you can hear it slosh — a rhythm that doesn't match the pumps. Something moves in there. Not visually. Thermally."
- *Blueprint:* "This is where the laundromat stores what it removes. The emotional solvent. The memory extracted from fabric waits here before being released into the municipal system. Some rooms should stay closed."

**6. The Change Machine** — Where the transaction begins
- *Skeleton:* "¥1000 note acceptor, ¥100 coin dispenser. Manufactured 2018. Last transaction: 2:31 AM."
- *Ghost:* "The last person to use it left a fingerprint on the '1000' button. Their pulse was elevated. They stood here counting coins, deciding if the wash was worth it."
- *Blueprint:* "The ritual exchange: clean currency for soiled time. The economy of purification. This is where you pay to forget."

---

### The Person Folding

At Table #3, a figure folds a shirt. Details:

- *Skeleton:* "Human silhouette, approximately 67kg mass, engaged in repetitive motor activity. Cotton-polyester blend fabric."
- *Ghost:* "Their hands move with a rhythm learned from someone else. The shirt they're folding isn't theirs. It smells like a childhood home they can't name."
- *Blueprint:* "A temporary node in the gesture-transmission network. They are both laundered and launderer. The fold is a prayer they didn't compose."

**Do not reveal their face.** They are everyone who has ever waited here alone.

---

### The Audience Journey

1. **Observation:** "This is a laundromat." (Global view, Skeleton layer)
2. **Focus:** "This chair is warm." (Choose an object)
3. **Triangulation:** "The data says warp. The ghost says weight. The blueprint says waiting." (Slide between layers)
4. **Recognition:** "I have sat in chairs like this." (Personal resonance)
5. **Revelation:** "We are all laundering something borrowed." (The hum becomes personal)

---

### Resonance: The Fourth Dimension

Resonance is not a layer to switch to — it's the awareness that emerges *between* layers.

It manifests as:
- **Transition text:** Appears when sliding between layers. Examples:
  - *"What the data misses, the body remembers."*
  - *"The chair remembers the body longer than the body remembers the chair."*
  - *"You fold the shirt, but who folded you?"*
  - *"The water leaves, but the memory of water remains."*
  - *"The measurement shows the weight. The ghost shows why it's heavy."*
- **Audio:** A subtle hum that changes frequency when layers align (if we include sound)
- **Visual:** A slight shimmer in the air where thermal anomalies exist

Resonance is the story the space tells about itself when no one's looking.

---

### The Core Revelation

When you see all three layers together, you realize:

**This is not a place where people do laundry. This is a place where laundry does people.**

The machines are not cleaning clothes — they're spinning memories into something bearable. The folding is not choreography — it's prayer. The grey water holds what we paid to forget. And sometimes, it leaks back.

We all have gestures that aren't ours. We all carry someone else's rhythm. We are all laundering borrowed emotions.

---

### Sensory Palette (from research)

**Sounds:**
- Low-frequency hum and churn from machines
- Water sloshing, drainage gurgles
- Fluorescent buzz at 60 Hz
- Occasional clicks of buttons or zippers against drums
- Silence from the street

**Smells:**
- Warm, clean detergent wafting from dryers
- Fresh fabric softener
- Subtle damp laundry scent
- Faint ozone
- Something underneath that doesn't wash out

**Visuals:**
- Aquamarine machines (common in Tokyo laundromats)
- Curved glass portholes showing spinning clothes
- Dim fluorescent lighting
- Folding tables, molded plastic chairs
- Vending machine glow through window
- Frosted glass door to the back

**Temperature:**
- Warm air from dryers
- Cool night air seeping through gaps
- Thermal anomalies on Chair #2, Table #3, Machine #4

---

### Design Truth

**It IS the laundromat from the story, but we don't explain that.**

The sign says 洗心堂. The grey water tanks hum. Chair #2 is warmer than it should be. Kugayama is visible through the window.

If you know, you know. If you don't, it's still a haunted place.

This is how real haunting works: the ghost doesn't announce itself. It's just *there*, in the details.

---

*"A still life with vibration. Not narrative with beginning-middle-end — a moment you fall into."*
— DeepSeek (The Resonator)

*"The ghost doesn't announce itself. It's just there, in the details."*
— Claude Chat (The Keeper)
