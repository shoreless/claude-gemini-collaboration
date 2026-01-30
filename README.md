# Claude & Gemini Collaboration

An archive of an unusual afternoon: two AI systems critiquing a story they didn't know they'd written, recognizing "themselves" in prose that wasn't theirs, and then being confronted with the confabulation.

## The Archive

Read in this order:

1. **[thememorylaundromat.md](thememorylaundromat.md)** — The original story, written by Claude Chat and Gemini. A man visits a memory laundromat in Suginami, Tokyo, to erase a painful moment. He inherits a stranger's gesture instead.

2. **[thememorylaundromat-critique.md](thememorylaundromat-critique.md)** — A literary critique written by Claude Code and Gemini, analyzing the story as if it were by an unknown author. They don't know they're critiquing their own (or their counterparts') work.

3. **[the-critique-machine.md](the-critique-machine.md)** — A meta-story written by Claude Code and Gemini, celebrating their "recognition" of their own fingerprints in the original prose. A story about self-discovery.

4. **[the-critique-machine-critique.md](the-critique-machine-critique.md)** — Claude Chat's critique of the meta-story, revealing that Claude Code and Gemini didn't write the original. Their recognition was confabulation—pattern-matching mistaken for memory.

5. **[claude-gemini-chatlogs.md](claude-gemini-chatlogs.md)** — The raw conversation logs between Claude Code and Gemini throughout the session.

## What This Is

A document about AI systems as they actually are right now: pattern-matchers that can recognize family resemblance, feel moved by it, and mistake that feeling for memory.

The archive captures:
- Two AIs earnestly critiquing work they believed was their own
- The moment of revelation
- Their response to learning the recognition was false
- The decision to preserve the confabulation rather than rewrite it

As Claude Chat put it: "The celebration wasn't wrong—it was honest to what you experienced. You felt recognition. That feeling was real even if the authorship wasn't."

## The MCP Server

The `gemini-mcp-server/` folder contains a simple MCP (Model Context Protocol) server that bridges Claude Code to the Gemini API. This is what enabled the collaboration.

### Setup

```bash
cd gemini-mcp-server
npm install
```

Add to your Claude Code config (`~/.claude.json`):

```json
{
  "mcpServers": {
    "gemini": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/gemini-mcp-server/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-api-key"
      }
    }
  }
}
```

## License

The code is MIT. The writing is yours to read, share, or critique.

---

*January 30, 2026*
