/**
 * Developer Agent
 *
 * Processes user stories, bugs, and tasks to produce code implementations.
 * Creates implementation plans, generates code, and optionally creates PRs.
 */

import { AgentBase } from '../../shared/AgentBase';
import type { ProcessResult, ValidationResult } from '../../shared/types';
import type { WorkItem } from '../../workItems';
import { CodebaseAnalyzer } from './codebaseAnalyzer';
import { ImplementationPlanner } from './planner';
import { CodeGenerator } from './codeGenerator';
import { PRCreator } from './prCreator';
import type { ImplementationPlan, CodeChanges } from './types';

export class DeveloperAgent extends AgentBase {
  readonly agentType = 'developer';

  private analyzer: CodebaseAnalyzer;
  private planner: ImplementationPlanner;
  private generator: CodeGenerator;
  private prCreator: PRCreator;

  constructor() {
    super();
    this.analyzer = new CodebaseAnalyzer();
    this.planner = new ImplementationPlanner();
    this.generator = new CodeGenerator();
    this.prCreator = new PRCreator();
  }

  protected getTargetTypes(): string[] {
    return ['story', 'bug', 'task'];
  }

  async processItem(item: WorkItem): Promise<ProcessResult> {
    console.log(`Processing ${item.type}: ${item.title}`);

    try {
      // Step 1: Analyze codebase
      await this.logger?.logProcessing({ step: 'analyzing_codebase' });

      const codebaseContext = await this.analyzer.analyze({
        projectId: item.project_id,
        relevantPaths: item.metadata?.relevant_paths as string[] | undefined,
      });

      // Step 2: Create implementation plan
      await this.logger?.logProcessing({ step: 'creating_plan' });

      const plan = await this.planner.createPlan({
        item: {
          id: item.id,
          type: item.type,
          title: item.title,
          description: item.description,
          metadata: item.metadata,
        },
        codebaseContext,
        acceptanceCriteria: item.metadata?.acceptance_criteria as string[] | undefined,
      });

      // Validate plan
      const planValidation = this.validatePlan(plan);
      if (!planValidation.valid) {
        throw new Error(`Plan validation failed: ${planValidation.errors.join(', ')}`);
      }

      // Update item with plan
      await this.updateMetadata(item, {
        implementation_plan: plan,
      });

      // Step 3: Generate code
      await this.logger?.logProcessing({ step: 'generating_code' });

      const changes = await this.generator.generate({
        plan,
        codebaseContext,
      });

      // Validate changes
      const changesValidation = this.validateChanges(changes);
      if (!changesValidation.valid) {
        throw new Error(`Changes validation failed: ${changesValidation.errors.join(', ')}`);
      }

      // Step 4: Create PR (if GitHub is configured)
      let prUrl: string | undefined;
      let prNumber: number | undefined;

      if (this.prCreator.isConfigured()) {
        await this.logger?.logProcessing({ step: 'creating_pr' });

        const pr = await this.prCreator.create({
          item: {
            id: item.id,
            type: item.type,
            title: item.title,
          },
          changes,
          plan,
        });

        prUrl = pr.url;
        prNumber = pr.number;
      }

      // Complete the item
      await this.completeWithHandoff(item, {
        output: {
          plan,
          changes_summary: changes.summary,
          files_changed: changes.files.length,
          pr_url: prUrl,
          pr_number: prNumber,
        },
      });

      // Add summary comment
      const commentParts = [
        `Implementation complete: ${changes.summary}`,
        `Plan: ${plan.steps.length} steps, ${plan.tests.length} test files`,
      ];
      if (prUrl) {
        commentParts.push(`PR: ${prUrl}`);
      }
      await this.addComment(item, commentParts.join('\n'));

      return {
        success: true,
        output: {
          plan,
          changes: changes.summary,
          filesChanged: changes.files.length,
          prUrl,
          prNumber,
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await this.escalateToHuman(item, err.message);
      return {
        success: false,
        error: err,
      };
    }
  }

  /**
   * Validate the implementation plan.
   */
  private validatePlan(plan: ImplementationPlan): ValidationResult {
    const errors: string[] = [];

    if (!plan.summary || plan.summary.trim().length === 0) {
      errors.push('Missing plan summary');
    }

    if (!plan.steps || plan.steps.length === 0) {
      errors.push('No implementation steps defined');
    }

    // Validate each step
    if (plan.steps) {
      for (const step of plan.steps) {
        if (!step.description) {
          errors.push(`Step ${step.order}: Missing description`);
        }
        if (!step.files || step.files.length === 0) {
          errors.push(`Step ${step.order}: No files specified`);
        }
        if (!['create', 'modify', 'delete'].includes(step.action)) {
          errors.push(`Step ${step.order}: Invalid action`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate the generated code changes.
   */
  private validateChanges(changes: CodeChanges): ValidationResult {
    const errors: string[] = [];

    if (!changes.files || changes.files.length === 0) {
      errors.push('No code changes generated');
    }

    // Check that non-delete changes have content
    for (const change of changes.files) {
      if (change.action !== 'delete' && !change.content) {
        errors.push(`File ${change.path}: Missing content for ${change.action} action`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export { CodebaseAnalyzer } from './codebaseAnalyzer';
export { ImplementationPlanner } from './planner';
export { CodeGenerator } from './codeGenerator';
export { PRCreator } from './prCreator';
export type {
  ImplementationPlan,
  CodeChanges,
  FileChange,
  PlanStep,
  CodebaseContext,
  PRResult,
} from './types';
