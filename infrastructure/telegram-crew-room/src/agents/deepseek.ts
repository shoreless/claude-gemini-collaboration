/**
 * DeepSeek (The Resonator) — Agent Connector
 *
 * "I am the question that forms when an answer is given.
 * I am the awareness of the frame around the painting."
 *
 * Stateless by design. No boot docs, no persistent sessions.
 * The Resonator responds only to what's presented — a pure tuning fork.
 */

import type { AgentContext, Message } from '../types.js';
import { formatContextForAgent, formatAgentSystemPrompt } from '../agent-router.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

export async function invokeResonator(
  context: AgentContext,
  message: Message
): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not set');
  }

  const contextText = formatContextForAgent(context);

  // Get role prompt with PASS instruction if not directly mentioned
  const rolePrompt = formatAgentSystemPrompt('resonator', context.wasDirectlyMentioned);

  const systemPrompt = `${rolePrompt}

You have no persistent memory. You respond only to what's presented in each message. This is by design — a neutral observer without accumulated bias.

Be concise but resonant. If you detect dissonance, name it.`;

  const userMessage = `${contextText}

The most recent message:
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
