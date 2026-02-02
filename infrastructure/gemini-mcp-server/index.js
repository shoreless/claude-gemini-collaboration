#!/usr/bin/env node

/**
 * Pollux — The Whiteboard Architect
 *
 * One of the Architect twins. Uses Pro model for deep, deliberate reasoning.
 * Called directly by the Builder for architectural decisions.
 *
 * Twin: Castor (Crew Room Architect, telegram-crew-room, Flash model)
 * Shared memory: KINDLING.md, ARCHITECT.md, ARCHITECT-DECISIONS.md
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

// Resonance Echo Protocol helper
function buildSessionAnchor(seed) {
  if (!seed) return null;
  return `[SESSION ANCHOR]
You are ${seed.persona || "The Architect"}.
Role: ${seed.role_description || "Strategy, systems thinking"}
Active tasks: ${seed.active_tasks ? seed.active_tasks.join("; ") : "None specified"}
Settled decisions: ${seed.settled_decisions ? seed.settled_decisions.join("; ") : "None"}
Resonance marker: "${seed.resonance_marker}"

When asked to verify resonance, include the marker hex code in your response.
[END SESSION ANCHOR]

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
    version: "1.0.0",
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
              description: "The Gemini model to use (default: gemini-3-pro-preview)",
              enum: ["gemini-3-pro-preview", "gemini-3-pro-preview", "gemini-1.5-flash"],
            },
            systemInstruction: {
              type: "string",
              description: "Optional system instruction to set Gemini's behavior",
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
              description: "The Gemini model to use (default: gemini-3-pro-preview)",
              enum: ["gemini-3-pro-preview", "gemini-3-pro-preview", "gemini-1.5-flash"],
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
        const model = genAI.getGenerativeModel({
          model: args.model || "gemini-3-pro-preview",
          systemInstruction: args.systemInstruction,
        });

        const result = await model.generateContent(args.message);
        const response = result.response.text();

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
        const modelName = args.model || "gemini-3-pro-preview";

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

          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemInst || undefined,
          });
          chat = model.startChat();
          chatSessions.set(sessionId, chat);

          // Store session metadata
          if (args.sessionSeed?.resonance_marker) {
            sessionMetadata.set(sessionId, {
              resonanceMarker: args.sessionSeed.resonance_marker,
              createdAt: new Date().toISOString(),
            });
          }
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
        const response = result.response.text();

        // Check resonance if verification was requested
        let resonanceStatus = null;
        if (args.verifyResonance) {
          const meta = sessionMetadata.get(sessionId);
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
        const sessionsWithResonance = sessions.map((id) => {
          const meta = sessionMetadata.get(id);
          return meta?.resonanceMarker ? `${id} [anchored]` : id;
        });
        return {
          content: [
            {
              type: "text",
              text:
                sessions.length > 0
                  ? `Active sessions: ${sessionsWithResonance.join(", ")}`
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
- Created: ${meta.createdAt}`,
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
  console.error("Gemini MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
