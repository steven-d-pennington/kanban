/**
 * Story Prioritization Utilities
 */

import type { StoryOutput, StoryPriority } from './types';

/**
 * Priority order mapping
 */
const PRIORITY_ORDER: Record<StoryPriority, number> = {
  'must-have': 0,
  'should-have': 1,
  'could-have': 2,
};

/**
 * Sort stories by priority and story points.
 */
export function prioritizeStories(stories: StoryOutput[]): StoryOutput[] {
  return [...stories].sort((a, b) => {
    // First by priority
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by story points (smaller first within same priority)
    return a.storyPoints - b.storyPoints;
  });
}

/**
 * Build a dependency graph from stories.
 */
export function buildDependencyGraph(stories: StoryOutput[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const story of stories) {
    graph.set(story.title, story.dependencies);
  }

  return graph;
}

/**
 * Get stories in dependency order (topological sort).
 */
export function getStoryOrder(stories: StoryOutput[]): StoryOutput[] {
  const visited = new Set<string>();
  const result: StoryOutput[] = [];
  const storyMap = new Map(stories.map(s => [s.title, s]));

  function visit(title: string): void {
    if (visited.has(title)) return;
    visited.add(title);

    const story = storyMap.get(title);
    if (!story) return;

    // Visit dependencies first
    for (const dep of story.dependencies) {
      if (storyMap.has(dep)) {
        visit(dep);
      }
    }

    result.push(story);
  }

  // Visit all stories
  for (const story of stories) {
    visit(story.title);
  }

  return result;
}

/**
 * Calculate total story points.
 */
export function calculateTotalPoints(stories: StoryOutput[]): number {
  return stories.reduce((sum, story) => sum + story.storyPoints, 0);
}

/**
 * Group stories by priority.
 */
export function groupByPriority(stories: StoryOutput[]): Record<StoryPriority, StoryOutput[]> {
  return {
    'must-have': stories.filter(s => s.priority === 'must-have'),
    'should-have': stories.filter(s => s.priority === 'should-have'),
    'could-have': stories.filter(s => s.priority === 'could-have'),
  };
}
