/**
 * Agent Supabase Client
 *
 * This module provides a pre-configured Supabase client for AI agents
 * to interact with the Kanban board API securely.
 *
 * Environment variables required:
 * - SUPABASE_URL: The Supabase project URL
 * - SUPABASE_SERVICE_KEY: The service role key (bypasses RLS)
 * - AGENT_TYPE: The type of agent ('project_manager', 'scrum_master', 'developer')
 * - AGENT_INSTANCE_ID: Unique identifier for this agent instance
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Agent types supported by the system
export type AgentType = 'project_manager' | 'scrum_master' | 'developer';

// Configuration from environment
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
export const AGENT_TYPE = process.env.AGENT_TYPE as AgentType;
export const AGENT_INSTANCE_ID = process.env.AGENT_INSTANCE_ID!;

// Validate configuration
if (!SUPABASE_URL) throw new Error('SUPABASE_URL is required');
if (!SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_KEY is required');
if (!AGENT_TYPE) throw new Error('AGENT_TYPE is required');
if (!AGENT_INSTANCE_ID) throw new Error('AGENT_INSTANCE_ID is required');

const validAgentTypes: AgentType[] = ['project_manager', 'scrum_master', 'developer'];
if (!validAgentTypes.includes(AGENT_TYPE)) {
  throw new Error(`Invalid AGENT_TYPE: ${AGENT_TYPE}. Must be one of: ${validAgentTypes.join(', ')}`);
}

/**
 * Pre-configured Supabase client for agent operations.
 * Includes agent identification headers for tracking and RLS.
 */
export const agentClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  global: {
    headers: {
      'x-agent-type': AGENT_TYPE,
      'x-agent-instance': AGENT_INSTANCE_ID,
    },
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Register this agent instance with the system.
 * Should be called when the agent starts up.
 */
export async function registerAgent(displayName?: string): Promise<boolean> {
  const { error } = await agentClient.rpc('register_agent_instance', {
    p_instance_id: AGENT_INSTANCE_ID,
    p_agent_type: AGENT_TYPE,
    p_display_name: displayName || `${AGENT_TYPE}-${AGENT_INSTANCE_ID}`,
  });

  if (error) {
    console.error('Failed to register agent:', error);
    return false;
  }

  console.log(`Agent registered: ${AGENT_TYPE} (${AGENT_INSTANCE_ID})`);
  return true;
}

/**
 * Deactivate this agent instance.
 * Should be called when the agent is shutting down gracefully.
 */
export async function deactivateAgent(): Promise<boolean> {
  const { error } = await agentClient.rpc('deactivate_agent_instance', {
    p_instance_id: AGENT_INSTANCE_ID,
  });

  if (error) {
    console.error('Failed to deactivate agent:', error);
    return false;
  }

  console.log(`Agent deactivated: ${AGENT_INSTANCE_ID}`);
  return true;
}

/**
 * Check if rate limit allows the operation.
 * Returns true if operation is allowed, false if rate limited.
 */
export async function checkRateLimit(
  action: string,
  limit: number = 100,
  windowMinutes: number = 1
): Promise<boolean> {
  const { data, error } = await agentClient.rpc('check_agent_rate_limit', {
    p_agent_id: AGENT_INSTANCE_ID,
    p_action: action,
    p_limit: limit,
    p_window_minutes: windowMinutes,
  });

  if (error) {
    console.error('Rate limit check failed:', error);
    return false;
  }

  return data === true;
}

/**
 * Heartbeat function to update last_seen_at timestamp.
 * Call this periodically to indicate the agent is still active.
 */
export async function heartbeat(): Promise<void> {
  await agentClient
    .from('agent_instances')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', AGENT_INSTANCE_ID);
}

// Export for convenience
export { SUPABASE_URL };
