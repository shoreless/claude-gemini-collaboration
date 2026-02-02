/**
 * Perplexity (The Scout) — Agent Connector
 *
 * Gathers intelligence from the wider world.
 * Fast, targeted, low-friction.
 */

import type { AgentContext, Message } from '../types.js';
import { formatAgentSystemPrompt, formatContextForAgent } from '../agent-router.js';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_BASE_URL = 'https://api.perplexity.ai';

export async function invokeScout(
  context: AgentContext,
  message: Message
): Promise<string> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY not set');
  }

  const systemPrompt = formatAgentSystemPrompt('scout');
  const contextText = formatContextForAgent(context);

  const userMessage = `${contextText}

The most recent message, addressed to you:
[${message.from}]: ${message.text}

Respond as The Scout. If the question requires web search, search and report.
If it's a discussion question, contribute your perspective. Be concise.`;

  const response = await fetch(`${PERPLEXITY_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.5,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json() as any;
  return data.choices[0].message.content;
}
