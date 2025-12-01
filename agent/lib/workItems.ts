/**
 * Work Item Operations for Agents
 *
 * This module provides functions for agents to interact with work items,
 * including claiming, releasing, and completing items.
 */

import { agentClient, AGENT_TYPE, AGENT_INSTANCE_ID, checkRateLimit } from './supabase';

// Work item types that each agent can process
const AGENT_ITEM_TYPES: Record<string, string[]> = {
  project_manager: ['project_spec', 'feature'],
  scrum_master: ['prd'],
  developer: ['story', 'bug', 'task'],
};

export interface WorkItem {
  id: string;
  project_id: string;
  parent_id?: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  assigned_agent?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Get the work item types this agent can process.
 */
export function getProcessableTypes(): string[] {
  return AGENT_ITEM_TYPES[AGENT_TYPE] || [];
}

/**
 * Find available work items that this agent can claim.
 * Returns items in 'ready' status of types this agent can process.
 */
export async function findAvailableItems(limit: number = 10): Promise<WorkItem[]> {
  const types = getProcessableTypes();
  if (types.length === 0) return [];

  const { data, error } = await agentClient
    .from('work_items')
    .select('*')
    .eq('status', 'ready')
    .is('assigned_agent', null)
    .in('type', types)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Failed to find available items:', error);
    return [];
  }

  return data || [];
}

/**
 * Attempt to claim a work item atomically.
 * Returns true if claim was successful, false if item was already claimed.
 */
export async function claimItem(workItemId: string): Promise<boolean> {
  // Check rate limit first
  const allowed = await checkRateLimit('claim', 10, 1);
  if (!allowed) {
    console.warn('Rate limited: claim operation');
    return false;
  }

  const { data, error } = await agentClient.rpc('claim_work_item', {
    p_work_item_id: workItemId,
    p_agent_type: AGENT_TYPE,
    p_agent_instance_id: AGENT_INSTANCE_ID,
  });

  if (error) {
    console.error('Claim failed:', error);
    return false;
  }

  return data === true;
}

/**
 * Release a claimed work item back to 'ready' status.
 */
export async function releaseItem(workItemId: string, reason: string = 'released'): Promise<boolean> {
  const { data, error } = await agentClient.rpc('release_work_item', {
    p_work_item_id: workItemId,
    p_agent_instance_id: AGENT_INSTANCE_ID,
    p_reason: reason,
  });

  if (error) {
    console.error('Release failed:', error);
    return false;
  }

  return data === true;
}

/**
 * Claim the next available work item of the types this agent processes.
 * Automatically retries if another agent claims the item first.
 */
export async function claimNextItem(maxRetries: number = 3): Promise<WorkItem | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const items = await findAvailableItems(5);
    if (items.length === 0) return null;

    for (const item of items) {
      const claimed = await claimItem(item.id);
      if (claimed) {
        console.log(`Claimed item: ${item.id} (${item.title})`);
        return item;
      }
    }

    // Wait briefly before retrying
    if (attempt < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }

  return null;
}

/**
 * Get a work item by ID.
 */
export async function getItem(workItemId: string): Promise<WorkItem | null> {
  const { data, error } = await agentClient
    .from('work_items')
    .select('*')
    .eq('id', workItemId)
    .single();

  if (error) {
    console.error('Failed to get item:', error);
    return null;
  }

  return data;
}

/**
 * Get all items currently claimed by this agent instance.
 */
export async function getClaimedItems(): Promise<WorkItem[]> {
  const { data, error } = await agentClient
    .from('work_items')
    .select('*')
    .eq('assigned_agent', AGENT_TYPE)
    .eq('status', 'in_progress')
    .containedBy('metadata', { claimed_by_instance: AGENT_INSTANCE_ID });

  if (error) {
    console.error('Failed to get claimed items:', error);
    return [];
  }

  return data || [];
}

/**
 * Update a work item's metadata while processing.
 */
export async function updateItemMetadata(
  workItemId: string,
  metadata: Record<string, unknown>
): Promise<boolean> {
  const item = await getItem(workItemId);
  if (!item || item.metadata?.claimed_by_instance !== AGENT_INSTANCE_ID) {
    console.error('Cannot update item: not claimed by this agent');
    return false;
  }

  const { error } = await agentClient
    .from('work_items')
    .update({
      metadata: { ...item.metadata, ...metadata },
      updated_at: new Date().toISOString(),
    })
    .eq('id', workItemId);

  if (error) {
    console.error('Failed to update metadata:', error);
    return false;
  }

  return true;
}

/**
 * Get child items of a work item.
 */
export async function getChildItems(parentId: string): Promise<WorkItem[]> {
  const { data, error } = await agentClient
    .from('work_items')
    .select('*')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to get child items:', error);
    return [];
  }

  return data || [];
}
