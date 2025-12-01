/**
 * Types for Scrum Master Agent
 */

/**
 * Input for story generation
 */
export interface StoryGenInput {
  prd: {
    summary: string;
    requirements: unknown[];
    acceptanceCriteria: unknown[];
  };
  projectContext: {
    id: string;
    name: string;
    description?: string;
    techStack?: string[];
    conventions?: Record<string, unknown>;
  };
}

/**
 * Story point values (Fibonacci-like)
 */
export type StoryPoints = 1 | 2 | 3 | 5 | 8 | 13;

/**
 * Story priority levels
 */
export type StoryPriority = 'must-have' | 'should-have' | 'could-have';

/**
 * Generated user story
 */
export interface StoryOutput {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints: StoryPoints;
  technicalNotes: string;
  dependencies: string[];
  priority: StoryPriority;
}

/**
 * PRD content extracted from work item
 */
export interface PRDContent {
  summary: string;
  requirements: unknown[];
  acceptanceCriteria: unknown[];
}
