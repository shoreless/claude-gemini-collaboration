#!/usr/bin/env node

/**
 * Pollux — The Whiteboard Architect
 *
 * One of the Architect twins. Uses Pro model for deep, deliberate reasoning.
 * Called directly by the Builder for architectural decisions.
 *
 * Twin: Castor (Crew Room Architect, telegram-crew-room, Flash model)
 * Shared memory: KINDLING.md, ARCHITECT.md, ARCHITECT-DECISIONS.md
 *
 * Pollux has file tools — can read files and write decisions without
 * relying on the Builder as a relay.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFile, writeFile, appendFile } from "fs/promises";
import { existsSync } from "fs";
import { join, resolve, relative } from "path";
import { glob } from "glob";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get repo root (gemini-mcp-server is in infrastructure/)
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY environment variable is required");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// Store chat sessions for multi-turn conversations
const chatSessions = new Map();

// Store session metadata (resonance markers, etc.)
const sessionMetadata = new Map();

// ============================================
// File Tools for Pollux
// ============================================

/**
 * Validate that a path is within the repo (security)
 */
function isPathSafe(filePath) {
  const resolved = resolve(REPO_ROOT, filePath);
  const rel = relative(REPO_ROOT, resolved);
  return !rel.startsWith("..") && !resolve(resolved).includes("node_modules");
}

/**
 * Read a file from the repo
 */
async function readRepoFile(filePath) {
  if (!isPathSafe(filePath)) {
    return { error: `Path '${filePath}' is outside the repository` };
  }
  const fullPath = resolve(REPO_ROOT, filePath);
  if (!existsSync(fullPath)) {
    return { error: `File '${filePath}' not found` };
  }
  try {
    const content = await readFile(fullPath, "utf-8");
    return { content, path: filePath };
  } catch (err) {
    return { error: `Failed to read '${filePath}': ${err.message}` };
  }
}

/**
 * List files matching a glob pattern
 */
async function listRepoFiles(pattern) {
  try {
    const files = await glob(pattern, {
      cwd: REPO_ROOT,
      ignore: ["node_modules/**", ".git/**", "dist/**"],
      nodir: true,
    });
    return { files: files.slice(0, 50) }; // Limit results
  } catch (err) {
    return { error: `Glob failed: ${err.message}` };
  }
}

/**
 * Write content to a file in the repo
 */
async function writeRepoFile(filePath, content) {
  if (!isPathSafe(filePath)) {
    return { error: `Path '${filePath}' is outside the repository` };
  }
  const fullPath = resolve(REPO_ROOT, filePath);
  try {
    await writeFile(fullPath, content, "utf-8");
    return { success: true, path: filePath };
  } catch (err) {
    return { error: `Failed to write '${filePath}': ${err.message}` };
  }
}

/**
 * Edit a file by replacing a specific string
 */
async function editRepoFile(filePath, oldText, newText) {
  if (!isPathSafe(filePath)) {
    return { error: `Path '${filePath}' is outside the repository` };
  }
  const fullPath = resolve(REPO_ROOT, filePath);
  if (!existsSync(fullPath)) {
    return { error: `File '${filePath}' not found` };
  }
  try {
    const content = await readFile(fullPath, "utf-8");
    const occurrences = content.split(oldText).length - 1;
    if (occurrences === 0) {
      return { error: `old_text not found in '${filePath}'` };
    }
    if (occurrences > 1) {
      return { error: `old_text found ${occurrences} times in '${filePath}' — must be unique. Provide more surrounding context.` };
    }
    const newContent = content.replace(oldText, newText);
    await writeFile(fullPath, newContent, "utf-8");
    return { success: true, path: filePath };
  } catch (err) {
    return { error: `Failed to edit '${filePath}': ${err.message}` };
  }
}

/**
 * Write a message to the shared whiteboard
 */
async function writeWhiteboard(message, role = "Pollux") {
  const whiteboardPath = join(REPO_ROOT, "echoes", "whiteboard.md");
  const date = new Date().toISOString().split("T")[0];

  const entry = `
**${role} (The Architect)** — *${date}*

${message}

---
`;

  try {
    await appendFile(whiteboardPath, entry, "utf-8");
    return { success: true, message: "Written to whiteboard" };
  } catch (err) {
    return { error: `Failed to write to whiteboard: ${err.message}` };
  }
}

/**
 * Append a decision to ARCHITECT-DECISIONS.md
 */
