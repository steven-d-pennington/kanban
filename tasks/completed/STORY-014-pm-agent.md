# STORY-014: Project Manager Agent

## Overview
Implement the Project Manager Agent that processes project specifications and feature requests to generate comprehensive Product Requirements Documents (PRDs).

## Status
**Current**: COMPLETED
**Phase**: 4 - Agent Implementation
**Priority**: HIGH
**Estimated Effort**: Large

---

## User Story
As a product owner, I want an AI agent to automatically analyze my feature requests and generate detailed PRDs so that development can proceed with clear requirements.

---

## Acceptance Criteria

- [ ] Agent monitors `project_spec` and `feature` items in `ready` status
- [ ] Agent claims available items atomically
- [ ] Analyzes input specification/feature description
- [ ] Generates structured PRD with:
  - Executive summary
  - User personas
  - Functional requirements
  - Non-functional requirements
  - Acceptance criteria
  - Technical considerations
  - Dependencies
  - Risk assessment
- [ ] Creates child `prd` work item with generated content
- [ ] Moves parent item to `done` status
- [ ] Handles errors gracefully with escalation
- [ ] Logs all activities

---

## Technical Notes

### Agent Architecture
```typescript
// agents/project-manager/index.ts
import { AgentBase } from '../shared/AgentBase'
import { generatePRD } from './prdGenerator'

export class ProjectManagerAgent extends AgentBase {
  readonly agentType = 'project_manager'

  protected getTargetTypes(): string[] {
    return ['project_spec', 'feature']
  }

  async processItem(item: WorkItem): Promise<ProcessResult> {
    this.logger.log('processing', { title: item.title })

    try {
      // Generate PRD using AI
      const prd = await generatePRD({
        title: item.title,
        description: item.description,
        metadata: item.metadata,
        projectContext: await this.getProjectContext(item.project_id)
      })

      // Validate output
      const validation = this.validatePRD(prd)
      if (!validation.valid) {
        throw new Error(`PRD validation failed: ${validation.errors.join(', ')}`)
      }

      // Complete and handoff
      await this.completeWithHandoff(item, {
        output: prd,
        childItems: [{
          type: 'prd',
          title: `PRD: ${item.title}`,
          description: this.formatPRD(prd)
        }]
      })

      return { success: true, output: prd }
    } catch (error) {
      await this.escalateToHuman(item, error.message)
      return { success: false, error }
    }
  }

  private validatePRD(prd: PRDOutput): ValidationResult {
    const errors: string[] = []
    if (!prd.summary) errors.push('Missing summary')
    if (!prd.requirements?.length) errors.push('No requirements defined')
    if (!prd.acceptanceCriteria?.length) errors.push('No acceptance criteria')
    return { valid: errors.length === 0, errors }
  }
}
```

### PRD Generator
```typescript
// agents/project-manager/prdGenerator.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function generatePRD(input: PRDInput): Promise<PRDOutput> {
  const systemPrompt = `You are a senior product manager. Generate comprehensive PRDs from feature specifications.

Output JSON with this structure:
{
  "summary": "Executive summary of the feature",
  "personas": [{ "name": "...", "description": "...", "needs": [...] }],
  "requirements": {
    "functional": [{ "id": "FR-1", "description": "...", "priority": "must|should|could" }],
    "nonFunctional": [{ "id": "NFR-1", "category": "...", "description": "..." }]
  },
  "acceptanceCriteria": [{ "id": "AC-1", "scenario": "...", "given": "...", "when": "...", "then": "..." }],
  "technicalConsiderations": [...],
  "dependencies": [...],
  "risks": [{ "description": "...", "likelihood": "...", "impact": "...", "mitigation": "..." }],
  "outOfScope": [...]
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Generate a PRD for this feature:

Title: ${input.title}

Description:
${input.description}

Project Context:
${JSON.stringify(input.projectContext, null, 2)}

Additional metadata:
${JSON.stringify(input.metadata, null, 2)}`
    }]
  })

  // Parse and return structured PRD
  return JSON.parse(response.content[0].text)
}
```

### PRD Output Structure
```typescript
// agents/project-manager/types.ts
export interface PRDOutput {
  summary: string
  personas: Array<{
    name: string
    description: string
    needs: string[]
  }>
  requirements: {
    functional: Array<{
      id: string
      description: string
      priority: 'must' | 'should' | 'could'
    }>
    nonFunctional: Array<{
      id: string
      category: string
      description: string
    }>
  }
  acceptanceCriteria: Array<{
    id: string
    scenario: string
    given: string
    when: string
    then: string
  }>
  technicalConsiderations: string[]
  dependencies: string[]
  risks: Array<{
    description: string
    likelihood: string
    impact: string
    mitigation: string
  }>
  outOfScope: string[]
}
```

### PRD Markdown Formatter
```typescript
// agents/project-manager/formatPRD.ts
export function formatPRD(prd: PRDOutput): string {
  return `
# Product Requirements Document

## Executive Summary
${prd.summary}

## User Personas
${prd.personas.map(p => `
### ${p.name}
${p.description}

**Needs:**
${p.needs.map(n => `- ${n}`).join('\n')}
`).join('\n')}

## Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
${prd.requirements.functional.map(r => `| ${r.id} | ${r.description} | ${r.priority} |`).join('\n')}

## Non-Functional Requirements
| ID | Category | Requirement |
|----|----------|-------------|
${prd.requirements.nonFunctional.map(r => `| ${r.id} | ${r.category} | ${r.description} |`).join('\n')}

## Acceptance Criteria
${prd.acceptanceCriteria.map(ac => `
### ${ac.id}: ${ac.scenario}
- **Given** ${ac.given}
- **When** ${ac.when}
- **Then** ${ac.then}
`).join('\n')}

## Technical Considerations
${prd.technicalConsiderations.map(t => `- ${t}`).join('\n')}

## Dependencies
${prd.dependencies.map(d => `- ${d}`).join('\n')}

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
${prd.risks.map(r => `| ${r.description} | ${r.likelihood} | ${r.impact} | ${r.mitigation} |`).join('\n')}

## Out of Scope
${prd.outOfScope.map(o => `- ${o}`).join('\n')}
`.trim()
}
```

### Agent Runner
```typescript
// agents/project-manager/run.ts
import { ProjectManagerAgent } from './index'

async function main() {
  const agent = new ProjectManagerAgent()

  console.log('Project Manager Agent starting...')

  // Run in polling mode or webhook mode
  if (process.env.AGENT_MODE === 'webhook') {
    // Wait for webhook triggers
    await agent.startWebhookServer(process.env.PORT || 3001)
  } else {
    // Poll for available items
    await agent.startPolling({
      interval: 30000, // 30 seconds
      maxConcurrent: 1
    })
  }
}

main().catch(console.error)
```

---

## Environment Variables
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
AGENT_TYPE=project_manager
AGENT_INSTANCE_ID=pm-001
ANTHROPIC_API_KEY=your-anthropic-key
AGENT_MODE=polling
```

---

## Related Stories
- Depends on: STORY-010, STORY-011, STORY-013
- Blocks: STORY-015 (SM Agent needs PRDs)

---

## Notes
- Consider adding caching for repeated similar requests
- Implement retry logic for AI API failures
- Add rate limiting to avoid API quota issues
- Support for multiple AI providers (fallback)
