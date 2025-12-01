/**
 * PRD Generator
 *
 * Uses AI to generate Product Requirements Documents from
 * project specifications and feature requests.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { PRDInput, PRDOutput } from './types';

const SYSTEM_PROMPT = `You are a senior product manager. Generate comprehensive PRDs from feature specifications.

Output JSON with this exact structure:
{
  "summary": "Executive summary of the feature",
  "personas": [{ "name": "...", "description": "...", "needs": ["..."] }],
  "requirements": {
    "functional": [{ "id": "FR-1", "description": "...", "priority": "must|should|could" }],
    "nonFunctional": [{ "id": "NFR-1", "category": "...", "description": "..." }]
  },
  "acceptanceCriteria": [{ "id": "AC-1", "scenario": "...", "given": "...", "when": "...", "then": "..." }],
  "technicalConsiderations": ["..."],
  "dependencies": ["..."],
  "risks": [{ "description": "...", "likelihood": "low|medium|high", "impact": "low|medium|high", "mitigation": "..." }],
  "outOfScope": ["..."]
}

Guidelines:
- Be thorough but concise
- Prioritize requirements clearly (must > should > could)
- Include at least 3-5 acceptance criteria
- Consider security, performance, and accessibility in non-functional requirements
- Identify realistic risks and mitigations
- Clearly define what is out of scope

Output ONLY valid JSON, no markdown or explanations.`;

/**
 * Generate a PRD from the input specification.
 */
export async function generatePRD(input: PRDInput): Promise<PRDOutput> {
  const anthropic = new Anthropic();

  const userPrompt = `Generate a PRD for this feature:

Title: ${input.title}

Description:
${input.description}

Project Context:
- Project Name: ${input.projectContext.name}
${input.projectContext.description ? `- Description: ${input.projectContext.description}` : ''}
${input.projectContext.techStack ? `- Tech Stack: ${input.projectContext.techStack.join(', ')}` : ''}

${input.metadata ? `Additional metadata:\n${JSON.stringify(input.metadata, null, 2)}` : ''}

Generate a comprehensive PRD that covers all aspects of this feature.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
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
    const prd = JSON.parse(textContent.text) as PRDOutput;
    return prd;
  } catch (error) {
    throw new Error(`Failed to parse PRD response: ${error}`);
  }
}
