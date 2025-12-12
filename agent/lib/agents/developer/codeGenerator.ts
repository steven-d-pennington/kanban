/**
 * Code Generator
 *
 * Uses AI to generate code based on implementation plans.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { PRCreator } from './prCreator';
import type {
  GenerateInput,
  CodeChanges,
  FileChange,
  FileGenInput,
  PlanStep,
  CodebaseContext,
} from './types';

// Simple glob matching support since we don't have minimatch
function matchPattern(path: string, pattern: string): boolean {
  // Normalize paths
  path = path.replace(/^\/+/, '');
  pattern = pattern.replace(/^\/+/, '');

  if (pattern === path) return true;

  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*\//g, '(.+/)?')
    .replace(/\*\*/g, '.+')
    .replace(/\*/g, '[^/]+');

  return new RegExp(`^${regexPattern}$`).test(path);
}

/**
 * Generates code changes based on implementation plans.
 */
export class CodeGenerator {
  private prCreator: PRCreator;

  constructor(prCreator: PRCreator) {
    this.prCreator = prCreator;
  }

  /**
   * Generate all code changes for the implementation plan.
   */
  async generate(input: GenerateInput): Promise<CodeChanges> {
    const changes: FileChange[] = [];

    // Process each step in the plan
    for (const step of input.plan.steps) {
      if (step.action === 'delete') {
        for (const filePath of step.files) {
          console.log(`[CodeGenerator] Deleting file: ${filePath}`);
          changes.push({ path: filePath, action: 'delete' });
        }
        continue;
      }


      // Generate content for each file in the step
      for (const rawPath of step.files) {
        const expandedPaths = await this.expandPath(rawPath, input.codebaseContext.branch);

        for (const filePath of expandedPaths) {
          if (step.action === 'modify') {
            console.log(`[CodeGenerator] Reading file: ${filePath}`);
          }

          const existingContent = step.action === 'modify'
            ? await this.readFile(filePath, input.codebaseContext.branch)
            : null;

          if (step.action === 'modify' && existingContent === null) {
            console.log(`[CodeGenerator] ℹ️ File '${filePath}' not found for modification. Creating it instead.`);
            // We continue, passing null existingContent to generateFileContent, effectively creating it.
          }

          if (step.action === 'create') {
            const exists = await this.prCreator.getFileContent(filePath, input.codebaseContext.branch);
            if (exists) {
              console.log(`[CodeGenerator] Note: File ${filePath} already exists, treating as modify`);
            } else {
              console.log(`[CodeGenerator] Generating new file: ${filePath}`);
            }
          } else {
            console.log(`[CodeGenerator] Generating modifications for: ${filePath}`);
          }

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
    }

    // Generate test files
    for (const test of input.plan.tests) {
      console.log(`[CodeGenerator] Generating test file: ${test.file}`);
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
   * Read existing file content using GitHub API.
   * Includes case-insensitive recovery logic.
   */
  private async readFile(filePath: string, branch: string = 'main'): Promise<string | null> {
    // Try exact match first
    let content = await this.prCreator.getFileContent(filePath, branch);

    if (content) return content;

    // If failed, try case-insensitive lookup
    console.log(`[CodeGenerator] Exact match failed for ${filePath}, trying case-insensitive search...`);
    try {
      const structure = await this.prCreator.getDirectoryStructure('', branch);
      const normalizedTarget = filePath.toLowerCase();

      const match = structure.find(item =>
        item.type === 'blob' && item.path.toLowerCase() === normalizedTarget
      );

      if (match) {
        console.log(`[CodeGenerator] Found case-insensitive match: ${match.path}`);
        return await this.prCreator.getFileContent(match.path, branch);
      }
    } catch (err) {
      console.warn('[CodeGenerator] Directory scan failed during recovery:', err);
    }

    console.warn(`[CodeGenerator] Warning: Could not read file ${filePath}`);
    return null;
  }

  /**
   * Expand glob patterns to real file paths.
   */
  private async expandPath(pattern: string, branch: string = 'main'): Promise<string[]> {
    // If no wildcards, return as is
    if (!pattern.includes('*')) {
      return [pattern];
    }

    // Fetch directory structure to find matches
    try {
      const rawStructure = await this.prCreator.getDirectoryStructure('', branch);
      const matches = rawStructure
        .filter(item => item.type === 'blob' && matchPattern(item.path, pattern))
        .map(item => item.path);

      if (matches.length === 0) {
        console.warn(`[CodeGenerator] No files matched pattern: ${pattern}`);
        return [];
      }

      return matches;
    } catch (error) {
      console.error(`[CodeGenerator] Failed to expand glob ${pattern}:`, error);
      return [pattern]; // Return original if failure
    }
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

    console.log(`[CodeGenerator] 🤔 Thinking... Generating code for ${input.filePath}`);
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

    let content = textContent.text.trim();
    if (content.startsWith('```')) {
      // Remove first line (```language)
      content = content.split('\n').slice(1).join('\n');
      // Remove last line (```)
      if (content.endsWith('```')) {
        content = content.replace(/```$/, '');
      }
    }
    return content.trim();
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

    console.log(`[CodeGenerator] 🤔 Thinking... Generating tests for ${testFile}`);
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

    let content = textContent.text.trim();
    if (content.startsWith('```')) {
      // Remove first line (```language)
      content = content.split('\n').slice(1).join('\n');
      // Remove last line (```)
      if (content.endsWith('```')) {
        content = content.replace(/```$/, '');
      }
    }
    return content.trim();
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
