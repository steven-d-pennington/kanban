/**
 * Scrum Master Agent
 *
 * Processes PRDs to generate actionable user stories with
 * acceptance criteria and story point estimates.
 */

import { AgentBase } from '../../shared/AgentBase';
import type { ProcessResult, ValidationResult } from '../../shared/types';
import type { WorkItem } from '../../workItems';
import type { ChildItemSpec } from '../../handoff';
import { generateStories } from './storyGenerator';
import { formatStory } from './formatStory';
import { prioritizeStories, calculateTotalPoints, groupByPriority } from './prioritize';
import type { StoryOutput, PRDContent } from './types';

export class ScrumMasterAgent extends AgentBase {
  readonly agentType = 'scrum_master';

  protected getTargetTypes(): string[] {
    return ['prd'];
  }

  async processItem(item: WorkItem): Promise<ProcessResult> {
    console.log(`Processing PRD: ${item.title}`);

    try {
      // Get project context
      const projectContext = await this.getProjectContext(item.project_id);

      // Extract PRD content
      const prdContent = this.extractPRDContent(item);

      // Log processing start
      await this.logger?.logProcessing({
        step: 'generating_stories',
        prdSummaryLength: prdContent.summary.length,
      });

      // Generate stories using AI
      let stories = await generateStories({
        prd: prdContent,
        projectContext,
      });

      // Validate stories
      const validation = this.validateStories(stories);
      if (!validation.valid) {
        throw new Error(`Story validation failed: ${validation.errors.join(', ')}`);
      }

      // Prioritize stories
      stories = prioritizeStories(stories);

      // Create child story items
      const childItems: ChildItemSpec[] = stories.map((story, index) => ({
        type: 'story',
        title: story.title,
        description: formatStory(story),
        metadata: {
          story_points: story.storyPoints,
          priority_order: index,
          priority: story.priority,
          dependencies: story.dependencies,
          acceptance_criteria: story.acceptanceCriteria,
          technical_notes: story.technicalNotes,
          source_prd_id: item.id,
        },
      }));

      // Complete and handoff
      await this.completeWithHandoff(item, {
        output: { stories },
        childItems,
      });

      // Calculate summary stats
      const totalPoints = calculateTotalPoints(stories);
      const byPriority = groupByPriority(stories);

      // Add summary comment
      await this.addComment(
        item,
        `Generated ${stories.length} user stories totaling ${totalPoints} story points.\n` +
        `- Must-have: ${byPriority['must-have'].length} stories\n` +
        `- Should-have: ${byPriority['should-have'].length} stories\n` +
        `- Could-have: ${byPriority['could-have'].length} stories`
      );

      return {
        success: true,
        output: {
          storiesCreated: stories.length,
          totalPoints,
          byPriority: {
            'must-have': byPriority['must-have'].length,
            'should-have': byPriority['should-have'].length,
            'could-have': byPriority['could-have'].length,
          },
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
   * Extract PRD content from work item.
   */
  private extractPRDContent(item: WorkItem): PRDContent {
    // Try to get structured PRD from metadata first
    const prdOutput = item.metadata?.prd_output as Record<string, unknown> | undefined;

    if (prdOutput) {
      return {
        summary: prdOutput.summary as string || item.description,
        requirements: [
          ...(prdOutput.requirements as { functional?: unknown[]; nonFunctional?: unknown[] })?.functional || [],
          ...(prdOutput.requirements as { functional?: unknown[]; nonFunctional?: unknown[] })?.nonFunctional || [],
        ],
        acceptanceCriteria: prdOutput.acceptanceCriteria as unknown[] || [],
      };
    }

    // Fall back to parsing from description
    return {
      summary: item.description,
      requirements: [],
      acceptanceCriteria: [],
    };
  }

  /**
   * Validate generated stories.
   */
  private validateStories(stories: StoryOutput[]): ValidationResult {
    const errors: string[] = [];

    if (stories.length === 0) {
      errors.push('No stories generated');
      return { valid: false, errors };
    }

    stories.forEach((story, index) => {
      if (!story.title || story.title.trim().length === 0) {
        errors.push(`Story ${index + 1}: Missing title`);
      }

      if (!story.acceptanceCriteria || story.acceptanceCriteria.length === 0) {
        errors.push(`Story ${index + 1}: No acceptance criteria`);
      }

      if (!story.storyPoints || ![1, 2, 3, 5, 8, 13].includes(story.storyPoints)) {
        errors.push(`Story ${index + 1}: Invalid story points`);
      }

      if (!story.priority || !['must-have', 'should-have', 'could-have'].includes(story.priority)) {
        errors.push(`Story ${index + 1}: Invalid priority`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export { generateStories } from './storyGenerator';
export { formatStory } from './formatStory';
export { prioritizeStories, calculateTotalPoints, groupByPriority } from './prioritize';
export type { StoryOutput, StoryGenInput, PRDContent, StoryPriority, StoryPoints } from './types';
