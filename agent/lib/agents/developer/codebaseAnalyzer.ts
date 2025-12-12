/**
 * Codebase Analyzer
 *
 * Analyzes a project's codebase to understand structure, patterns,
 * and conventions for informed code generation.
 */

import type { PRCreator } from './prCreator';
import type {
  AnalyzeOptions,
  CodebaseContext,
  DirectoryStructure,
  FileInfo,
  CodePatterns,
  TechStack,
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
 * Analyzes codebase structure and patterns.
 */
export class CodebaseAnalyzer {
  private prCreator: PRCreator;

  constructor(prCreator: PRCreator) {
    this.prCreator = prCreator;
  }

  /**
   * Analyze the codebase for the given project.
   */
  async analyze(options: AnalyzeOptions): Promise<CodebaseContext> {
    // Get repository info from project metadata
    const repoInfo = await this.getRepoInfo(options.projectId);

    // Build directory structure
    const structure = await this.buildDirectoryStructure(options.branch);

    // Find relevant files
    const relevantFiles = await this.getRelevantFiles(options.relevantPaths, options.branch);

    // Detect patterns and tech stack
    const patterns = this.detectPatterns();
    const techStack = this.detectTechStack();
    const conventions = this.detectConventions();

    return {
      structure,
      relevantFiles,
      patterns,
      techStack,
      conventions,
    };
  }

  /**
   * Get repository information from project.
   */
  private async getRepoInfo(projectId: string): Promise<{ path: string }> {
    // In a real implementation, this would fetch from project metadata
    // For now, return a default
    return {
      path: process.env.REPO_CLONE_PATH || '/tmp/repos',
    };
  }

  /**
   * Build directory structure.
   */
  private async buildDirectoryStructure(branch: string = 'main'): Promise<DirectoryStructure> {
    const rawStructure = await this.prCreator.getDirectoryStructure('', branch);

    // Transform flat list to tree (simplified for now)
    // For now we just return a simplified view
    return {
      name: 'root',
      type: 'directory',
      children: [
        { name: 'src', type: 'directory' },
        // We could expand this based on rawStructure if needed
      ],
    };
  }

  /**
   * Get relevant files for the implementation.
   */
  /**
   * Get relevant files for the implementation.
   * Expands glob patterns using the directory structure.
   */
  private async getRelevantFiles(paths: string[] | undefined, branch: string = 'main'): Promise<FileInfo[]> {
    if (!paths || paths.length === 0) {
      return [];
    }

    // Fetch structure first if needed (it might be cached/already fetched in analyze, 
    // but here we need the RAW list to expand globs, or search the tree)
    const rawStructure = await this.prCreator.getDirectoryStructure('', branch);
    // rawStructure is a flat list of { path: string, type: 'blob' | 'tree', ... }

    const files: FileInfo[] = [];
    const processedPaths = new Set<string>();

    for (const pattern of paths) {
      // Find all matching files in the repo
      const matches = rawStructure.filter(item =>
        item.type === 'blob' && matchPattern(item.path, pattern)
      );

      if (matches.length === 0) {
        console.warn(`[CodebaseAnalyzer] No files found matching pattern: ${pattern}`);
        continue;
      }

      for (const match of matches) {
        if (processedPaths.has(match.path)) continue;
        processedPaths.add(match.path);

        console.log(`[CodebaseAnalyzer] Found relevant file: ${match.path}`);
        files.push({
          path: match.path,
          description: `File at ${match.path}`,
          language: this.detectLanguage(match.path),
        });
      }
    }

    return files;
  }

  /**
   * Detect programming language from file extension.
   */
  private detectLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      ts: 'TypeScript',
      tsx: 'TypeScript React',
      js: 'JavaScript',
      jsx: 'JavaScript React',
      py: 'Python',
      go: 'Go',
      rs: 'Rust',
      java: 'Java',
      css: 'CSS',
      scss: 'SCSS',
      json: 'JSON',
      md: 'Markdown',
    };
    return languageMap[ext || ''] || 'Unknown';
  }

  /**
   * Detect code patterns in the codebase.
   */
  private detectPatterns(): CodePatterns {
    // In production, this would analyze actual code
    return {
      componentPattern: 'functional',
      stateManagement: 'zustand',
      stylingApproach: 'tailwind',
      testingFramework: 'vitest',
    };
  }

  /**
   * Detect technology stack.
   */
  private detectTechStack(): TechStack {
    // In production, this would analyze package.json and other config files
    return {
      languages: ['TypeScript', 'JavaScript'],
      frameworks: ['React', 'Tailwind CSS'],
      buildTools: ['Vite', 'ESBuild'],
      testTools: ['Vitest', 'Testing Library'],
    };
  }

  /**
   * Detect coding conventions.
   */
  private detectConventions(): Record<string, unknown> {
    return {
      indentation: 2,
      quotes: 'single',
      semicolons: true,
      trailingComma: 'es5',
      componentNaming: 'PascalCase',
      fileNaming: 'kebab-case',
      testNaming: '*.test.ts',
    };
  }
}
