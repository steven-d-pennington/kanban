/**
 * Agent SDK for Kanban Board
 *
 * This SDK provides all the tools AI agents need to interact with the
 * Agent Kanban Board system, including:
 *
 * - Authentication and registration
 * - Work item claim/release operations
 * - Activity logging
 * - Handoff protocols
 *
 * Example usage:
 * ```typescript
 * import {
 *   registerAgent,
 *   claimNextItem,
 *   createLogger,
 *   completeAndHandoff,
 * } from '@agent-kanban/sdk';
 *
 * // Register on startup
 * await registerAgent('My Developer Agent');
 *
 * // Main processing loop
 * while (running) {
 *   const item = await claimNextItem();
 *   if (!item) {
 *     await sleep(5000);
 *     continue;
 *   }
 *
 *   const logger = createLogger(item.id);
 *   await logger.logStarted({ itemType: item.type });
 *
 *   try {
 *     const result = await processItem(item);
 *     await completeAndHandoff(item.id, result, []);
 *   } catch (error) {
 *     await logger.logError('processing', error);
 *     await escalateToHuman(item.id, error.message);
 *   }
 * }
 * ```
 */

// Supabase client and configuration
export {
  agentClient,
  AGENT_TYPE,
  AGENT_INSTANCE_ID,
  SUPABASE_URL,
  registerAgent,
  deactivateAgent,
  checkRateLimit,
  heartbeat,
  type AgentType,
} from './supabase';

// Work item operations
export {
  getProcessableTypes,
  findAvailableItems,
  claimItem,
  releaseItem,
  claimNextItem,
  getItem,
  getClaimedItems,
  updateItemMetadata,
  getChildItems,
  type WorkItem,
} from './workItems';

// Activity logging
export {
  ActivityLogger,
  createLogger,
  logActivity,
  type AgentAction,
  type ActivityStatus,
} from './activityLogger';

// Handoff protocols
export {
  getHandoffRule,
  validateOutput,
  completeAndHandoff,
  escalateToHuman,
  addComment,
  getComments,
  createChildItems,
  type ChildItemSpec,
  type HandoffResult,
  type HandoffRule,
} from './handoff';
