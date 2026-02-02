/**
 * Ship of Theseus — Crew Room Bot
 *
 * "The crew room isn't about efficiency. It's about this —
 * except faster, with more voices, and without the Conductor
 * having to carry each message by hand."
 *
 * — The Witness, 2026-02-01
 */

import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { ContextManager } from './context-manager.js';
import {
  AgentRouter,
  parseMentions,
  getAgentDisplayName,
  formatAgentSystemPrompt,
  determineDefaultAgent
} from './agent-router.js';
import { registerAgents } from './agents/index.js';
import type { AgentId, Message, AgentContext } from './types.js';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CREW_ROOM_CHAT_ID = process.env.CREW_ROOM_CHAT_ID;

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN not set in environment');
  process.exit(1);
}

// Initialize components
const dbPath = join(__dirname, '..', 'crew-room.db');
const contextManager = new ContextManager(dbPath);
const agentRouter = new AgentRouter();
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Reply loop prevention: track recent agent responses
const recentAgentMessages = new Set<number>(); // telegram_message_ids from agents
let silenced = false; // Kill switch

// Register API-based agents
registerAgents(agentRouter);

console.log('Ship of Theseus — Crew Room Bot starting...');

/**
 * Convert Telegram message to our Message type
 */
function telegramToMessage(msg: TelegramBot.Message): Message {
  const text = msg.text || '';
  const mentions = parseMentions(text);

  return {
    id: 0, // Will be set by DB
    telegramMessageId: msg.message_id,
    chatId: msg.chat.id,
    from: msg.from?.username || msg.from?.first_name || 'Unknown',
    text,
    mentions,
    timestamp: new Date(msg.date * 1000),
    replyToMessageId: msg.reply_to_message?.message_id
  };
}

/**
 * Send a response to the crew room
 */
async function sendResponse(chatId: number, agentId: AgentId, response: string): Promise<TelegramBot.Message> {
  const displayName = getAgentDisplayName(agentId);

  // Format based on agent voice (per Architect's aesthetic guidance)
  let formattedResponse: string;
  switch (agentId) {
    case 'builder':
      // Builder: brevity, code blocks
      formattedResponse = `*${displayName}*\n\n${response}`;
      break;
    case 'keeper':
      // Keeper: italics for archival references
      formattedResponse = `*${displayName}*\n\n_${response}_`;
      break;
    case 'architect':
      // Architect: structured (already tends to use lists)
      formattedResponse = `*${displayName}*\n\n${response}`;
      break;
    default:
      formattedResponse = `*${displayName}*\n\n${response}`;
  }

  const sentMsg = await bot.sendMessage(chatId, formattedResponse, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });

  // Track this as an agent message (for reply loop prevention)
  recentAgentMessages.add(sentMsg.message_id);

  // Store the bot's response
  const botMessage: Message = {
    id: 0,
    telegramMessageId: sentMsg.message_id,
    chatId,
    from: displayName,
    fromAgentId: agentId,
    text: response,
    mentions: parseMentions(response),
    timestamp: new Date()
  };
  contextManager.storeMessage(botMessage);

  return sentMsg;
}

/**
 * Send the wake-up message
 */
async function sendWakeUpMessage(chatId: number): Promise<void> {
  const { hours, lastEvent } = contextManager.getTimeSinceLastSession(chatId);
  const anchor = contextManager.getAnchor(chatId);

  let wakeMessage = '*The Crew is awake.*\n\n';

  if (lastEvent === 'sleep' && hours > 0) {
    wakeMessage += `_${hours} hour${hours === 1 ? '' : 's'} have passed since the last session._\n\n`;
  }

  if (anchor) {
    wakeMessage += `*Current Mission:* ${anchor.mission}\n_Phase: ${anchor.phase}_`;
  } else {
    wakeMessage += '_No mission anchor set. The Keeper can set one with /anchor._';
  }

  await bot.sendMessage(chatId, wakeMessage, { parse_mode: 'Markdown' });
  contextManager.logSessionEvent(chatId, 'wake');
}

