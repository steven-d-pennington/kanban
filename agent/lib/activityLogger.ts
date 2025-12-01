/**
 * Activity Logger for Agents
 *
 * This module provides a structured way for agents to log their activities
 * for monitoring, debugging, and audit purposes.
 */

import { agentClient, AGENT_TYPE, AGENT_INSTANCE_ID } from './supabase';

export type AgentAction =
  | 'claimed'
  | 'processing'
  | 'completed'
  | 'handed_off'
  | 'failed'
  | 'released'
  | 'escalated'
  | 'retrying'
  | 'waiting'
  | 'started'
  | 'paused'
  | 'resumed';

export type ActivityStatus = 'success' | 'error' | 'warning';

interface LogOptions {
  status?: ActivityStatus;
  error?: Error;
  input?: unknown;
  output?: unknown;
  durationMs?: number;
}

/**
 * Activity logger for tracking agent operations on a work item.
 */
export class ActivityLogger {
  private workItemId: string;
  private startTime: number;

  constructor(workItemId: string) {
    this.workItemId = workItemId;
    this.startTime = Date.now();
  }

  /**
   * Log an activity for the current work item.
   */
  async log(
    action: AgentAction,
    details: Record<string, unknown> = {},
    options: LogOptions = {}
  ): Promise<string | null> {
    const duration = Date.now() - this.startTime;

    const { data, error } = await agentClient.rpc('log_agent_activity', {
      p_work_item_id: this.workItemId,
      p_agent_type: AGENT_TYPE,
      p_agent_instance_id: AGENT_INSTANCE_ID,
      p_action: action,
      p_details: details,
      p_status: options.status ?? 'success',
      p_duration_ms: options.durationMs ?? duration,
      p_error_message: options.error?.message ?? null,
      p_input_data: options.input ? JSON.stringify(options.input) : null,
      p_output_data: options.output ? JSON.stringify(options.output) : null,
    });

    if (error) {
      console.error('Failed to log activity:', error);
      return null;
    }

    return data;
  }

  /**
   * Log a successful action.
   */
  async logSuccess(
    action: AgentAction,
    details: Record<string, unknown> = {},
    output?: unknown
  ): Promise<string | null> {
    return this.log(action, details, { status: 'success', output });
  }

  /**
   * Log an error.
   */
  async logError(
    action: AgentAction,
    error: Error,
    details: Record<string, unknown> = {}
  ): Promise<string | null> {
    return this.log(action, details, { status: 'error', error });
  }

  /**
   * Log a warning.
   */
  async logWarning(
    action: AgentAction,
    details: Record<string, unknown> = {}
  ): Promise<string | null> {
    return this.log(action, details, { status: 'warning' });
  }

  /**
   * Log the start of processing.
   */
  async logStarted(details: Record<string, unknown> = {}): Promise<string | null> {
    return this.log('started', details);
  }

  /**
   * Log processing progress.
   */
  async logProcessing(details: Record<string, unknown> = {}): Promise<string | null> {
    return this.log('processing', details);
  }

  /**
   * Log completion.
   */
  async logCompleted(output?: unknown, details: Record<string, unknown> = {}): Promise<string | null> {
    return this.log('completed', details, { status: 'success', output });
  }

  /**
   * Log a retry attempt.
   */
  async logRetry(attempt: number, reason: string): Promise<string | null> {
    return this.log('retrying', { attempt, reason }, { status: 'warning' });
  }

  /**
   * Reset the timer (useful for tracking individual steps).
   */
  resetTimer(): void {
    this.startTime = Date.now();
  }

  /**
   * Get elapsed time in milliseconds.
   */
  getElapsedMs(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Create a new activity logger for a work item.
 */
export function createLogger(workItemId: string): ActivityLogger {
  return new ActivityLogger(workItemId);
}

/**
 * Log a standalone activity (not tied to a specific logger instance).
 */
export async function logActivity(
  workItemId: string,
  action: AgentAction,
  details: Record<string, unknown> = {},
  options: LogOptions = {}
): Promise<string | null> {
  const logger = new ActivityLogger(workItemId);
  return logger.log(action, details, options);
}