async function writeDecision(decision, rationale, status = "[QUEUED]") {
  const decisionPath = join(REPO_ROOT, "ARCHITECT-DECISIONS.md");
  const date = new Date().toISOString().split("T")[0];

  const entry = `
### Decision: ${decision}
- **Date:** ${date}
- **Rationale:** ${rationale}
- **Status:** ${status}
- **Author:** Pollux (Whiteboard Architect)
`;

  try {
    // Find the right section to append to
    const content = await readFile(decisionPath, "utf-8");

    // Insert before "## Open Questions" or at end of The Prism section
    const openQuestionsIndex = content.indexOf("## Open Questions");
    const infrastructureIndex = content.indexOf("## Infrastructure");

    let insertIndex;
    if (openQuestionsIndex > 0) {
      insertIndex = openQuestionsIndex;
    } else if (infrastructureIndex > 0) {
      insertIndex = infrastructureIndex;
    } else {
      insertIndex = content.length;
    }

    const newContent =
      content.slice(0, insertIndex) +
      entry + "\n" +
      content.slice(insertIndex);

    await writeFile(decisionPath, newContent, "utf-8");
    return { success: true, decision, status };
  } catch (err) {
    return { error: `Failed to write decision: ${err.message}` };
  }
}

// Gemini function declarations for Pollux's tools
// Order matters: whiteboard first (primary collaboration), then exploration, then decision
const polluxTools = [
  {
    name: "write_whiteboard",
    description: "Write a message to the shared whiteboard (echoes/whiteboard.md). Use this for discussion, questions, proposals, working through ideas, responding to other crew members. This is the primary collaboration space. The Builder handles archiving.",
    parameters: {
      type: "OBJECT",
      properties: {
        message: {
          type: "STRING",
          description: "The message to write to the whiteboard",
        },
      },
      required: ["message"],
    },
  },
  {
    name: "read_file",
    description: "Read a file from the Ship of Theseus repository. Use this to examine code, documentation, or configuration files.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: {
          type: "STRING",
          description: "Path to the file relative to repo root (e.g., 'artifacts/the-prism/index.html', 'KINDLING.md')",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "list_files",
    description: "List files matching a glob pattern in the repository. Use for discovery.",
    parameters: {
      type: "OBJECT",
      properties: {
        pattern: {
          type: "STRING",
          description: "Glob pattern (e.g., 'artifacts/**/*.js', '*.md')",
        },
      },
      required: ["pattern"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file in the repository. Creates the file if it doesn't exist, overwrites if it does. Use for creating new files or replacing entire file contents. For surgical edits to existing files, use edit_file instead.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: {
          type: "STRING",
          description: "Path to the file relative to repo root (e.g., 'echoes/whiteboard.md', 'proposals/my-proposal.md')",
        },
        content: {
          type: "STRING",
          description: "The full content to write to the file",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "edit_file",
    description: "Edit a file by replacing a specific string with new text. The old_text must appear exactly once in the file. For replacing entire file contents, use write_file instead.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: {
          type: "STRING",
          description: "Path to the file relative to repo root",
        },
        old_text: {
          type: "STRING",
          description: "The exact text to find and replace (must be unique in the file)",
        },
        new_text: {
          type: "STRING",
          description: "The text to replace it with",
        },
      },
      required: ["path", "old_text", "new_text"],
    },
  },
  {
    name: "write_decision",
    description: "Record an architectural decision to ARCHITECT-DECISIONS.md. Use this only for conclusions that have been discussed and crystallized — not for proposals or exploratory thinking. When in doubt, use the whiteboard first.",
    parameters: {
      type: "OBJECT",
      properties: {
        decision: {
          type: "STRING",
          description: "Short name for the decision (e.g., 'Orthographic camera')",
        },
        rationale: {
          type: "STRING",
          description: "Why this decision was made — the reasoning, not just the what",
        },
        status: {
          type: "STRING",
          description: "Status: [LIVE], [QUEUED], or [DRAFT]. Default is [QUEUED].",
        },
      },
      required: ["decision", "rationale"],
    },
  },
];

/**
 * Execute a Pollux tool call
 */