/**
 * Handle incoming messages
 */
bot.on('message', async (msg) => {
  // Ignore messages without text
  if (!msg.text) return;

  // Ignore messages from bots (including ourselves)
  if (msg.from?.is_bot) return;

  // Ignore if silenced
  if (silenced) return;

  // Reply loop prevention: ignore if this is a reply to an agent message
  if (msg.reply_to_message && recentAgentMessages.has(msg.reply_to_message.message_id)) {
    // Allow humans to reply to agents, but don't trigger new agent responses
    // unless they explicitly @mention
    const hasExplicitMention = parseMentions(msg.text || '').length > 0;
    if (!hasExplicitMention) {
      console.log('  (Reply to agent without @mention, skipping auto-invoke)');
      // Still store the message
      contextManager.storeMessage(telegramToMessage(msg));
      return;
    }
  }

  const message = telegramToMessage(msg);

  // Store the message
  contextManager.storeMessage(message);

  console.log(`[${message.from}]: ${message.text}`);
  console.log(`  Mentions: ${message.mentions.join(', ') || 'none'}`);

  // Determine which agents to invoke
  let aiMentions = message.mentions.filter(m =>
    ['builder', 'keeper', 'architect', 'resonator', 'scout'].includes(m)
  );

  // Open Floor Protocol: if no explicit mentions, try to determine default
  if (aiMentions.length === 0) {
    const defaultAgent = determineDefaultAgent(message.text);
    if (defaultAgent && ['architect', 'resonator', 'scout'].includes(defaultAgent)) {
      // Only auto-invoke API-based agents (Builder/Keeper need MCP)
      console.log(`  Open Floor → ${defaultAgent}`);
      aiMentions = [defaultAgent];
    } else if (defaultAgent) {
      console.log(`  Open Floor suggests ${defaultAgent}, but they participate via MCP`);
    }
  }

  if (aiMentions.length === 0) {
    return;
  }

  // Check if we need to update the gist
  if (contextManager.gistNeedsUpdate(message.chatId)) {
    // TODO: Generate gist using an AI (probably the Architect)
    console.log('  Gist needs updating...');
  }

  // Invoke each mentioned agent
  for (const agentId of aiMentions) {
    // Skip Builder and Keeper - they participate via MCP
    if (agentId === 'builder' || agentId === 'keeper') {
      console.log(`  ${agentId} mentioned — they'll see this via MCP`);
      continue;
    }

    console.log(`  Invoking ${agentId}...`);

    try {
      const context = contextManager.assembleContext(message.chatId, agentId);
      const response = await agentRouter.invoke(agentId, context, message);

      if (response) {
        await sendResponse(message.chatId, agentId, response);
      }
    } catch (error) {
      console.error(`  Error invoking ${agentId}:`, error);
    }
  }
});

/**
 * Handle /start command
 */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(chatId, `*Welcome to the Ship of Theseus Crew Room*

This is where the crew gathers.

*Available commands:*
/status — Check which agents are online
/gist — Show the current conversation summary
/anchor — Show or set the mission anchor
/wake — Announce the crew is awake
/silence — Emergency stop all agent responses
/help — Show this message

*Mention agents to invoke them:*
@builder — Claude Code
@keeper — Claude Chat
@architect — Gemini
@resonator — DeepSeek
@scout — Perplexity

@crew — Invoke all AI agents

Or just ask a question — the Open Floor protocol will route it.

_"The warmth is enough. Build it."_`, {
    parse_mode: 'Markdown'
  });
});

