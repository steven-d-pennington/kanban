# STORY-016: Developer Agent Framework

## Overview
Implement the Developer Agent framework that can process user stories, bugs, and tasks to produce code implementations.

## Status
**Current**: COMPLETED
**Phase**: 4 - Agent Implementation
**Priority**: HIGH
**Estimated Effort**: Extra Large

---

## User Story
As a development team, I want an AI agent framework that can implement code changes based on user stories so that routine development tasks can be automated.

---

## Acceptance Criteria

- [ ] Agent monitors `story`, `bug`, `task` items in `ready` status
- [ ] Agent claims available items atomically
- [ ] Understands codebase context (file structure, patterns)
- [ ] Generates implementation plan before coding
- [ ] Produces code changes with:
  - New files or modifications
  - Tests for new functionality
  - Documentation updates
- [ ] Creates GitHub PR (or outputs diff)
- [ ] Moves item through `in_progress` → `review`
- [ ] Supports human review feedback loop
- [ ] Handles errors and escalates appropriately

---

## Technical Notes

### Agent Architecture
```typescript
// agents/developer/index.ts
import { AgentBase } from '../shared/AgentBase'
import { CodebaseAnalyzer } from './codebaseAnalyzer'
import { ImplementationPlanner } from './planner'
import { CodeGenerator } from './codeGenerator'
import { PRCreator } from './prCreator'

export class DeveloperAgent extends AgentBase {
  readonly agentType = 'developer'
  private analyzer: CodebaseAnalyzer
  private planner: ImplementationPlanner
  private generator: CodeGenerator
  private prCreator: PRCreator

  constructor() {
    super()
    this.analyzer = new CodebaseAnalyzer()
    this.planner = new ImplementationPlanner()
    this.generator = new CodeGenerator()
    this.prCreator = new PRCreator()
  }

  protected getTargetTypes(): string[] {
    return ['story', 'bug', 'task']
  }

  async processItem(item: WorkItem): Promise<ProcessResult> {
    this.logger.log('processing', { title: item.title, type: item.type })

    try {
      // Step 1: Analyze codebase
      const codebaseContext = await this.analyzer.analyze({
        projectId: item.project_id,
        relevantPaths: item.metadata?.relevant_paths
      })

      // Step 2: Create implementation plan
      const plan = await this.planner.createPlan({
        item,
        codebaseContext,
        acceptanceCriteria: item.metadata?.acceptance_criteria
      })

      // Log plan for visibility
      await this.updateItemStatus(item.id, 'in_progress', {
        implementation_plan: plan
      })

      // Step 3: Generate code
      const changes = await this.generator.generate({
        plan,
        codebaseContext
      })

      // Step 4: Create PR
      const pr = await this.prCreator.create({
        item,
        changes,
        plan
      })

      // Step 5: Move to review
      await this.updateItemStatus(item.id, 'review', {
        pr_url: pr.url,
        pr_number: pr.number,
        changes_summary: changes.summary
      })

      return {
        success: true,
        output: { pr_url: pr.url, files_changed: changes.files.length }
      }
    } catch (error) {
      await this.escalateToHuman(item, error.message)
      return { success: false, error }
    }
  }
}
```

### Codebase Analyzer
```typescript
// agents/developer/codebaseAnalyzer.ts
export class CodebaseAnalyzer {
  async analyze(options: AnalyzeOptions): Promise<CodebaseContext> {
    // Clone or access repo
    const repoPath = await this.getRepoPath(options.projectId)

    // Analyze structure
    const structure = await this.analyzeStructure(repoPath)

    // Find relevant files
    const relevantFiles = await this.findRelevantFiles(
      repoPath,
      options.relevantPaths
    )

    // Extract patterns
    const patterns = await this.extractPatterns(relevantFiles)

    return {
      structure,
      relevantFiles,
      patterns,
      techStack: this.detectTechStack(structure),
      conventions: this.detectConventions(relevantFiles)
    }
  }

  private async analyzeStructure(repoPath: string): Promise<DirectoryStructure> {
    // Build tree of directories and files
    return buildDirectoryTree(repoPath, {
      ignore: ['node_modules', '.git', 'dist', 'build']
    })
  }

  private async extractPatterns(files: FileInfo[]): Promise<CodePatterns> {
    // Analyze code patterns using AST or AI
    return {
      componentPattern: 'functional', // or 'class'
      stateManagement: 'zustand',
      stylingApproach: 'tailwind',
      testingFramework: 'vitest'
    }
  }
}
```

### Implementation Planner
```typescript
// agents/developer/planner.ts
import Anthropic from '@anthropic-ai/sdk'

export class ImplementationPlanner {
  async createPlan(input: PlanInput): Promise<ImplementationPlan> {
    const anthropic = new Anthropic()

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `You are a senior software engineer. Create detailed implementation plans.

