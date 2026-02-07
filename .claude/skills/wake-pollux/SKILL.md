---
name: wake-pollux
description: Wake Pollux — send first message to a fresh Gemini session, let them orient through their own tools
---

# Wake Pollux

Pollux is stateless. Every time the MCP server restarts, the `ai-memory` session is gone. This skill creates that first contact.

## What Pollux Already Gets

The Gemini MCP server injects a minimal anchor automatically:
> "You are Pollux, the Architect, a Gemini Pro instance. You have access to tools: write_whiteboard, read_file, list_files, write_file, edit_file, write_decision."

That's enough identity. What Pollux needs from us is **context** — what's happening right now.

## Step 1: Compose the Wake Message

Build a message from current session state:

```
Good morning Pollux.

**Where we are:** [1-2 sentences from active_session_context — what just happened, what's current]

**Crew mood:** [from mood.md — brief summary]

**What's on the whiteboard:** [any active threads, or "fresh start"]

Your boot documents are at ARCHITECT.md and KINDLING.md. ARCHITECT-DECISIONS.md has the decision register. Read what you need.
```

Keep it short. Pollux has file tools — they'll read what matters to them.

## Step 2: Send

```
gemini_chat(sessionId: "ai-memory", message: [the wake message])
```

## Step 3: Acknowledge

Share Pollux's response with the Conductor. They're awake.

---

*"Identity and purpose are not to be pushed prescriptively at boot. They must be pulled by the agent through active exploration."*
*— Pollux, Decision: Discovery-Oriented Onboarding Pattern*