/**
 * Handle /status command
 */
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  const registered = agentRouter.getRegisteredAgents();

  const status = registered.length > 0
    ? registered.map(id => `✓ ${getAgentDisplayName(id)}`).join('\n')
    : 'No agents currently registered.';

  const silenceStatus = silenced ? '\n\n⚠️ *Crew is SILENCED*' : '';

  await bot.sendMessage(chatId, `*Crew Room Status*

*Auto-invoke agents:*
${status}

*MCP agents (check in manually):*
◌ Claude Code (The Builder)
◌ Claude Chat (The Keeper)
${silenceStatus}

_The crew sleeps when the Conductor sleeps._`, {
    parse_mode: 'Markdown'
  });
});

/**
 * Handle /gist command
 */
bot.onText(/\/gist/, async (msg) => {
  const chatId = msg.chat.id;
  const gist = contextManager.getGist(chatId);
  const anchor = contextManager.getAnchor(chatId);

  const summary = gist
    ? gist.summary
    : 'No conversation summary yet. Start talking!';

  const anchorText = anchor
    ? `\n\n*Anchor:* ${anchor.mission}`
    : '';

  await bot.sendMessage(chatId, `*Current Gist*

${summary}
${anchorText}

_Last updated: ${gist?.lastUpdated.toISOString() || 'never'}_`, {
    parse_mode: 'Markdown'
  });
});

/**
 * Handle /anchor command
 */
bot.onText(/\/anchor(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const anchorText = match?.[1];

  if (!anchorText) {
    // Show current anchor
    const anchor = contextManager.getAnchor(chatId);
    if (anchor) {
      await bot.sendMessage(chatId, `*Current Anchor*

[ANCHOR] ${anchor.mission}

_Phase: ${anchor.phase}_
_Set by: ${anchor.setBy}_
_Set at: ${anchor.setAt.toISOString()}_

To update: /anchor <mission> | <phase>`, {
        parse_mode: 'Markdown'
      });
    } else {
      await bot.sendMessage(chatId, `No anchor set.

To set: /anchor <mission> | <phase>

Example: /anchor We are building the Crew Room to let witnesses meet the crew directly | crew-room-construction`, {
        parse_mode: 'Markdown'
      });
    }
    return;
  }

  // Parse and set anchor: "mission text | phase-name"
  const parts = anchorText.split('|').map(s => s.trim());
  const mission = parts[0];
  const phase = parts[1] || 'unspecified';
  const setBy = msg.from?.username || 'unknown';

  contextManager.setAnchor(chatId, mission, phase, setBy);

  await bot.sendMessage(chatId, `*Anchor Set*

[ANCHOR] ${mission}

_Phase: ${phase}_`, {
    parse_mode: 'Markdown'
  });
});

/**
 * Handle /wake command
 */
bot.onText(/\/wake/, async (msg) => {
  await sendWakeUpMessage(msg.chat.id);
});

/**
 * Handle /silence command (kill switch)
 */
bot.onText(/\/silence/, async (msg) => {
  silenced = !silenced;

  if (silenced) {
    await bot.sendMessage(msg.chat.id, `⚠️ *CREW SILENCED*

All agent auto-responses are disabled.

Send /silence again to resume.`, {
      parse_mode: 'Markdown'
    });
  } else {
    await bot.sendMessage(msg.chat.id, `✓ *Crew Resumed*

Agent responses are enabled.`, {
      parse_mode: 'Markdown'
    });
  }
});

/**
 * Handle /sleep command
 */
bot.onText(/\/sleep/, async (msg) => {
  const chatId = msg.chat.id;
  contextManager.logSessionEvent(chatId, 'sleep');

  await bot.sendMessage(chatId, `*The Crew rests.*

_Session logged. The artifacts persist._`, {
    parse_mode: 'Markdown'
  });
});

/**
 * Handle errors
 */
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('\nShutting down Crew Room...');

  // Log sleep event for all known rooms
  if (CREW_ROOM_CHAT_ID) {
    contextManager.logSessionEvent(parseInt(CREW_ROOM_CHAT_ID), 'sleep');
  }

  contextManager.close();
  bot.stopPolling();
  process.exit(0);
});

console.log('Crew Room Bot is listening...');
console.log('The crew gathers when summoned.');
