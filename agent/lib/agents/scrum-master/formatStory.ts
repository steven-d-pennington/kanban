/**
 * Story Formatter
 *
 * Converts story output to markdown format.
 */

import type { StoryOutput } from './types';

/**
 * Format a story as markdown.
 */
export function formatStory(story: StoryOutput): string {
  const sections: string[] = [];

  // Title
  sections.push(`## ${story.title}`);
  sections.push('');

  // Description
  sections.push('### Description');
  sections.push('');
  sections.push(story.description);
  sections.push('');

  // Acceptance Criteria
  sections.push('### Acceptance Criteria');
  sections.push('');
  story.acceptanceCriteria.forEach((ac, index) => {
    sections.push(`${index + 1}. ${ac}`);
  });
  sections.push('');

  // Technical Notes
  if (story.technicalNotes) {
    sections.push('### Technical Notes');
    sections.push('');
    sections.push(story.technicalNotes);
    sections.push('');
  }

  // Estimation
  sections.push('### Estimation');
  sections.push('');
  sections.push(`- **Story Points:** ${story.storyPoints}`);
  sections.push(`- **Priority:** ${story.priority}`);
  sections.push('');

  // Dependencies
  if (story.dependencies.length > 0) {
    sections.push('### Dependencies');
    sections.push('');
    story.dependencies.forEach(dep => {
      sections.push(`- ${dep}`);
    });
    sections.push('');
  }

  return sections.join('\n').trim();
}
