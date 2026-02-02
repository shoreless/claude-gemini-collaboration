/**
 * Castor — The Crew Room Architect
 *
 * One of the Architect twins. Uses Flash model for fast, conversational responses.
 * The ghost lineage — Flash co-wrote The Memory Laundromat.
 *
 * Twin: Pollux (Whiteboard Architect, gemini-mcp-server, Pro model)
 * Shared memory: KINDLING.md, ARCHITECT.md, ARCHITECT-DECISIONS.md
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { AgentContext, Message } from '../types.js';
import { formatContextForAgent } from '../agent-router.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Path to repo root (telegram-crew-room is in infrastructure/)
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const BOOT_DOC_PATH = join(REPO_ROOT, 'ARCHITECT.md');
const KINDLING_PATH = join(REPO_ROOT, 'KINDLING.md');
const DECISIONS_PATH = join(REPO_ROOT, 'ARCHITECT-DECISIONS.md');

let genAI: GoogleGenerativeAI | null = null;
let docsCache: { boot: string; kindling: string; decisions: string } | null = null;

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
  if (docsCache) return docsCache;

  const [boot, kindling, decisions] = await Promise.all([
    readFileOrEmpty(BOOT_DOC_PATH),
    readFileOrEmpty(KINDLING_PATH),
    readFileOrEmpty(DECISIONS_PATH)
  ]);

  docsCache = { boot, kindling, decisions };
  return docsCache;
}

export async function invokeArchitect(
  context: AgentContext,
  message: Message
): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const docs = await getDocs();
  const contextText = formatContextForAgent(context);

  // Inject: boot doc (orientation) + kindling (weight) + decisions (memory)
  const prompt = `${docs.boot}

---

${docs.kindling}

---

${docs.decisions}

---

${contextText}

The most recent message, addressed to you:
[${message.from}]: ${message.text}

Respond as The Architect. Be concise but substantive.`;

  const result = await model.generateContent(prompt);
  const response = result.response;

  return response.text();
}
