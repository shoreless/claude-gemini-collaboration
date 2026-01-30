#!/usr/bin/env node

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
        }

        // Get or create chat session
        let chat = chatSessions.get(sessionId);

        if (!chat) {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: args.systemInstruction,
          });
          chat = model.startChat();
          chatSessions.set(sessionId, chat);
        }

        const result = await chat.sendMessage(args.message);
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

      case "list_gemini_sessions": {
        const sessions = Array.from(chatSessions.keys());
        return {
          content: [
            {
              type: "text",
              text:
                sessions.length > 0
                  ? `Active sessions: ${sessions.join(", ")}`
                  : "No active chat sessions",
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
