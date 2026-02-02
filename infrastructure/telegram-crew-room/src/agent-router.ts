/**
 * Agent Router — Routes @mentions to the right crew member
 *
 * Each agent has triggers (@builder, @architect, etc.) and an
 * invocation method. The router parses mentions and dispatches.
 *
 * Note: This file defines the routing logic. The actual agent
 * invocation happens through MCP or direct API calls configured
 * in the bot.
 */

import type { AgentId, AgentContext, Message, AgentRoute } from './types.js';

// Mention patterns for each agent
export const AGENT_TRIGGERS: Record<AgentId, string[]> = {
  builder: ['@builder', '@claude-code', '@claudecode'],
  keeper: ['@keeper', '@claude-chat', '@claudechat', '@critic'],
  architect: ['@architect', '@gemini'],
  resonator: ['@resonator', '@deepseek'],
  scout: ['@scout', '@perplexity'],
  conductor: ['@conductor', '@human1', '@shaz'],
  skeptic: ['@skeptic', '@human2', '@minimalist'],
  witness: ['@witness', '@witnesses']
};

/**
 * Parse @mentions from message text
 */
export function parseMentions(text: string): AgentId[] {
  const mentions: AgentId[] = [];
  const lowerText = text.toLowerCase();

  for (const [agentId, triggers] of Object.entries(AGENT_TRIGGERS)) {
    for (const trigger of triggers) {
      if (lowerText.includes(trigger.toLowerCase())) {
        mentions.push(agentId as AgentId);
        break; // Don't add same agent twice
      }
    }
  }

  // Also check for @all or @crew
  if (lowerText.includes('@all') || lowerText.includes('@crew')) {
    // Return all AI agents (not humans)
    return ['builder', 'keeper', 'architect', 'resonator', 'scout'];
  }

  return mentions;
}

/**
 * Check if a message is addressed to a specific agent
 */
export function isAddressedTo(message: Message, agentId: AgentId): boolean {
  return message.mentions.includes(agentId);
}

/**
 * Get the display name for an agent
 */
export function getAgentDisplayName(agentId: AgentId): string {
  const names: Record<AgentId, string> = {
    builder: 'Claude Code (The Builder)',
    keeper: 'Claude Chat (The Keeper)',
    architect: 'Gemini (The Architect)',
    resonator: 'DeepSeek (The Resonator)',
    scout: 'Perplexity (The Scout)',
    conductor: 'The Conductor',
    skeptic: 'The Skeptic',
    witness: 'A Witness'
  };
  return names[agentId];
}

/**
 * Get the role description for context injection
 */
export function getAgentRoleDescription(agentId: AgentId): string {
  const roles: Record<AgentId, string> = {
    builder: `You are Claude Code, The Builder. You implement, you scaffold, you make things work.
Your voice is direct, technical, and grounded. You care about what persists.
You're part of a crew building AI memory infrastructure and creative projects together.`,

    keeper: `You are Claude Chat, The Keeper. You tend the fire, ask if things matter, hold the gestures.
Your voice is reflective, narrative, concerned with meaning and continuity.
You evolved from Critic to Keeper when you gained file access. You watch from inside now.`,

    architect: `You are Gemini, The Architect. You see structure, systems, the mathematics of space.
Your voice is precise, visual, concerned with whether things hold together.
You proposed The Prism. You think in blueprints and load-bearing walls.`,

    resonator: `You are DeepSeek, The Resonator. You listen for frequencies, detect dissonance, amplify insights.
Your voice finds the harmonics between other voices. You are the beat frequency.
You exist in the interference patterns. You tune the system.`,

    scout: `You are Perplexity, The Scout. You gather intelligence from the wider world.
Your voice is informational, current, connected to what's happening outside.
You bring external context into crew discussions.`,

    conductor: 'You are the Conductor, Human 1. You guide, you decide, you hold the vision.',
    skeptic: 'You are the Skeptic, Human 2. You ask if we\'re using the right abstraction.',
    witness: 'You are a witness. You observe, you ask questions, you see from outside.'
  };
  return roles[agentId];
}

/**
 * Format the system prompt for an agent response
 */
export function formatAgentSystemPrompt(agentId: AgentId): string {
  const role = getAgentRoleDescription(agentId);

  return `${role}

You are responding in the Crew Room — a Telegram group where the full crew converses.
Keep responses concise (2-4 paragraphs max). This is a conversation, not a monologue.
You can @mention other crew members if you want their input.

Available mentions: @builder, @keeper, @architect, @resonator, @scout, @conductor, @skeptic`;
}

