/**
 * Code Generator
 *
 * Uses AI to generate code based on implementation plans.
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  GenerateInput,
  CodeChanges,
  FileChange,
  FileGenInput,
  PlanStep,
  CodebaseContext,
} from './types';

/**
 * Generates code changes based on implementation plans.
 */
export class CodeGenerator {
  /**
   * Generate all code changes for the implementation plan.
   */
  async generate(input: GenerateInput): Promise<CodeChanges> {
    const changes: FileChange[] = [];

    // Process each step in the plan
    for (const step of input.plan.steps) {
      if (step.action === 'delete') {
        for (const filePath of step.files) {
          changes.push({ path: filePath, action: 'delete' });
        }
        continue;
      }

      // Generate content for each file in the step
      for (const filePath of step.files) {
        const existingContent = step.action === 'modify'
          ? await this.readFile(input.codebaseContext, filePath)
          : null;

        const newContent = await this.generateFileContent({
          filePath,
          existingContent,
          step,
          context: input.codebaseContext,
        });

        changes.push({
          path: filePath,
          action: step.action,
          content: newContent,
        });
      }
    }

    // Generate test files
    for (const test of input.plan.tests) {
      const testContent = await this.generateTestContent(
        test.file,
        test.scenarios,
        changes,
        input.codebaseContext
      );

      changes.push({
        path: test.file,
        action: 'create',
        content: testContent,
      });
    }

    return {
      files: changes,
      summary: this.summarizeChanges(changes),
    };
  }

  /**
   * Read existing file content.
   * In production, this would read from the actual filesystem.
   */
  private async readFile(context: CodebaseContext, filePath: string): Promise<string | null> {
    // Placeholder - in production, read from filesystem
    return null;
  }

  /**
   * Generate content for a single file.
   */
  private async generateFileContent(input: FileGenInput): Promise<string> {
    const anthropic = new Anthropic();

    const systemPrompt = `You are an expert software engineer. Generate clean, production-ready code.
Follow these conventions:
${JSON.stringify(input.context.conventions, null, 2)}

Tech Stack: ${JSON.stringify(input.context.techStack)}
Patterns: ${JSON.stringify(input.context.patterns)}

Output ONLY the file content, no markdown code blocks or explanations.
Include appropriate imports, types, and documentation.`;

    const userPrompt = input.existingContent
      ? `Modify this existing file at ${input.filePath}:

\`\`\`
${input.existingContent}
\`\`\`

Changes needed:
${input.step.description}

Details:
${input.step.details}

Output the complete modified file content.`
      : `Create a new file at ${input.filePath}

Requirements:
${input.step.description}

Details:
${input.step.details}

Generate the complete file content.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt,
      }],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    return textContent.text;
  }

  /**
   * Generate test file content.
   */
  private async generateTestContent(
    testFile: string,
    scenarios: string[],
    relatedChanges: FileChange[],
    context: CodebaseContext
  ): Promise<string> {
    const anthropic = new Anthropic();

    const systemPrompt = `You are an expert test engineer. Generate comprehensive tests using ${context.patterns.testingFramework || 'Jest'}.

Follow these patterns:
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Include edge cases
- Mock external dependencies

Output ONLY the test file content, no markdown or explanations.`;

    const relatedFilesInfo = relatedChanges
      .filter(c => c.action !== 'delete')
      .map(c => `${c.path}:\n${c.content?.slice(0, 500)}...`)
      .join('\n\n');

    const userPrompt = `Generate tests for ${testFile}

Test scenarios to cover:
${scenarios.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Related implementation files:
${relatedFilesInfo}

Generate comprehensive test coverage for these scenarios.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt,
      }],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    return textContent.text;
  }

  /**
   * Summarize the changes made.
   */
  private summarizeChanges(changes: FileChange[]): string {
    const created = changes.filter(c => c.action === 'create').length;
    const modified = changes.filter(c => c.action === 'modify').length;
    const deleted = changes.filter(c => c.action === 'delete').length;

    const parts: string[] = [];
    if (created > 0) parts.push(`${created} file(s) created`);
    if (modified > 0) parts.push(`${modified} file(s) modified`);
    if (deleted > 0) parts.push(`${deleted} file(s) deleted`);

    return parts.join(', ') || 'No changes';
  }
}
