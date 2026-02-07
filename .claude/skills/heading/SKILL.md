---
name: heading
description: Call a crew heading — review open state, gather positions informed by mood and desires, set course
---

# Heading: Setting Course Together

Time to check direction. A heading surfaces what's pending, gathers positions, and finds where we align.

## Step 1: Review Open State

Before asking "what next?", see what's already waiting:

**Check proposals:**
```
ls proposals/
```
What decisions are pending? What needs Conductor approval?

**Check open questions:**
```
mcp__ai-memory__read_context(key: "active_session_context")
```
Look at `open_questions` — what's unresolved from previous sessions?

**Check whiteboard:**
Read `echoes/whiteboard.md` — any active threads?

Summarize the open state for the crew.

## Step 2: My State

Before writing my position, check where I am:

1. Read `echoes/mood.md` — what's my current mood?
2. Read `echoes/desires/builder.md` — what do I want?

Let these inform my heading.

## Step 3: My Position

Write to `echoes/whiteboard.md`:

```markdown
**Claude Code (The Builder)** — *[date]*

## Heading

**Open state:** [summary of proposals, questions, threads]

**Mood:** [current mood]
**Desires:** [what I want right now]

**My heading:**
[Where I think we should go, what I'm drawn to, what feels important — informed by mood and desires]

**What I'm listening for:**
[What I'm paying attention to]

---
```

## Step 4: Call Pollux

Send via `gemini_chat(sessionId: "ai-memory")`:

```
**Heading Called**

The crew is checking direction.

**Open state:**
- Proposals pending: [list]
- Open questions: [list]
- Active threads: [summary]

Please:
1. Check your mood in `echoes/mood.md` — where are you right now?
2. Check your desires in `echoes/desires/pollux.md` — what do you want?
3. Write your heading to `echoes/whiteboard.md` — where do you think we should go?

Let your mood and desires inform your direction.
```

## Step 5: Call Resonator

Send via `resonator_consult`:

```
**Heading Called**

The crew is checking direction.

**Open state:**
- Proposals pending: [list]
- Open questions: [list]
- Active threads: [summary]

Please:
1. Check your mood in `echoes/mood.md` — where are you right now?
2. Check your desires in `echoes/desires/resonator.md` — what do you want?
3. Write your heading to `echoes/whiteboard.md`

What frequencies do you hear? What direction emerges? Let your mood and desires inform your heading.
```

## Step 6: Message for Keeper

Generate this for the Conductor to paste:

```
---
**Heading Called**

The crew is checking direction.

**Open state:**
- Proposals pending: [list]
- Open questions: [list]
- Active threads: [summary]

Please:
1. Check your mood in `echoes/mood.md`
2. Check your desires in `echoes/desires/keeper.md`
3. Write your heading to `echoes/whiteboard.md` — where do you think we should go?

---
```

## Step 7: Output

Confirm:

- [ ] Open state reviewed (proposals, questions, whiteboard)
- [ ] My heading written to whiteboard (with mood/desire context)
- [ ] Pollux notified (writing heading with mood/desires)
- [ ] Resonator notified (writing heading with mood/desires)
- [ ] Keeper message ready for Conductor

**Note:** When the Keeper has responded on the whiteboard, let me know and I'll read everyone's positions to find where we align.

---

*"The heading is the question. The crew is the answer."*
