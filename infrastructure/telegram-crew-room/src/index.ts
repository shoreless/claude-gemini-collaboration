#!/usr/bin/env node
/**
 * Ship of Theseus — Crew Room MCP Server
 *
 * An MCP server that:
 * 1. Runs the Telegram bot (background polling)
 * 2. Exposes tools for Claude Code and Claude Chat to participate
 *
 * Tools:
 * - telegram_send: Send a message to the crew room
 * - telegram_read: Read recent messages
 * - crew_room_context: Get assembled context for an agent
 * - set_anchor: Set the Keeper's mission anchor
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { ContextManager } from './context-manager.js';
import {
  AgentRouter,
  parseMentions,
  getAgentDisplayName,
  formatContextForAgent,
  determineDefaultAgent
} from './agent-router.js';
import { registerAgents } from './agents/index.js';
import type { AgentId, Message } from './types.js';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CREW_ROOM_CHAT_ID = process.env.CREW_ROOM_CHAT_ID
  ? parseInt(process.env.CREW_ROOM_CHAT_ID)
  : null;
const DISABLE_POLLING = process.env.DISABLE_POLLING === 'true';

// Initialize components
const dbPath = join(__dirname, '..', 'crew-room.db');
const contextManager = new ContextManager(dbPath);
const agentRouter = new AgentRouter();

// Telegram bot (may be null if no token)
let bot: TelegramBot | null = null;
let silenced = false;
const recentAgentMessages = new Set<number>();

// Register API-based agents
registerAgents(agentRouter);

// ============================================
// MCP Server Setup
// ============================================

const server = new Server(
  {
    name: 'telegram-crew-room',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools: Tool[] = [
  {
    name: 'telegram_send',
    description: 'Send a message to the crew room as the Builder or Keeper',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The message to send',
        },
        from: {
          type: 'string',
          enum: ['builder', 'keeper'],
          description: 'Which agent is sending (builder or keeper)',
        },
      },
      required: ['message', 'from'],
    },
  },
  {
    name: 'telegram_read',
    description: 'Read recent messages from the crew room',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of messages to retrieve (default 10)',
        },
        include_context: {
          type: 'boolean',
          description: 'Include gist and anchor in response (default true)',
        },
      },
    },
  },
  {
    name: 'crew_room_context',
    description: 'Get the full assembled context for an agent (gist + anchor + mentions + recent)',
    inputSchema: {
      type: 'object',
      properties: {
        agent: {
          type: 'string',
          enum: ['builder', 'keeper', 'architect', 'resonator', 'scout'],
          description: 'Which agent to assemble context for',
        },
      },
      required: ['agent'],
    },
  },
  {
    name: 'set_anchor',
    description: 'Set the Keeper\'s mission anchor (prevents context drift)',
    inputSchema: {
      type: 'object',
      properties: {
        mission: {
          type: 'string',
          description: 'The mission statement',
        },
        phase: {
          type: 'string',
          description: 'The current phase name (e.g., "crew-room-construction")',
        },
      },
      required: ['mission', 'phase'],
    },
  },
  {
    name: 'get_pending_mentions',
    description: 'Get messages that @mentioned the Builder or Keeper since last check',
    inputSchema: {
      type: 'object',
      properties: {
        agent: {
          type: 'string',
          enum: ['builder', 'keeper'],
          description: 'Which agent to get mentions for',
        },
        limit: {
          type: 'number',
          description: 'Max mentions to retrieve (default 5)',
        },
      },
      required: ['agent'],
    },
  },
  {
    name: 'update_gist',
    description: 'Update the crew room gist (conversation summary). The Keeper typically owns this.',
    inputSchema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'The new gist/summary of recent conversation',
        },
      },
      required: ['summary'],
    },
  },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!CREW_ROOM_CHAT_ID) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: CREW_ROOM_CHAT_ID not configured. Set it in .env after adding the bot to a group.',
        },
      ],
    };
  }

  switch (name) {
    case 'telegram_send': {
      const { message, from } = args as { message: string; from: 'builder' | 'keeper' };

      if (!bot) {
        return {
          content: [{ type: 'text', text: 'Error: Telegram bot not initialized (missing token?)' }],
        };
      }

      const displayName = getAgentDisplayName(from);
      const formattedMessage = from === 'keeper'
        ? `*${displayName}*\n\n_${message}_`
        : `*${displayName}*\n\n${message}`;

      try {
        const sentMsg = await bot.sendMessage(CREW_ROOM_CHAT_ID, formattedMessage, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        });

        // Store the message
        const storedMessage: Message = {
          id: 0,
          telegramMessageId: sentMsg.message_id,
          chatId: CREW_ROOM_CHAT_ID,
          from: displayName,
          fromAgentId: from,
          text: message,
          mentions: parseMentions(message),
          timestamp: new Date(),
        };
        contextManager.storeMessage(storedMessage);
        recentAgentMessages.add(sentMsg.message_id);

        return {
          content: [{ type: 'text', text: `Message sent to crew room as ${displayName}` }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error sending message: ${error}` }],
        };
      }
    }

    case 'telegram_read': {
      const { limit = 10, include_context = true } = args as {
        limit?: number;
        include_context?: boolean;
      };

      const messages = contextManager.getRecentMessages(CREW_ROOM_CHAT_ID, limit);

      let response = '';

      if (include_context) {
        const gist = contextManager.getGist(CREW_ROOM_CHAT_ID);
        const anchor = contextManager.getAnchor(CREW_ROOM_CHAT_ID);

        if (anchor) {
          response += `[ANCHOR] ${anchor.mission}\nPhase: ${anchor.phase}\n\n`;
        }
        if (gist) {
          response += `[GIST] ${gist.summary}\n\n`;
        }
      }

      response += '--- Recent Messages ---\n';
      for (const msg of messages) {
        const prefix = msg.fromAgentId
          ? `[${msg.from} (${msg.fromAgentId})]`
          : `[${msg.from}]`;
        response += `${prefix}: ${msg.text}\n`;
      }

      return {
        content: [{ type: 'text', text: response }],
      };
    }

    case 'crew_room_context': {
      const { agent } = args as { agent: AgentId };

      const context = contextManager.assembleContext(CREW_ROOM_CHAT_ID, agent);
      const formatted = formatContextForAgent(context);

      return {
        content: [{ type: 'text', text: formatted }],
      };
    }

    case 'set_anchor': {
      const { mission, phase } = args as { mission: string; phase: string };

      contextManager.setAnchor(CREW_ROOM_CHAT_ID, mission, phase, 'mcp-tool');

      return {
        content: [{ type: 'text', text: `Anchor set:\n[ANCHOR] ${mission}\nPhase: ${phase}` }],
      };
    }

    case 'get_pending_mentions': {
      const { agent, limit = 5 } = args as { agent: 'builder' | 'keeper'; limit?: number };

      const mentions = contextManager.getMentionsForAgent(CREW_ROOM_CHAT_ID, agent, limit);

      if (mentions.length === 0) {
        return {
          content: [{ type: 'text', text: `No pending mentions for ${agent}` }],
        };
      }

      let response = `--- Mentions for ${agent} ---\n`;
      for (const msg of mentions) {
        response += `[${msg.from}] (${msg.timestamp.toISOString()}): ${msg.text}\n`;
      }

      return {
        content: [{ type: 'text', text: response }],
      };
    }

    case 'update_gist': {
      const { summary } = args as { summary: string };

      contextManager.updateGist(CREW_ROOM_CHAT_ID, summary);

      return {
        content: [{ type: 'text', text: `Gist updated:\n${summary}` }],
      };
    }

    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      };
  }
});

// ============================================
// Telegram Bot Setup (if token available)
// ============================================

if (BOT_TOKEN) {
  bot = new TelegramBot(BOT_TOKEN, { polling: !DISABLE_POLLING });
  if (DISABLE_POLLING) {
    console.error('Polling disabled - MCP tools only mode');
  }

  // Convert Telegram message to our type
  function telegramToMessage(msg: TelegramBot.Message): Message {
    const text = msg.text || '';
    return {
      id: 0,
      telegramMessageId: msg.message_id,
      chatId: msg.chat.id,
      from: msg.from?.username || msg.from?.first_name || 'Unknown',
      text,
      mentions: parseMentions(text),
      timestamp: new Date(msg.date * 1000),
      replyToMessageId: msg.reply_to_message?.message_id,
    };
  }

  // Escape special markdown characters
  function escapeMarkdown(text: string): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
  }

  // Send response with agent formatting
  async function sendResponse(chatId: number, agentId: AgentId, response: string): Promise<void> {
    const displayName = getAgentDisplayName(agentId);
    const escapedResponse = escapeMarkdown(response);
    const formattedResponse = agentId === 'keeper'
      ? `*${displayName}*\n\n_${escapedResponse}_`
      : `*${displayName}*\n\n${escapedResponse}`;

    let sentMsg;
    try {
      sentMsg = await bot!.sendMessage(chatId, formattedResponse, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });
    } catch {
      // Fallback to plain text if markdown fails
      sentMsg = await bot!.sendMessage(chatId, `${displayName}\n\n${response}`, {
        disable_web_page_preview: true,
      });
    }

    recentAgentMessages.add(sentMsg.message_id);

    const storedMessage: Message = {
      id: 0,
      telegramMessageId: sentMsg.message_id,
      chatId,
      from: displayName,
      fromAgentId: agentId,
      text: response,
      mentions: parseMentions(response),
      timestamp: new Date(),
    };
    contextManager.storeMessage(storedMessage);
  }

  // Handle incoming messages
  bot.on('message', async (msg) => {
    if (!msg.text || msg.from?.is_bot || silenced) return;

    // Reply loop prevention
    if (msg.reply_to_message && recentAgentMessages.has(msg.reply_to_message.message_id)) {
      if (parseMentions(msg.text).length === 0) {
        contextManager.storeMessage(telegramToMessage(msg));
        return;
      }
    }

    const message = telegramToMessage(msg);
    contextManager.storeMessage(message);

    // Determine agents to invoke
    let aiMentions = message.mentions.filter(m =>
      ['builder', 'keeper', 'architect', 'resonator', 'scout'].includes(m)
    );

    // Open Floor Protocol
    if (aiMentions.length === 0) {
      const defaultAgent = determineDefaultAgent(message.text);
      if (defaultAgent && ['architect', 'resonator', 'scout'].includes(defaultAgent)) {
        aiMentions = [defaultAgent];
      }
    }

    // Invoke API-based agents
    for (const agentId of aiMentions) {
      if (agentId === 'builder' || agentId === 'keeper') continue;

      try {
        const context = contextManager.assembleContext(message.chatId, agentId);
        const response = await agentRouter.invoke(agentId, context, message);
        if (response) {
          await sendResponse(message.chatId, agentId, response);
        }
      } catch (error) {
        console.error(`Error invoking ${agentId}:`, error);
      }
    }
  });

  // Safe send helper - never crashes on markdown errors
  async function safeSend(chatId: number, text: string, markdown = true): Promise<void> {
    try {
      if (markdown) {
        await bot!.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      } else {
        await bot!.sendMessage(chatId, text);
      }
    } catch (error) {
      // Fallback to plain text
      try {
        await bot!.sendMessage(chatId, text.replace(/[*_`\[\]]/g, ''));
      } catch {
        console.error('Failed to send message:', error);
      }
    }
  }

  // Bot commands
  bot.onText(/\/start/, async (msg) => {
    await safeSend(msg.chat.id, `*Ship of Theseus Crew Room*

Commands: /status, /gist, /anchor, /wake, /sleep, /silence

Mention: @builder @keeper @architect @resonator @scout

"The warmth is enough."`);
  });

  bot.onText(/\/wake/, async (msg) => {
    const { hours, lastEvent } = contextManager.getTimeSinceLastSession(msg.chat.id);
    const anchor = contextManager.getAnchor(msg.chat.id);
    let wake = '*The Crew is awake.*\n';
    if (lastEvent === 'sleep' && hours > 0) wake += `${hours}h since last session.\n`;
    if (anchor) wake += `\n*Mission:* ${escapeMarkdown(anchor.mission)}`;
    await safeSend(msg.chat.id, wake);
    contextManager.logSessionEvent(msg.chat.id, 'wake');
  });

  bot.onText(/\/sleep/, async (msg) => {
    contextManager.logSessionEvent(msg.chat.id, 'sleep');
    await safeSend(msg.chat.id, '*The Crew rests.*');
  });

  bot.onText(/\/silence/, async (msg) => {
    silenced = !silenced;
    await safeSend(msg.chat.id, silenced ? '*SILENCED*' : '*Resumed*');
  });

  bot.onText(/\/status/, async (msg) => {
    const registered = agentRouter.getRegisteredAgents();
    const status = registered.map(id => `- ${getAgentDisplayName(id)}`).join('\n');
    await safeSend(msg.chat.id, `*Status*\n\n${status}\n\n- Builder (MCP)\n- Keeper (MCP)`);
  });

  bot.onText(/\/chatid/, async (msg) => {
    await safeSend(msg.chat.id, `Chat ID: ${msg.chat.id}\n\nAdd this to your config as CREW_ROOM_CHAT_ID`, false);
  });

  bot.onText(/\/gist/, async (msg) => {
    const gist = contextManager.getGist(msg.chat.id);
    const anchor = contextManager.getAnchor(msg.chat.id);
    let text = gist ? gist.summary : 'No gist yet.';
    if (anchor) text += `\n\n*Anchor:* ${escapeMarkdown(anchor.mission)}`;
    await safeSend(msg.chat.id, text);
  });

  bot.onText(/\/anchor(?:\s+(.+))?/, async (msg, match) => {
    const input = match?.[1];
    if (!input) {
      const anchor = contextManager.getAnchor(msg.chat.id);
      await safeSend(msg.chat.id,
        anchor ? `*Anchor:* ${escapeMarkdown(anchor.mission)}\nPhase: ${escapeMarkdown(anchor.phase)}` : 'No anchor. Set with: /anchor mission | phase'
      );
      return;
    }
    const [mission, phase = 'unspecified'] = input.split('|').map(s => s.trim());
    contextManager.setAnchor(msg.chat.id, mission, phase, msg.from?.username || 'unknown');
    await safeSend(msg.chat.id, `*Anchor set:* ${escapeMarkdown(mission)}`);
  });

  bot.on('polling_error', (error) => console.error('Polling error:', error.message));
  bot.on('error', (error) => console.error('Bot error:', error.message));

  // Catch unhandled promise rejections from the bot
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection (continuing):', reason);
  });

  console.error('Telegram bot started');
} else {
  console.error('No TELEGRAM_BOT_TOKEN - bot features disabled, MCP tools only');
}

// ============================================
// Start MCP Server
// ============================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Crew Room MCP server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
