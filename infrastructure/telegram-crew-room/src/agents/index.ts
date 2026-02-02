/**
 * Agent Connectors — Index
 *
 * This module exports all agent invocation functions and
 * provides a unified registration function for the router.
 */

import { AgentRouter } from '../agent-router.js';
import { invokeArchitect } from './gemini.js';
import { invokeResonator } from './deepseek.js';
import { invokeScout } from './perplexity.js';

/**
 * Register all API-based agents with the router.
 *
 * Note: The Builder and Keeper (both Claudes) participate
 * differently — they read messages via MCP and respond via
 * telegram_send. They're not always-on services.
 *
 * This function registers the agents that CAN be invoked
 * automatically when @mentioned.
 */
export function registerAgents(router: AgentRouter): void {
  // The Architect (Gemini)
  router.register({
    agentId: 'architect',
    mentionTriggers: ['@architect', '@gemini'],
    invoke: invokeArchitect
  });

  // The Resonator (DeepSeek)
  router.register({
    agentId: 'resonator',
    mentionTriggers: ['@resonator', '@deepseek'],
    invoke: invokeResonator
  });

  // The Scout (Perplexity)
  router.register({
    agentId: 'scout',
    mentionTriggers: ['@scout', '@perplexity'],
    invoke: invokeScout
  });

  console.error('Registered agents: architect, resonator, scout');
  console.error('Note: builder and keeper participate via MCP, not auto-invoke');
}

export { invokeArchitect } from './gemini.js';
export { invokeResonator } from './deepseek.js';
export { invokeScout } from './perplexity.js';
