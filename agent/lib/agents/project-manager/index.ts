/**
 * Project Manager Agent
 *
 * Processes project specifications and feature requests to generate
 * comprehensive Product Requirements Documents (PRDs).
 */

import { AgentBase } from '../../shared/AgentBase';
import type { ProcessResult, ValidationResult } from '../../shared/types';
import type { WorkItem } from '../../workItems';
import type { ChildItemSpec } from '../../handoff';
import { generatePRD } from './prdGenerator';
import { formatPRD } from './formatPRD';
import type { PRDOutput } from './types';

export class ProjectManagerAgent extends AgentBase {
  readonly agentType = 'project_manager';

  protected getTargetTypes(): string[] {
    return ['project_spec', 'feature'];
  }

  async processItem(item: WorkItem): Promise<ProcessResult> {
    console.log(`Processing ${item.type}: ${item.title}`);

    try {
      // Get project context
      const projectContext = await this.getProjectContext(item.project_id);

      // Log processing start
      await this.logger?.logProcessing({
        step: 'generating_prd',
        itemType: item.type,
      });

      // Generate PRD using AI
      const prd = await generatePRD({
        title: item.title,
        description: item.description,
        metadata: item.metadata,
        projectContext,
      });

      // Validate the generated PRD
      const validation = this.validatePRD(prd);
      if (!validation.valid) {
        throw new Error(`PRD validation failed: ${validation.errors.join(', ')}`);
      }

      // Format PRD as markdown
      const formattedPRD = formatPRD(prd);

      // Create child PRD item
      const childItems: ChildItemSpec[] = [{
        type: 'prd',
        title: `PRD: ${item.title}`,
        description: formattedPRD,
        metadata: {
          prd_output: prd,
          source_item_id: item.id,
          source_item_type: item.type,
        },
      }];

      // Complete and handoff
      await this.completeWithHandoff(item, {
        output: prd as unknown as Record<string, unknown>,
        childItems,
      });

      // Add summary comment
      await this.addComment(
        item,
        `Generated PRD with ${prd.requirements.functional.length} functional requirements and ${prd.acceptanceCriteria.length} acceptance criteria.`
      );

      return {
        success: true,
        output: {
          prd,
          childItemsCreated: 1,
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
   * Validate the generated PRD has required content.
   */
  private validatePRD(prd: PRDOutput): ValidationResult {
    const errors: string[] = [];

    if (!prd.summary || prd.summary.trim().length === 0) {
      errors.push('Missing summary');
    }

    if (!prd.requirements?.functional || prd.requirements.functional.length === 0) {
      errors.push('No functional requirements defined');
    }

    if (!prd.acceptanceCriteria || prd.acceptanceCriteria.length === 0) {
      errors.push('No acceptance criteria defined');
    }

    // Validate each functional requirement has required fields
    if (prd.requirements?.functional) {
      for (const req of prd.requirements.functional) {
        if (!req.id || !req.description || !req.priority) {
          errors.push(`Invalid functional requirement: ${JSON.stringify(req)}`);
        }
      }
    }

    // Validate each acceptance criterion has required fields
    if (prd.acceptanceCriteria) {
      for (const ac of prd.acceptanceCriteria) {
        if (!ac.id || !ac.scenario || !ac.given || !ac.when || !ac.then) {
          errors.push(`Invalid acceptance criterion: ${JSON.stringify(ac)}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export { generatePRD } from './prdGenerator';
export { formatPRD } from './formatPRD';
export type { PRDInput, PRDOutput } from './types';
