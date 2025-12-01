/**
 * Story Generator
 *
 * Uses AI to break down PRDs into actionable user stories.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { StoryGenInput, StoryOutput } from './types';

const SYSTEM_PROMPT = `You are an experienced Scrum Master. Break down PRDs into user stories.

Each story should follow this JSON structure:
{
  "title": "As a [user type], I want [feature] so that [benefit]",
  "description": "Detailed description of what needs to be built",
  "acceptanceCriteria": [
    "Given [context], when [action], then [outcome]"
  ],
  "storyPoints": 1|2|3|5|8|13,
  "technicalNotes": "Implementation guidance",
  "dependencies": ["story-id or description"],
  "priority": "must-have|should-have|could-have"
}

Story Point Guidelines:
- 1: Trivial change, < 1 hour
- 2: Simple change, 1-2 hours
- 3: Moderate complexity, half day
- 5: Complex feature, 1-2 days
- 8: Large feature, 3-5 days
- 13: Very large, consider breaking down

Guidelines:
- Follow the "As a... I want... So that..." format for titles
- Include 2-5 acceptance criteria per story
- Consider dependencies between stories
- Prioritize must-have items first
- Break down large items (13 points) into smaller stories if possible
- Include technical notes for implementation guidance

Output a JSON array of stories, ordered by priority (must-have first).
Output ONLY valid JSON, no markdown or explanations.`;

/**
 * Generate user stories from a PRD.
 */
export async function generateStories(input: StoryGenInput): Promise<StoryOutput[]> {
  const anthropic = new Anthropic();

  const userPrompt = `Break down this PRD into user stories:

Summary:
${input.prd.summary}

Requirements:
${JSON.stringify(input.prd.requirements, null, 2)}

Acceptance Criteria from PRD:
${JSON.stringify(input.prd.acceptanceCriteria, null, 2)}

Project Context:
- Project Name: ${input.projectContext.name}
${input.projectContext.description ? `- Description: ${input.projectContext.description}` : ''}
${input.projectContext.techStack ? `- Tech Stack: ${input.projectContext.techStack.join(', ')}` : ''}

Generate comprehensive user stories that cover all requirements. Order them by priority and consider dependencies.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: userPrompt,
    }],
  });

  // Extract text content
  const textContent = response.content.find(block => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  // Parse JSON response
  try {
    const stories = JSON.parse(textContent.text) as StoryOutput[];
    return stories;
  } catch (error) {
    throw new Error(`Failed to parse stories response: ${error}`);
  }
}
