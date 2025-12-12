/**
 * Types for Developer Agent
 */

/**
 * Codebase analysis options
 */
export interface AnalyzeOptions {
  projectId: string;
  relevantPaths?: string[];
  branch?: string;
}

/**
 * File information from codebase analysis
 */
export interface FileInfo {
  path: string;
  description?: string;
  language?: string;
  size?: number;
}

/**
 * Directory tree structure
 */
export interface DirectoryStructure {
  name: string;
  type: 'file' | 'directory';
  children?: DirectoryStructure[];
}

/**
 * Detected code patterns
 */
export interface CodePatterns {
  componentPattern?: string;
  stateManagement?: string;
  stylingApproach?: string;
  testingFramework?: string;
  [key: string]: string | undefined;
}

/**
 * Technology stack detection
 */
export interface TechStack {
  languages: string[];
  frameworks: string[];
  buildTools: string[];
  testTools: string[];
}

/**
 * Codebase context for AI generation
 */
export interface CodebaseContext {
  structure: DirectoryStructure;
  repositoryStructure: string; // High-level structure (e.g., "frontend/ package.json found")
  relevantFiles: FileInfo[];
  patterns: CodePatterns;
  techStack: TechStack;
  conventions: Record<string, unknown>;
  branch?: string;
}

/**
 * Implementation plan step
 */
export interface PlanStep {
  order: number;
  description: string;
  files: string[];
  action: 'create' | 'modify' | 'delete';
  details: string;
}

/**
 * Test specification
 */
export interface TestSpec {
  file: string;
  scenarios: string[];
}

/**
 * Complete implementation plan
 */
export interface ImplementationPlan {
  summary: string;
  steps: PlanStep[];
  tests: TestSpec[];
  risks: string[];
  dependencies: string[];
}

/**
 * Input for plan generation
 */
export interface PlanInput {
  item: {
    id: string;
    type: string;
    title: string;
    description: string;
    metadata?: Record<string, unknown>;
  };
  codebaseContext: CodebaseContext;
  acceptanceCriteria?: string[];
  comments?: string[]; // Recent feedback/context
}

/**
 * File change specification
 */
export interface FileChange {
  path: string;
  action: 'create' | 'modify' | 'delete';
  content?: string;
  diff?: string;
}

/**
 * Code generation result
 */
export interface CodeChanges {
  files: FileChange[];
  summary: string;
}

/**
 * Input for code generation
 */
export interface GenerateInput {
  plan: ImplementationPlan;
  codebaseContext: CodebaseContext;
}

/**
 * Input for file content generation
 */
export interface FileGenInput {
  filePath: string;
  existingContent: string | null;
  step: PlanStep;
  context: CodebaseContext;
}

/**
 * Pull request result
 */
export interface PRResult {
  url: string;
  number: number;
  branch: string;
}

/**
 * Input for PR creation
 */
export interface PRInput {
  item: {
    id: string;
    type: string;
    title: string;
  };
  changes: CodeChanges;
  plan: ImplementationPlan;
}
