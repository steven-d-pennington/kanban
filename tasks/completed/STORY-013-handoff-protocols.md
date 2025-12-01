# STORY-013: Handoff Protocols

## Overview
Implement structured handoff mechanisms for agents to pass work items between different agent types and to human operators.

## Status
**Current**: COMPLETED
**Phase**: 3 - Agent Integration
**Priority**: HIGH
**Estimated Effort**: Medium
**Completed**: December 1, 2024

---

## User Story
As an AI agent, I want to hand off completed work to the next agent in the pipeline so that work flows smoothly through the system.

---

## Acceptance Criteria

- [x] Agent-to-agent handoff with output data
- [x] Create child items during handoff
- [x] Handoff validation (ensure output meets requirements)
- [x] Handoff notifications to receiving agents
- [x] Human escalation path for failures
- [x] Handoff history tracking
- [x] Rollback capability for failed handoffs
- [x] Configurable handoff rules per item type

## Implementation Summary

**Database Changes** (`supabase/migrations/002_agent_integration.sql`):
- Created `handoff_rules` table with default rules for each work item type
- Created `handoff_history` table for tracking all handoffs
- Added `complete_work_item()` function for atomic handoff with child item creation
- Added `escalate_to_human()` function for human escalation path
- Validation rules support with required field checking

**Default Handoff Rules**:
- `project_spec` -> PM Agent -> creates PRD
- `feature` -> PM Agent -> creates PRD
- `prd` -> SM Agent -> creates stories
- `story` -> Developer Agent -> implementation
- `bug` -> Developer Agent -> fix
- `task` -> Developer Agent -> completion

**Agent SDK** (`agent/lib/handoff.ts`):
- `getHandoffRule()`: Get rules for item type
- `validateOutput()`: Validate output against rules
- `completeAndHandoff()`: Complete item and create children
- `escalateToHuman()`: Escalate to human operators
- `addComment()` and `getComments()`: Documentation support
- `createChildItems()`: Create children without completing parent

**Frontend Types** (`frontend/src/types/index.ts`):
- Added `HandoffRule` and `HandoffHistory` interfaces
- Integration with activity feed for handoff tracking

---

## Technical Notes

### Agent Complete & Handoff Function
```typescript
// supabase/functions/agent-complete/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface CompleteRequest {
  workItemId: string
  agentType: string
  agentInstanceId: string
  output: Record<string, unknown>
  createChildItems?: Array<{
    type: string
    title: string
    description: string
    metadata?: Record<string, unknown>
  }>
  nextStatus?: string
}

serve(async (req) => {
  const body: CompleteRequest = await req.json()

  const result = await completeWorkItem(body)

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  })
})

async function completeWorkItem(request: CompleteRequest) {
  const { workItemId, agentType, agentInstanceId, output, createChildItems } = request

  // Start transaction
  const { data: workItem, error: fetchError } = await supabase
    .from('work_items')
    .select('*')
    .eq('id', workItemId)
    .single()

  if (fetchError || !workItem) {
    throw new Error('Work item not found')
  }

  // Validate agent owns this item
  if (workItem.metadata?.claimed_by_instance !== agentInstanceId) {
    throw new Error('Agent does not own this work item')
  }

  // Update parent item to done
  await supabase
    .from('work_items')
    .update({
      status: 'done',
      completed_at: new Date().toISOString(),
      assigned_agent: null,
      metadata: {
        ...workItem.metadata,
        output,
        completed_by_agent: agentType,
        completed_by_instance: agentInstanceId
      }
    })
    .eq('id', workItemId)

  // Create child items
  const childItems = []
  if (createChildItems?.length) {
    for (const child of createChildItems) {
      const { data: childItem } = await supabase
        .from('work_items')
        .insert({
          project_id: workItem.project_id,
          parent_id: workItemId,
          title: child.title,
          description: child.description,
          type: child.type,
          status: 'ready', // Ready for next agent
          priority: workItem.priority,
          metadata: {
            ...child.metadata,
            created_by_agent: agentType,
            parent_output: output
          },
          created_by: workItem.created_by
        })
        .select()
        .single()

      childItems.push(childItem)
    }
  }

  // Log handoff
  await supabase.from('agent_activity').insert({
    work_item_id: workItemId,
    agent_type: agentType,
    agent_instance_id: agentInstanceId,
    action: 'handed_off',
    details: {
      child_items: childItems.map(c => c.id),
      output_summary: Object.keys(output)
    }
  })

  // Notify next agents (via webhook or realtime)
  await notifyAgents(childItems)

  return {
    success: true,
    completedItem: workItemId,
    childItems: childItems.map(c => ({ id: c.id, type: c.type, title: c.title }))
  }
}
```

