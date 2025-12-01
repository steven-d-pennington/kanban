/**
 * Shared Types for Agent Implementations
 */

import type { WorkItem } from '../workItems';

/**
 * Result of processing a work item
 */
export interface ProcessResult {
  success: boolean;
  output?: unknown;
  error?: Error;
}

/**
 * Configuration for polling mode
 */
export interface PollingConfig {
  /** Interval between polls in milliseconds */
  interval: number;
  /** Maximum concurrent items to process (default 1) */
  maxConcurrent?: number;
}

/**
 * Project context for AI generation
 */
export interface ProjectContext {
  id: string;
  name: string;
  description?: string;
  techStack?: string[];
  conventions?: Record<string, unknown>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Abstract interface for agent processors
 */
export interface AgentProcessor {
  /** The type of agent */
  readonly agentType: string;

  /** Start the agent in polling mode */
  startPolling(config: PollingConfig): Promise<void>;

  /** Stop the agent */
  stop(): Promise<void>;

  /** Process a single work item */
  processItem(item: WorkItem): Promise<ProcessResult>;
}
