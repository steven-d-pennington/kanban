# STORY-015: Scrum Master Agent

## Overview
Implement the Scrum Master Agent that breaks down PRDs into actionable user stories with acceptance criteria and story point estimates.

## Status
**Current**: COMPLETED
**Phase**: 4 - Agent Implementation
**Priority**: HIGH
**Estimated Effort**: Large

---

## User Story
As a development team member, I want PRDs automatically broken down into user stories so that I have clear, actionable tasks to work on.

---

## Acceptance Criteria

- [ ] Agent monitors `prd` items in `ready` status
- [ ] Agent claims available PRD items atomically
- [ ] Analyzes PRD content and acceptance criteria
- [ ] Generates user stories with:
  - Clear title (As a... I want... So that...)
  - Detailed description
  - Acceptance criteria
  - Story point estimate
  - Technical notes
  - Dependencies on other stories
- [ ] Creates multiple child `story` items
- [ ] Prioritizes stories (must have → nice to have)
- [ ] Moves parent PRD to `done` status
- [ ] Handles errors gracefully with escalation
- [ ] Logs all activities

---

## Technical Notes

### Agent Architecture
```typescript
// agents/scrum-master/index.ts
import { AgentBase } from '../shared/AgentBase'
import { generateStories } from './storyGenerator'

export class ScrumMasterAgent extends AgentBase {
  readonly agentType = 'scrum_master'

  protected getTargetTypes(): string[] {
    return ['prd']
  }

  async processItem(item: WorkItem): Promise<ProcessResult> {
    this.logger.log('processing', { title: item.title })

    try {
      // Extract PRD content
      const prdContent = this.extractPRDContent(item)

      // Generate stories using AI
      const stories = await generateStories({
        prd: prdContent,
        projectContext: await this.getProjectContext(item.project_id)
      })

      // Validate stories
      const validation = this.validateStories(stories)
      if (!validation.valid) {
        throw new Error(`Story validation failed: ${validation.errors.join(', ')}`)
      }

      // Complete and create child stories
      await this.completeWithHandoff(item, {
        output: { stories },
        childItems: stories.map((story, index) => ({
          type: 'story',
          title: story.title,
          description: this.formatStory(story),
          metadata: {
            story_points: story.storyPoints,
            priority_order: index,
            dependencies: story.dependencies,
            acceptance_criteria: story.acceptanceCriteria
          }
        }))
      })

      return { success: true, output: { storiesCreated: stories.length } }
    } catch (error) {
      await this.escalateToHuman(item, error.message)
      return { success: false, error }
    }
  }

  private extractPRDContent(item: WorkItem): PRDContent {
    // Parse PRD from description (markdown) or metadata
    return {
      summary: item.description,
      requirements: item.metadata?.output?.requirements ?? [],
      acceptanceCriteria: item.metadata?.output?.acceptanceCriteria ?? []
    }
  }

  private validateStories(stories: StoryOutput[]): ValidationResult {
    const errors: string[] = []
    if (stories.length === 0) errors.push('No stories generated')
    stories.forEach((story, i) => {
      if (!story.title) errors.push(`Story ${i + 1}: Missing title`)
      if (!story.acceptanceCriteria?.length) errors.push(`Story ${i + 1}: No acceptance criteria`)
      if (!story.storyPoints) errors.push(`Story ${i + 1}: No story points`)
    })
    return { valid: errors.length === 0, errors }
  }
}
```

### Story Generator
```typescript
// agents/scrum-master/storyGenerator.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function generateStories(input: StoryGenInput): Promise<StoryOutput[]> {
  const systemPrompt = `You are an experienced Scrum Master. Break down PRDs into user stories.

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

Output a JSON array of stories, ordered by priority (must-have first).`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Break down this PRD into user stories:

${input.prd.summary}

Requirements:
${JSON.stringify(input.prd.requirements, null, 2)}

Acceptance Criteria from PRD:
${JSON.stringify(input.prd.acceptanceCriteria, null, 2)}

Project Context:
${JSON.stringify(input.projectContext, null, 2)}

Generate comprehensive user stories that cover all requirements.`
    }]
  })

  return JSON.parse(response.content[0].text)
}
```

### Story Output Structure
```typescript
// agents/scrum-master/types.ts
export interface StoryOutput {
  title: string
  description: string
  acceptanceCriteria: string[]
  storyPoints: 1 | 2 | 3 | 5 | 8 | 13
  technicalNotes: string
  dependencies: string[]
  priority: 'must-have' | 'should-have' | 'could-have'
}

export interface StoryGenInput {
  prd: {
    summary: string
    requirements: any[]
    acceptanceCriteria: any[]
  }
  projectContext: ProjectContext
}
```

### Story Markdown Formatter
```typescript
// agents/scrum-master/formatStory.ts
export function formatStory(story: StoryOutput): string {
  return `
## ${story.title}

### Description
${story.description}

### Acceptance Criteria
${story.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

### Technical Notes
${story.technicalNotes}

### Estimation
- **Story Points:** ${story.storyPoints}
- **Priority:** ${story.priority}

${story.dependencies.length > 0 ? `### Dependencies
${story.dependencies.map(d => `- ${d}`).join('\n')}` : ''}
`.trim()
}
```

### Story Prioritization Logic
```typescript
// agents/scrum-master/prioritize.ts
export function prioritizeStories(stories: StoryOutput[]): StoryOutput[] {
  const priorityOrder = {
    'must-have': 0,
    'should-have': 1,
    'could-have': 2
  }

  return [...stories].sort((a, b) => {
    // First by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff

    // Then by story points (smaller first within same priority)
    return a.storyPoints - b.storyPoints
  })
}
```

### Dependency Graph
```typescript
// agents/scrum-master/dependencies.ts
export function buildDependencyGraph(stories: StoryOutput[]): Map<string, string[]> {
  const graph = new Map<string, string[]>()

  stories.forEach(story => {
    graph.set(story.title, story.dependencies)
  })

  return graph
}

export function getStoryOrder(stories: StoryOutput[]): StoryOutput[] {
  // Topological sort based on dependencies
  const visited = new Set<string>()
  const result: StoryOutput[] = []
  const storyMap = new Map(stories.map(s => [s.title, s]))

  function visit(title: string) {
    if (visited.has(title)) return
    visited.add(title)

    const story = storyMap.get(title)
    if (!story) return

    story.dependencies.forEach(dep => {
      if (storyMap.has(dep)) {
        visit(dep)
      }
    })

    result.push(story)
  }

  stories.forEach(s => visit(s.title))
  return result
}
```

---

## Environment Variables
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
AGENT_TYPE=scrum_master
AGENT_INSTANCE_ID=sm-001
ANTHROPIC_API_KEY=your-anthropic-key
AGENT_MODE=polling
```

---

## Related Stories
- Depends on: STORY-010, STORY-011, STORY-013, STORY-014
- Blocks: STORY-016 (Developer Agent needs stories)

---

## Notes
- Consider team velocity for story point calibration
- Support for sprint planning suggestions
- Add epic grouping for related stories
- Consider technical debt stories generation