### Handoff Rules Configuration
```typescript
// src/config/handoffRules.ts
export const HANDOFF_RULES: Record<string, HandoffRule> = {
  project_spec: {
    processedBy: 'project_manager',
    outputType: 'prd',
    creates: ['prd'],
    validation: (output) => output.requirements?.length > 0
  },
  feature: {
    processedBy: 'project_manager',
    outputType: 'prd',
    creates: ['prd'],
    validation: (output) => output.requirements?.length > 0
  },
  prd: {
    processedBy: 'scrum_master',
    outputType: 'stories',
    creates: ['story'],
    validation: (output) => output.stories?.length > 0
  },
  story: {
    processedBy: ['developer', 'human'],
    outputType: 'implementation',
    creates: [],
    validation: (output) => output.pr_url || output.completed
  },
  bug: {
    processedBy: ['developer', 'human'],
    outputType: 'fix',
    creates: [],
    validation: (output) => output.pr_url || output.completed
  }
}

interface HandoffRule {
  processedBy: string | string[]
  outputType: string
  creates: string[]
  validation: (output: Record<string, unknown>) => boolean
}
```

### Handoff Validation
```typescript
// agent/lib/handoff.ts
export async function validateHandoff(
  workItem: WorkItem,
  output: Record<string, unknown>
): Promise<{ valid: boolean; errors: string[] }> {
  const rule = HANDOFF_RULES[workItem.type]

  if (!rule) {
    return { valid: false, errors: ['No handoff rule defined for this type'] }
  }

  const errors: string[] = []

  // Check required output fields
  if (!rule.validation(output)) {
    errors.push(`Output does not meet requirements for ${workItem.type}`)
  }

  // Validate child items can be created
  if (rule.creates.length > 0 && !output[rule.outputType]) {
    errors.push(`Missing ${rule.outputType} in output`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
```

### Human Escalation
```typescript
// agent/lib/escalation.ts
export async function escalateToHuman(
  workItem: WorkItem,
  reason: string,
  agentInstanceId: string
) {
  // Release the item
  await agentClient.rpc('release_work_item', {
    p_work_item_id: workItem.id,
    p_agent_instance_id: agentInstanceId,
    p_reason: 'escalated'
  })

  // Add escalation comment
  await agentClient.from('comments').insert({
    work_item_id: workItem.id,
    author_agent: AGENT_TYPE,
    content: `**Escalated to human**: ${reason}`,
    is_system_message: true
  })

  // Log activity
  await agentClient.from('agent_activity').insert({
    work_item_id: workItem.id,
    agent_type: AGENT_TYPE,
    agent_instance_id: agentInstanceId,
    action: 'escalated',
    details: { reason }
  })

  // Update item metadata
  await agentClient
    .from('work_items')
    .update({
      status: 'ready',
      metadata: {
        escalated: true,
        escalation_reason: reason,
        escalated_at: new Date().toISOString()
      }
    })
    .eq('id', workItem.id)
}
```

### Agent Notification System
```typescript
// supabase/functions/notify-agents/index.ts
async function notifyAgents(items: WorkItem[]) {
  // Group items by target agent type
  const byAgentType = items.reduce((acc, item) => {
    const rule = HANDOFF_RULES[item.type]
    const targetAgent = Array.isArray(rule.processedBy)
      ? rule.processedBy[0]
      : rule.processedBy

    if (!acc[targetAgent]) acc[targetAgent] = []
    acc[targetAgent].push(item)
    return acc
  }, {} as Record<string, WorkItem[]>)

  // Send notifications (webhook, realtime broadcast, etc.)
  for (const [agentType, agentItems] of Object.entries(byAgentType)) {
    await supabase.channel(`agent:${agentType}`).send({
      type: 'broadcast',
      event: 'new_items',
      payload: { items: agentItems }
    })
  }
}
```

---

## Related Stories
- Depends on: STORY-010, STORY-011
- Blocks: STORY-014, STORY-015, STORY-016

---

## Notes
- Consider idempotency for handoff operations
- Add retry logic for failed child item creation
- Support partial success (some children created)
