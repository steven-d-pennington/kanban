/**
 * Handoff Protocols for Agents
 *
 * This module provides functions for agents to complete work items
 * and hand them off to the next stage in the pipeline.
 */

import { agentClient, AGENT_TYPE, AGENT_INSTANCE_ID } from './supabase';
import { ActivityLogger } from './activityLogger';
import type { WorkItem } from './workItems';

export interface ChildItemSpec {
  type: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface HandoffResult {
  success: boolean;
  completedItem?: string;
  childItems?: Array<{ id: string; type: string; title: string }>;
  validationErrors?: string[];
  error?: string;
}

export interface HandoffRule {
  source_type: string;
  processed_by: string;
  output_type: string;
  creates_types: string[];
  validation_rules: Record<string, unknown>;
}

/**
 * Get the handoff rules for a given item type.
 */
export async function getHandoffRule(itemType: string): Promise<HandoffRule | null> {
  const { data, error } = await agentClient
    .from('handoff_rules')
    .select('*')
    .eq('source_type', itemType)
    .eq('processed_by', AGENT_TYPE)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Validate output against handoff rules.
 */
export async function validateOutput(
  itemType: string,
  output: Record<string, unknown>
): Promise<{ valid: boolean; errors: string[] }> {
  const rule = await getHandoffRule(itemType);
  if (!rule) {
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];

  // Check required fields
  const requiredFields = (rule.validation_rules as any)?.required_fields as string[] | undefined;
  if (requiredFields) {
    for (const field of requiredFields) {
      if (!(field in output) || output[field] === null || output[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Complete a work item and create child items for the next agent.
 * This is the main handoff function.
 */
export async function completeAndHandoff(
  workItemId: string,
  output: Record<string, unknown>,
  childItems: ChildItemSpec[] = []
): Promise<HandoffResult> {
  const logger = new ActivityLogger(workItemId);

  try {
    // Call the database function to complete and handoff
    const { data, error } = await agentClient.rpc('complete_work_item', {
      p_work_item_id: workItemId,
      p_agent_type: AGENT_TYPE,
      p_agent_instance_id: AGENT_INSTANCE_ID,
      p_output: output,
      p_child_items: childItems,
    });

    if (error) {
      await logger.logError('handed_off', error);
      return { success: false, error: error.message };
    }

    const result = data as HandoffResult;

    if (result.success) {
      console.log(`Completed item ${workItemId}, created ${result.childItems?.length || 0} child items`);
    } else {
      console.warn(`Handoff completed with validation errors:`, result.validationErrors);
    }

    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.logError('handed_off', err);
    return { success: false, error: err.message };
  }
}

/**
 * Escalate a work item to human operators.
 * Use when the agent cannot complete the work.
 */
export async function escalateToHuman(
  workItemId: string,
  reason: string
): Promise<boolean> {
  const logger = new ActivityLogger(workItemId);

  try {
    const { error } = await agentClient.rpc('escalate_to_human', {
      p_work_item_id: workItemId,
      p_agent_instance_id: AGENT_INSTANCE_ID,
      p_reason: reason,
    });

    if (error) {
      await logger.logError('escalated', error);
      console.error('Failed to escalate:', error);
      return false;
    }

    console.log(`Escalated item ${workItemId}: ${reason}`);
    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.logError('escalated', err);
    return false;
  }
}

/**
 * Add a comment to a work item (for documentation during processing).
 */
export async function addComment(
  workItemId: string,
  content: string,
  isSystemMessage: boolean = false
): Promise<boolean> {
  const { error } = await agentClient.from('comments').insert({
    work_item_id: workItemId,
    author_agent: AGENT_TYPE,
    content,
    is_system_message: isSystemMessage,
  });

  if (error) {
    console.error('Failed to add comment:', error);
    return false;
  }

  return true;
}

/**
 * Get comments on a work item.
 */
export async function getComments(
  workItemId: string
): Promise<Array<{ content: string; author_agent?: string; created_at: string }>> {
  const { data, error } = await agentClient
    .from('comments')
    .select('content, author_agent, created_at')
    .eq('work_item_id', workItemId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to get comments:', error);
    return [];
  }

  return data || [];
}

/**
 * Create child items without completing the parent.
 * Useful for partial handoffs or parallel processing.
 */
export async function createChildItems(
  parentItem: WorkItem,
  children: ChildItemSpec[]
): Promise<string[]> {
  const createdIds: string[] = [];

  for (const child of children) {
    const { data, error } = await agentClient
      .from('work_items')
      .insert({
        project_id: parentItem.project_id,
        parent_id: parentItem.id,
        title: child.title,
        description: child.description,
        type: child.type,
        status: 'ready',
        priority: parentItem.priority,
        metadata: {
          ...child.metadata,
          created_by_agent: AGENT_TYPE,
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create child item:', error);
      continue;
    }

    if (data) {
      createdIds.push(data.id);
    }
  }

  return createdIds;
}