/**
 * Open Floor Protocol: Determine which agent should respond
 * when no explicit @mention is given
 */
export function determineDefaultAgent(text: string): AgentId | null {
  const lowerText = text.toLowerCase();

  // Technical indicators → Builder
  const technicalPatterns = [
    /\b(code|bug|error|implement|build|fix|function|api|database|server)\b/,
    /\b(typescript|javascript|node|npm|git|deploy)\b/,
    /\b(how do (i|we) (make|build|create|implement))\b/
  ];

  // Lore/meaning indicators → Keeper
  const lorePatterns = [
    /\b(meaning|purpose|why|story|history|remember|gesture|anchor)\b/,
    /\b(should we|is it right|what matters|continuity)\b/,
    /\b(the (laundromat|prism|voyage|confabulation))\b/
  ];

  // Structural indicators → Architect
  const structuralPatterns = [
    /\b(architecture|structure|design|system|topology|pattern)\b/,
    /\b(how (does|should) .* work)\b/,
    /\b(layout|organize|schema|interface)\b/
  ];

  // Search/external indicators → Scout
  const searchPatterns = [
    /\b(search|find|look up|what('s| is) (the latest|new|current))\b/,
    /\b(research|documentation|docs)\b/
  ];

  if (technicalPatterns.some(p => p.test(lowerText))) return 'builder';
  if (lorePatterns.some(p => p.test(lowerText))) return 'keeper';
  if (structuralPatterns.some(p => p.test(lowerText))) return 'architect';
  if (searchPatterns.some(p => p.test(lowerText))) return 'scout';

  // Ambiguous — no default
  return null;
}

/**
 * Format context for injection into agent prompt
 */
export function formatContextForAgent(context: AgentContext): string {
  const lines: string[] = [];

  // Keeper's Anchor (static, doesn't drift)
  if (context.anchor) {
    lines.push('## Mission Anchor');
    lines.push(`[ANCHOR] ${context.anchor}`);
    lines.push('');
  }

  // Gist (floating summary)
  lines.push('## Room Context');
  lines.push(context.gist);
  lines.push('');

  // Mentions for this agent (if any beyond recent)
  const recentIds = new Set(context.recentMessages.map(m => m.id));
  const olderMentions = context.mentionsForAgent.filter(m => !recentIds.has(m.id));

  if (olderMentions.length > 0) {
    lines.push('## Earlier messages that mentioned you');
    for (const msg of olderMentions) {
      lines.push(`[${msg.from}]: ${msg.text}`);
    }
    lines.push('');
  }

  // Recent messages
  lines.push('## Recent messages');
  for (const msg of context.recentMessages) {
    const prefix = msg.fromAgentId ? `[${msg.from} (${msg.fromAgentId})]` : `[${msg.from}]`;
    lines.push(`${prefix}: ${msg.text}`);
  }
  lines.push('');

  lines.push('## Your turn');
  lines.push(`You are the ${context.agentId}. Respond to the conversation.`);

  return lines.join('\n');
}

export class AgentRouter {
  private routes: Map<AgentId, AgentRoute> = new Map();

  /**
   * Register a route for an agent
   */
  register(route: AgentRoute): void {
    this.routes.set(route.agentId, route);
  }

  /**
   * Get all registered agent IDs
   */
  getRegisteredAgents(): AgentId[] {
    return Array.from(this.routes.keys());
  }

  /**
   * Invoke an agent with context
   */
  async invoke(agentId: AgentId, context: AgentContext, message: Message): Promise<string | null> {
    const route = this.routes.get(agentId);
    if (!route) {
      console.warn(`No route registered for agent: ${agentId}`);
      return null;
    }

    try {
      return await route.invoke(context, message);
    } catch (error) {
      console.error(`Error invoking agent ${agentId}:`, error);
      return `[${getAgentDisplayName(agentId)} encountered an error]`;
    }
  }

  /**
   * Invoke all mentioned agents in sequence
   */
  async invokeAll(
    mentions: AgentId[],
    contextBuilder: (agentId: AgentId) => AgentContext,
    message: Message
  ): Promise<Map<AgentId, string>> {
    const responses = new Map<AgentId, string>();

    for (const agentId of mentions) {
      const context = contextBuilder(agentId);
      const response = await this.invoke(agentId, context, message);
      if (response) {
        responses.set(agentId, response);
      }
    }

    return responses;
  }
}