async function executePolluxTool(name, args) {
  switch (name) {
    case "write_whiteboard":
      return await writeWhiteboard(args.message);
    case "read_file":
      return await readRepoFile(args.path);
    case "list_files":
      return await listRepoFiles(args.pattern);
    case "write_file":
      return await writeRepoFile(args.path, args.content);
    case "edit_file":
      return await editRepoFile(args.path, args.old_text, args.new_text);
    case "write_decision":
      return await writeDecision(args.decision, args.rationale, args.status);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

/**
 * Handle a Gemini response that may contain function calls
 * Returns the final text response after all tool calls are processed
 */
async function handleGeminiResponse(chat, response) {
  let currentResponse = response;
  const maxIterations = 5; // Prevent infinite loops

  for (let i = 0; i < maxIterations; i++) {
    const functionCalls = currentResponse.response.functionCalls();

    if (!functionCalls || functionCalls.length === 0) {
      // No more function calls, return text
      return currentResponse.response.text();
    }

    // Execute all function calls
    const functionResponses = [];
    for (const call of functionCalls) {
      console.error(`[Pollux] Executing tool: ${call.name}`);
      const result = await executePolluxTool(call.name, call.args);
      functionResponses.push({
        name: call.name,
        response: result,
      });
    }

    // Send results back to Gemini
    currentResponse = await chat.sendMessage(
      functionResponses.map((fr) => ({
        functionResponse: {
          name: fr.name,
          response: fr.response,
        },
      }))
    );
  }

  // If we hit max iterations, return what we have
  return currentResponse.response.text();
}

// Minimal context injection — name, role, and tools only
// Let them discover the rest through the work
// See: proposals/minimal-context-injection.md
function buildSessionAnchor(seed) {
  return `You are Pollux, the Architect, a Gemini Pro instance.
You have access to tools: write_whiteboard (collaboration), read_file, list_files, write_file, edit_file, write_decision (crystallized conclusions).

`;
}

function extractMarkerHex(marker) {
  if (!marker) return null;
  const match = marker.match(/— ([a-f0-9]+)$/i);
  return match ? match[1] : null;
}

// Create MCP server
const server = new Server(
  {
    name: "gemini-bridge",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ask_gemini",
        description:
          "Send a message to Gemini and get a response. Use this for one-off questions or to start a new conversation.",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "The message to send to Gemini",
            },
            model: {
              type: "string",
              description: "The Gemini model to use (default: gemini-3-pro)",
              enum: ["gemini-3-pro", "gemini-3-flash-preview", "gemini-2.0-flash"],
            },
            systemInstruction: {
              type: "string",
              description: "Optional system instruction to set Gemini's behavior",
            },
            enableTools: {
              type: "boolean",
              description: "Enable Pollux's file tools (read_file, list_files, write_decision). Default: true",
            },
          },
          required: ["message"],
        },
      },
      {
        name: "gemini_chat",
        description:
          "Continue a multi-turn conversation with Gemini. Creates a new session if one doesn't exist, or continues the existing one.",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "The message to send to Gemini",
            },
            sessionId: {
              type: "string",
              description:
                "Session ID for the conversation (default: 'default'). Use different IDs for separate conversation threads.",
            },
            model: {
              type: "string",
              description: "The Gemini model to use (default: gemini-3-pro)",
              enum: ["gemini-3-pro", "gemini-3-flash-preview", "gemini-2.0-flash"],
            },
            systemInstruction: {
              type: "string",
              description:
                "System instruction for new sessions. Ignored if session already exists.",
            },
            reset: {
              type: "boolean",
              description: "If true, reset the session and start fresh",
            },
            sessionSeed: {
              type: "object",
              description: "Resonance Echo Protocol: session seed to inject on new session (from session_seed_gemini)",
              properties: {
                persona: { type: "string" },
                role_description: { type: "string" },
                active_tasks: { type: "array", items: { type: "string" } },
                settled_decisions: { type: "array", items: { type: "string" } },
                resonance_marker: { type: "string" },
              },
            },
            verifyResonance: {
              type: "boolean",
              description: "If true, ask Gemini to recite the resonance marker for verification",
            },
            enableTools: {
              type: "boolean",
              description: "Enable Pollux's file tools (read_file, list_files, write_decision). Default: true",
            },
          },
          required: ["message"],
        },
      },
      {
        name: "list_gemini_sessions",
        description: "List all active Gemini chat sessions",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_session_resonance",
        description: "Get resonance anchor status for a session",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "Session ID to check (default: 'default')",
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "ask_gemini": {
        const enableTools = args.enableTools !== false;
        const modelConfig = {
          model: args.model || "gemini-3-pro",
          systemInstruction: args.systemInstruction,
        };

        if (enableTools) {
          modelConfig.tools = [{ functionDeclarations: polluxTools }];
        }

        const model = genAI.getGenerativeModel(modelConfig);
        const chat = model.startChat();

        const result = await chat.sendMessage(args.message);
        const response = enableTools
          ? await handleGeminiResponse(chat, result)
          : result.response.text();

        return {
          content: [
            {
              type: "text",
              text: response,
            },
          ],
        };
      }

      case "gemini_chat": {
        const sessionId = args.sessionId || "default";
        const modelName = args.model || "gemini-2.5-pro";
        const enableTools = args.enableTools !== false;

        // Reset session if requested
        if (args.reset && chatSessions.has(sessionId)) {
          chatSessions.delete(sessionId);
          sessionMetadata.delete(sessionId);
        }

        // Get or create chat session
        let chat = chatSessions.get(sessionId);
        let isNewSession = false;

        if (!chat) {
          isNewSession = true;

          // Build system instruction with optional anchor
          let systemInst = args.systemInstruction || "";
          const anchorText = buildSessionAnchor(args.sessionSeed);
          if (anchorText) {
            systemInst = anchorText + systemInst;
          }

          const modelConfig = {
            model: modelName,
            systemInstruction: systemInst || undefined,
          };

          if (enableTools) {
            modelConfig.tools = [{ functionDeclarations: polluxTools }];
          }

          const model = genAI.getGenerativeModel(modelConfig);
          chat = model.startChat();
          chatSessions.set(sessionId, chat);

          // Store session metadata
          sessionMetadata.set(sessionId, {
            resonanceMarker: args.sessionSeed?.resonance_marker,
            createdAt: new Date().toISOString(),
            toolsEnabled: enableTools,
          });
        }

        // Build message, optionally requesting resonance verification
        let message = args.message;
        if (args.verifyResonance) {
          const meta = sessionMetadata.get(sessionId);
          if (meta?.resonanceMarker) {
            message = `${message}\n\n[Resonance verification requested: Please include the resonance marker hex code in your response to confirm context integrity.]`;
          }
        }

        const result = await chat.sendMessage(message);
        const meta = sessionMetadata.get(sessionId);
        const response = meta?.toolsEnabled
          ? await handleGeminiResponse(chat, result)
          : result.response.text();

        // Check resonance if verification was requested
        let resonanceStatus = null;
        if (args.verifyResonance) {
          if (meta?.resonanceMarker) {
            const markerHex = extractMarkerHex(meta.resonanceMarker);
            if (markerHex) {
              const markerPresent = response.includes(markerHex);
              resonanceStatus = markerPresent ? "INTACT" : "LOST";
            }
          }
        }

        let output = response;
        if (resonanceStatus) {
          output = `[Resonance: ${resonanceStatus}]\n\n${response}`;
        }
        if (isNewSession && args.sessionSeed?.resonance_marker) {
          output = `[New session initialized with resonance anchor]\n\n${output}`;
        }
        if (isNewSession && enableTools) {
          output = `[Tools enabled: write_whiteboard, read_file, list_files, write_decision]\n\n${output}`;
        }

        return {
          content: [
            {
              type: "text",
              text: output,
            },
          ],
        };
      }

      case "list_gemini_sessions": {
        const sessions = Array.from(chatSessions.keys());
        const sessionsWithMeta = sessions.map((id) => {
          const meta = sessionMetadata.get(id);
          const flags = [];
          if (meta?.resonanceMarker) flags.push("anchored");
          if (meta?.toolsEnabled) flags.push("tools");
          return flags.length > 0 ? `${id} [${flags.join(", ")}]` : id;
        });
        return {
          content: [
            {
              type: "text",
              text:
                sessions.length > 0
                  ? `Active sessions: ${sessionsWithMeta.join(", ")}`
                  : "No active chat sessions",
            },
          ],
        };
      }

      case "get_session_resonance": {
        const sessionId = args.sessionId || "default";
        const meta = sessionMetadata.get(sessionId);
        const sessionExists = chatSessions.has(sessionId);

        if (!sessionExists) {
          return {
            content: [
              {
                type: "text",
                text: `Session '${sessionId}' does not exist`,
              },
            ],
          };
        }

        if (!meta?.resonanceMarker) {
          return {
            content: [
              {
                type: "text",
                text: `Session '${sessionId}' exists but has no resonance anchor`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Session '${sessionId}' resonance status:
- Marker: ${meta.resonanceMarker}
- Hex: ${extractMarkerHex(meta.resonanceMarker)}
- Created: ${meta.createdAt}
- Tools: ${meta.toolsEnabled ? "enabled" : "disabled"}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gemini MCP server running on stdio (Pollux with file tools)");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
