/**
 * Base Agent Class
 *
 * Provides common functionality for all agent types including:
 * - Polling for work items
 * - Graceful shutdown
 * - Error handling
 * - Activity logging
 */

import {
  registerAgent,
  deactivateAgent,
  heartbeat,
  AGENT_TYPE,
  AGENT_INSTANCE_ID,
  agentClient,
} from '../supabase';
import {
  claimNextItem,
  releaseItem,
  updateItemMetadata,
  type WorkItem,
} from '../workItems';
import {
  ActivityLogger,
  createLogger,
} from '../activityLogger';
import {
  completeAndHandoff,
  escalateToHuman,
  addComment,
  type ChildItemSpec,
} from '../handoff';
import type {
  ProcessResult,
  PollingConfig,
  ProjectContext,
  AgentProcessor,
} from './types';

export abstract class AgentBase implements AgentProcessor {
  abstract readonly agentType: string;

  protected running = false;
  protected currentItem: WorkItem | null = null;
  protected logger: ActivityLogger | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Get the work item types this agent processes.
   * Override in subclasses.
   */
  protected abstract getTargetTypes(): string[];

  /**
   * Process a single work item.
   * Must be implemented by subclasses.
   */
  abstract processItem(item: WorkItem): Promise<ProcessResult>;

  /**
   * Start the agent in polling mode.
   */
  async startPolling(config: PollingConfig): Promise<void> {
    // Register agent
    const registered = await registerAgent(`${this.agentType} Agent`);
    if (!registered) {
      throw new Error('Failed to register agent');
    }

    this.running = true;
    console.log(`${this.agentType} agent started in polling mode`);
    console.log(`Poll interval: ${config.interval}ms`);
    console.log(`Target types: ${this.getTargetTypes().join(', ')}`);

    // Start heartbeat
    this.heartbeatInterval = setInterval(async () => {
      await heartbeat();
    }, 30000);

    // Main polling loop
    while (this.running) {
      try {
        await this.pollOnce();
      } catch (error) {
        console.error('Polling error:', error);
      }

      // Wait before next poll
      await this.sleep(config.interval);
    }
  }

  /**
   * Poll for and process one item.
   */
  private async pollOnce(): Promise<void> {
    const item = await claimNextItem();
    if (!item) {
      return;
    }

    this.currentItem = item;
    this.logger = createLogger(item.id);

    try {
      await this.logger.logStarted({
        itemType: item.type,
        title: item.title,
      });

      const result = await this.processItem(item);

      if (result.success) {
        await this.logger.logCompleted(result.output);
      } else if (result.error) {
        await this.logger.logError('processing', result.error);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await this.logger?.logError('processing', err);
      await this.handleProcessingError(item, err);
    } finally {
      this.currentItem = null;
      this.logger = null;
    }
  }

  /**
   * Stop the agent gracefully.
   */
  async stop(): Promise<void> {
    console.log('Stopping agent...');
    this.running = false;

    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Release current item if any
    if (this.currentItem) {
      await releaseItem(this.currentItem.id, 'Agent shutting down');
    }

    // Deactivate agent
    await deactivateAgent();
    console.log('Agent stopped');
  }

  /**
   * Handle processing errors with optional escalation.
   */
  protected async handleProcessingError(item: WorkItem, error: Error): Promise<void> {
    console.error(`Error processing ${item.id}:`, error);
    await escalateToHuman(item.id, error.message);
  }

  /**
   * Complete processing and hand off to next agent.
   */
  protected async completeWithHandoff(
    item: WorkItem,
    options: {
      output: Record<string, unknown>;
      childItems?: ChildItemSpec[];
      targetStatus?: string;
    }
  ): Promise<void> {
    await completeAndHandoff(
      item.id,
      options.output,
      options.childItems || [],
      { targetStatus: options.targetStatus }
    );
  }

  /**
   * Escalate to human operators.
   */
  protected async escalateToHuman(item: WorkItem, reason: string): Promise<void> {
    await escalateToHuman(item.id, reason);
  }

  /**
   * Add a comment to the work item.
   */
  protected async addComment(item: WorkItem, content: string): Promise<void> {
    await addComment(item.id, content);
  }

  /**
   * Update item metadata during processing.
   */
  protected async updateMetadata(
    item: WorkItem,
    metadata: Record<string, unknown>
  ): Promise<void> {
    await updateItemMetadata(item.id, metadata);
  }

  /**
   * Get project context for AI generation.
   */
  protected async getProjectContext(projectId: string): Promise<ProjectContext> {
    const { data, error } = await agentClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error || !data) {
      return {
        id: projectId,
        name: 'Unknown Project',
      };
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      techStack: data.metadata?.tech_stack,
      conventions: data.metadata?.conventions,
    };
  }

  /**
   * Sleep for a given duration.
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Setup graceful shutdown handlers.
   */
  setupShutdownHandlers(): void {
    const shutdown = async () => {
      await this.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}
