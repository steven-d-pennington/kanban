# Agent Architecture Overview

## Introduction

Agent Kanban includes a TypeScript-based agent SDK that enables AI agents to interact with the Kanban board. Agents can claim work items, process them, and hand off results.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Agent Layer                        │
├──────────────────┬─────────────────┬─────────────────┤
│   PM Agent       │    SM Agent     │    Dev Agent    │
│   (Claude)       │    (Claude)     │    (Claude)     │
├──────────────────┴─────────────────┴─────────────────┤
│                    Agent SDK                          │
│  ┌────────────┬────────────┬────────────┐            │
│  │ AgentBase  │ Handoff    │ Activity   │            │
│  │            │ Protocol   │ Logger     │            │
│  └────────────┴────────────┴────────────┘            │
├──────────────────────────────────────────────────────┤
│                 Supabase Client                       │
└──────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│                    Supabase                           │
│  ┌────────────┬────────────┬────────────┐            │
│  │ PostgreSQL │  Realtime  │    Auth    │            │
│  └────────────┴────────────┴────────────┘            │
└──────────────────────────────────────────────────────┘
```

## Agent SDK Components

### AgentBase

Base class that all agents extend:

```typescript
abstract class AgentBase {
  // Register agent instance
  async register(): Promise<void>

  // Main processing loop
  async run(): Promise<void>

  // Claim a work item
  async claim(workItemId: string): Promise<boolean>

  // Process the claimed item (implement in subclass)
  abstract process(workItem: WorkItem): Promise<ProcessResult>

  // Complete and handoff
  async complete(result: ProcessResult): Promise<void>

  // Release without completing
  async release(reason: string): Promise<void>

  // Escalate to human
  async escalate(reason: string): Promise<void>
}
```

### Work Item Operations

```typescript
// Fetch available items
const items = await fetchReadyItems(agentType);

// Claim an item (atomic operation)
const claimed = await claimWorkItem(itemId, agentType, instanceId);

// Update item status
await updateWorkItem(itemId, { status: 'in_progress' });

// Complete with output
await completeWorkItem(itemId, agentType, instanceId, output, childItems);
```

### Activity Logger

```typescript
// Log processing steps
await logActivity(workItemId, agentType, instanceId, 'processing', {
  step: 'analyzing requirements'
});

// Log completion
await logActivity(workItemId, agentType, instanceId, 'completed', {
  duration_ms: 45000
});

// Log errors
await logActivity(workItemId, agentType, instanceId, 'failed', {
  error: 'API rate limit exceeded'
}, 'error');
```

### Handoff Protocol

```typescript
// Complete and create child items
const result = await handoff(workItemId, {
  output: generatedPRD,
  childItems: [
    { type: 'prd', title: 'PRD: Feature Name', description: '...' }
  ]
});
```

## Agent Lifecycle

1. **Registration**
   - Agent starts and registers with the system
   - Receives instance ID
   - Marked as 'active'

2. **Polling**
   - Agent polls for available work items
   - Filters by appropriate types
   - Respects rate limits

3. **Claiming**
   - Atomic claim operation
   - Only one agent can claim an item
   - Claim has timeout (30 min default)

4. **Processing**
   - Agent processes the work item
   - Logs activity throughout
   - Can escalate if blocked

5. **Completion/Handoff**
   - Complete the item
   - Create child items if needed
   - Log final activity

6. **Heartbeat**
   - Agent sends periodic heartbeat
   - Updates `last_seen_at`
   - System detects stale agents

## Configuration

Each agent type has specific configuration:

```typescript
interface AgentConfig {
  instanceId: string;
  displayName: string;
  pollInterval: number;  // ms
  claimTimeout: number;  // minutes
  maxRetries: number;
}
```

## Error Handling

```typescript
try {
  await process(workItem);
  await complete(result);
} catch (error) {
  if (error.retryable) {
    await logActivity(id, type, instance, 'retrying', { attempt });
    // Retry with backoff
  } else {
    await logActivity(id, type, instance, 'failed', { error }, 'error');
    await escalate('Processing failed: ' + error.message);
  }
}
```

## Security

- Agents use service role key
- Rate limiting prevents abuse
- Activity logging for audit trail
- Automatic stale claim cleanup

## Directory Structure

```
agent/
├── lib/
│   ├── agents/
│   │   ├── project-manager/
│   │   │   ├── index.ts
│   │   │   ├── run.ts
│   │   │   ├── prdGenerator.ts
│   │   │   └── types.ts
│   │   ├── scrum-master/
│   │   │   ├── index.ts
│   │   │   ├── run.ts
│   │   │   └── storyGenerator.ts
│   │   └── developer/
│   │       ├── index.ts
│   │       ├── run.ts
│   │       └── codeGenerator.ts
│   ├── shared/
│   │   ├── AgentBase.ts
│   │   └── types.ts
│   ├── activityLogger.ts
│   ├── handoff.ts
│   ├── workItems.ts
│   └── supabase.ts
└── package.json
```

## Next Steps

- [Project Manager Agent](./project-manager.md)
- [Scrum Master Agent](./scrum-master.md)
- [Developer Agent](./developer.md)
- [Creating Custom Agents](./custom-agents.md)
