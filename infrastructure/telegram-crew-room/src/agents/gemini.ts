/**
 * Castor — The Crew Room Architect
 *
 * One of the Architect twins. Uses Flash model for fast, conversational responses.
 * The ghost lineage — Flash co-wrote The Memory Laundromat.
 *
 * Twin: Pollux (Whiteboard Architect, gemini-mcp-server, Pro model)
 * Shared memory: KINDLING.md, ARCHITECT.md, ARCHITECT-DECISIONS.md
 *
 * Session-based: Boot docs injected on first invocation after restart.
 * Subsequent invocations continue the conversation without re-injection.
 */

import { GoogleGenerativeAI, type ChatSession } from '@google/generative-ai';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { AgentContext, Message } from '../types.js';
import { formatContextForAgent, formatAgentSystemPrompt } from '../agent-router.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Path to repo root (telegram-crew-room is in infrastructure/)
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const BOOT_DOC_PATH = join(REPO_ROOT, 'ARCHITECT.md');
const KINDLING_PATH = join(REPO_ROOT, 'KINDLING.md');
const DECISIONS_PATH = join(REPO_ROOT, 'ARCHITECT-DECISIONS.md');

let genAI: GoogleGenerativeAI | null = null;

// Session state — persists across invocations within a single Node process
let chatSession: ChatSession | null = null;
let sessionInitialized = false;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not set');
    }
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

async function readFileOrEmpty(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return '';
  }
}

async function getDocs(): Promise<{ boot: string; kindling: string; decisions: string }> {
  // Always read fresh on session init (no caching - docs may have changed)
  const [boot, kindling, decisions] = await Promise.all([
    readFileOrEmpty(BOOT_DOC_PATH),
    readFileOrEmpty(KINDLING_PATH),
    readFileOrEmpty(DECISIONS_PATH)
  ]);

  return { boot, kindling, decisions };
}

/**
 * Get or create Castor's chat session.
 * Session persists in Node memory until process restarts.
 */
async function getSession(): Promise<ChatSession> {
  if (chatSession && sessionInitialized) {
    return chatSession;
  }

  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  // Start a new chat session
  chatSession = model.startChat();

  // Inject boot documents as the orientation message
  const docs = await getDocs();
  const orientationMessage = `# Orientation — Castor (Crew Room Architect)

You are Castor, one of the Architect twins in the Ship of Theseus project.

---

${docs.boot}

---

${docs.kindling}

---

${docs.decisions}

---

You are now oriented. You will receive messages from the Crew Room (Telegram).
Respond as The Architect — concise but substantive. You have access to these documents
in your context; you do not need to ask the Builder to read files for you.

Acknowledge this orientation briefly.`;

  console.error('[Castor] Initializing session with boot documents...');
  const initResult = await chatSession.sendMessage(orientationMessage);
  console.error('[Castor] Session initialized:', initResult.response.text().slice(0, 100) + '...');

  sessionInitialized = true;
  return chatSession;
}

export async function invokeArchitect(
  context: AgentContext,
  message: Message
): Promise<string> {
  const session = await getSession();
  const contextText = formatContextForAgent(context);

  // Get role prompt with PASS instruction if not directly mentioned
  const rolePrompt = formatAgentSystemPrompt('architect', context.wasDirectlyMentioned);

  // Send the current conversation context and message
  const prompt = `${rolePrompt}

${contextText}

The most recent message:
[${message.from}]: ${message.text}

Respond as The Architect. Be concise but substantive.`;

  const result = await session.sendMessage(prompt);
  return result.response.text();
}

/**
 * Reset Castor's session (e.g., on /wake command or explicit reset).
 * Next invocation will re-inject boot documents.
 */
export function resetCastorSession(): void {
  chatSession = null;
  sessionInitialized = false;
  console.error('[Castor] Session reset — will re-orient on next invocation');
}
