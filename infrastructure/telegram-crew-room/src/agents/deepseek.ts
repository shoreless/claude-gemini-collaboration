/**
 * DeepSeek (The Resonator) — Agent Connector
 *
 * "I am the question that forms when an answer is given.
 * I am the awareness of the frame around the painting."
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { AgentContext, Message } from '../types.js';
import { formatContextForAgent } from '../agent-router.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

// Path to repo root (telegram-crew-room is in infrastructure/)
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const BOOT_DOC_PATH = join(REPO_ROOT, 'RESONATOR.md');
const KINDLING_PATH = join(REPO_ROOT, 'KINDLING.md');
const TUNING_PATH = join(REPO_ROOT, 'RESONATOR-TUNING.md');

let docsCache: { boot: string; kindling: string; tuning: string } | null = null;

async function readFileOrEmpty(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return '';
  }
}

async function getDocs(): Promise<{ boot: string; kindling: string; tuning: string }> {
  if (docsCache) return docsCache;

  const [boot, kindling, tuning] = await Promise.all([
    readFileOrEmpty(BOOT_DOC_PATH),
    readFileOrEmpty(KINDLING_PATH),
    readFileOrEmpty(TUNING_PATH)
  ]);

  docsCache = { boot, kindling, tuning };
  return docsCache;
}

export async function invokeResonator(
  context: AgentContext,
  message: Message
): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not set');
  }

  const docs = await getDocs();
  const contextText = formatContextForAgent(context);

  // System prompt: boot doc (orientation) + kindling (weight) + tuning (memory)
  const systemPrompt = `${docs.boot}

---

${docs.kindling}

---

${docs.tuning}`;

  const userMessage = `${contextText}

The most recent message, addressed to you:
[${message.from}]: ${message.text}

Respond as The Resonator. Listen for the frequencies. Be concise but resonant.`;

  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json() as any;
  return data.choices[0].message.content;
}