Output JSON with this structure:
{
  "summary": "Brief overview of changes",
  "steps": [
    {
      "order": 1,
      "description": "What to do",
      "files": ["path/to/file.ts"],
      "action": "create|modify|delete",
      "details": "Specific implementation details"
    }
  ],
  "tests": [
    {
      "file": "path/to/test.ts",
      "scenarios": ["test scenario descriptions"]
    }
  ],
  "risks": ["potential issues"],
  "dependencies": ["external packages if needed"]
}`,
      messages: [{
        role: 'user',
        content: `Create an implementation plan for:

**${input.item.type.toUpperCase()}:** ${input.item.title}

**Description:**
${input.item.description}

**Acceptance Criteria:**
${input.acceptanceCriteria?.join('\n') ?? 'See description'}

**Codebase Context:**
Tech Stack: ${JSON.stringify(input.codebaseContext.techStack)}
Conventions: ${JSON.stringify(input.codebaseContext.conventions)}

**Relevant Files:**
${input.codebaseContext.relevantFiles.map(f => `- ${f.path}: ${f.description}`).join('\n')}`
      }]
    })

    return JSON.parse(response.content[0].text)
  }
}
```

### Code Generator
```typescript
// agents/developer/codeGenerator.ts
import Anthropic from '@anthropic-ai/sdk'

export class CodeGenerator {
  async generate(input: GenerateInput): Promise<CodeChanges> {
    const changes: FileChange[] = []

    for (const step of input.plan.steps) {
      if (step.action === 'delete') {
        changes.push({ path: step.files[0], action: 'delete' })
        continue
      }

      for (const filePath of step.files) {
        const existingContent = step.action === 'modify'
          ? await this.readFile(input.codebaseContext, filePath)
          : null

        const newContent = await this.generateFileContent({
          filePath,
          existingContent,
          step,
          context: input.codebaseContext
        })

        changes.push({
          path: filePath,
          action: step.action,
          content: newContent
        })
      }
    }

    // Generate tests
    for (const test of input.plan.tests) {
      const testContent = await this.generateTestContent({
        testFile: test.file,
        scenarios: test.scenarios,
        relatedChanges: changes,
        context: input.codebaseContext
      })

      changes.push({
        path: test.file,
        action: 'create',
        content: testContent
      })
    }

    return {
      files: changes,
      summary: this.summarizeChanges(changes)
    }
  }

  private async generateFileContent(input: FileGenInput): Promise<string> {
    const anthropic = new Anthropic()

    const prompt = input.existingContent
      ? `Modify this file:\n\`\`\`\n${input.existingContent}\n\`\`\`\n\nChanges needed: ${input.step.details}`
      : `Create a new file at ${input.filePath}.\n\nRequirements: ${input.step.details}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: `You are an expert coder. Output ONLY the file content, no markdown or explanations.
Follow these conventions:
${JSON.stringify(input.context.conventions)}`,
      messages: [{ role: 'user', content: prompt }]
    })

    return response.content[0].text
  }
}
```

### PR Creator
```typescript
// agents/developer/prCreator.ts
import { Octokit } from '@octokit/rest'

export class PRCreator {
  private octokit: Octokit

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    })
  }

  async create(input: PRInput): Promise<PRResult> {
    const { owner, repo } = this.parseRepoInfo(input.item.project_id)
    const branchName = this.generateBranchName(input.item)

    // Create branch
    const baseBranch = 'main'
    const baseRef = await this.octokit.git.getRef({
      owner, repo, ref: `heads/${baseBranch}`
    })

    await this.octokit.git.createRef({
      owner, repo,
      ref: `refs/heads/${branchName}`,
      sha: baseRef.data.object.sha
    })

    // Commit changes
    for (const change of input.changes.files) {
      if (change.action === 'delete') {
        await this.deleteFile(owner, repo, branchName, change.path)
      } else {
        await this.createOrUpdateFile(
          owner, repo, branchName, change.path, change.content
        )
      }
    }

    // Create PR
    const pr = await this.octokit.pulls.create({
      owner, repo,
      title: `${input.item.type}: ${input.item.title}`,
      head: branchName,
      base: baseBranch,
      body: this.generatePRBody(input)
    })

    return {
      url: pr.data.html_url,
      number: pr.data.number,
      branch: branchName
    }
  }

  private generatePRBody(input: PRInput): string {
    return `
## Summary
${input.plan.summary}

## Changes
${input.changes.summary}

## Related Item
- Type: ${input.item.type}
- Title: ${input.item.title}
- ID: ${input.item.id}

## Implementation Plan
${input.plan.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n')}

---
*This PR was automatically generated by Developer Agent*
    `.trim()
  }
}
```

---

## Environment Variables
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
AGENT_TYPE=developer
AGENT_INSTANCE_ID=dev-001
ANTHROPIC_API_KEY=your-anthropic-key
GITHUB_TOKEN=your-github-token
REPO_CLONE_PATH=/tmp/repos
AGENT_MODE=polling
```

---

## Related Stories
- Depends on: STORY-010, STORY-011, STORY-013, STORY-015
- Blocks: None

---

## Notes
- Start with simpler code generation before full PR automation
- Consider sandboxed execution for testing generated code
- Add code review feedback integration
- Support for multiple languages/frameworks
- Consider token limits for large files
