/**
 * Implementation Planner
 *
 * Uses AI to create detailed implementation plans from user stories.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { PlanInput, ImplementationPlan } from './types';

const SYSTEM_PROMPT = `You are a senior software engineer. Create detailed implementation plans.

Output JSON with this exact structure:
{
  "summary": "Brief overview of changes",
  "steps": [
    {
      "order": 1,
      "description": "What to do",
      "files": ["path/to/file.ts"],
      "action": "create|modify|delete",
      "details": "Specific implementation details including code snippets or pseudocode"
    }
  ],
  "tests": [
    {
      "file": "path/to/test.ts",
      "scenarios": ["test scenario descriptions"]
    }
  ],
  "risks": ["potential issues to watch for"],
  "dependencies": ["external packages if needed"]
}

Guidelines:
- Be specific about file paths based on the codebase structure
- Include both implementation steps and test steps
- Order steps logically (dependencies first)
- Include rollback considerations in risks
- Specify exact file actions (create, modify, delete)

Output ONLY valid JSON, no markdown or explanations.`;

/**
 * Creates implementation plans from work items.
 */
export class ImplementationPlanner {
  /**
   * Create an implementation plan for a work item.
   */
  async createPlan(input: PlanInput): Promise<ImplementationPlan> {
    const anthropic = new Anthropic();

    const hasComments = input.comments && input.comments.length > 0;

    let userPrompt = '';

    if (hasComments) {
      // MODE: FIX / REFINEMENT
      // Prioritize the comments as the "Task"
      userPrompt = `TASK: Resolve the reported feedback/errors for: ${input.item.title}

**PRIMARY INSTRUCTION (Read Carefully):**
The user has reported issues with the current implementation. 
Your GOAL is to FIX these specific issues.
DO NOT re-implement the entire feature. Assume the feature is mostly good, but needs specific fixes based on the feedback below.

**🔎 FEEDBACK / ERROR REPORT (The Task):**
${input.comments?.join('\n')}

**📄 REFERENCE CONTEXT (Original Story):**
(Use this only to understand the intended behavior. Do not treat this as a request to implement from scratch.)
${input.item.description}
Acceptance Criteria:
${input.acceptanceCriteria?.join('\n') || 'See description'}

**Codebase Context:**
Tech Stack: ${JSON.stringify(input.codebaseContext.techStack)}
Patterns: ${JSON.stringify(input.codebaseContext.patterns)}
    
**REPOSITORY STRUCTURE:**
${input.codebaseContext.repositoryStructure || 'Standard single-project repo'}

**Relevant Files:**
${input.codebaseContext.relevantFiles.map(f => `- ${f.path}: ${f.description || 'No description'}`).join('\n') || 'None specified'}

Create a plan to FIX the reported issues.`;
    } else {
      // MODE: NEW IMPLEMENTATION
      // Standard behavior
      userPrompt = `Create an implementation plan for:

**${input.item.type.toUpperCase()}:** ${input.item.title}

**Description:**
${input.item.description}

**Acceptance Criteria:**
${input.acceptanceCriteria?.join('\n') || 'See description'}

**Codebase Context:**
Tech Stack: ${JSON.stringify(input.codebaseContext.techStack)}
Patterns: ${JSON.stringify(input.codebaseContext.patterns)}
Conventions: ${JSON.stringify(input.codebaseContext.conventions)}
    
**REPOSITORY STRUCTURE:**
${input.codebaseContext.repositoryStructure || 'Standard single-project repo'}

**Relevant Files:**
${input.codebaseContext.relevantFiles.map(f => `- ${f.path}: ${f.description || 'No description'}`).join('\n') || 'None specified'}

Create a detailed, step-by-step implementation plan.`;
    }

    console.log(`[Planner] 🤔 Thinking... Generating plan for "${input.item.title}"`);
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
      // Clean up potential markdown formatting
      let jsonString = textContent.text.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```/, '').replace(/```$/, '');
      }

      const plan = JSON.parse(jsonString) as ImplementationPlan;
      console.log(`[Planner] 💡 Plan generated: ${plan.summary.substring(0, 100)}...`);
      return plan;
    } catch (error) {
      throw new Error(`Failed to parse implementation plan: ${error}`);
    }
  }
}
