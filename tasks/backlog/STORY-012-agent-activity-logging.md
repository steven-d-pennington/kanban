# STORY-012: Agent Activity Logging

## Overview
Implement comprehensive logging of all agent activities for monitoring, debugging, and audit purposes.

## Status
**Current**: BACKLOG
**Phase**: 3 - Agent Integration
**Priority**: MEDIUM
**Estimated Effort**: Medium

---

## User Story
As a human operator, I want to see a complete log of all agent activities so that I can monitor agent behavior and troubleshoot issues.

---

## Acceptance Criteria

- [ ] Log all agent actions (claim, update, complete, error)
- [ ] Activity log includes:
  - Timestamp
  - Agent type and instance
  - Action performed
  - Work item affected
  - Input/output data
  - Duration
  - Success/failure status
- [ ] View activity log in UI
- [ ] Filter logs by agent, action, work item
- [ ] Real-time activity feed
- [ ] Export logs to CSV/JSON
- [ ] Log retention policy (auto-cleanup old logs)

---

## Technical Notes

### Enhanced Agent Activity Schema
```sql
-- Update agent_activity table with more fields
ALTER TABLE agent_activity ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
ALTER TABLE agent_activity ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'success';
ALTER TABLE agent_activity ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE agent_activity ADD COLUMN IF NOT EXISTS input_data JSONB;
ALTER TABLE agent_activity ADD COLUMN IF NOT EXISTS output_data JSONB;

-- Index for common queries
CREATE INDEX idx_agent_activity_agent_type ON agent_activity(agent_type);
CREATE INDEX idx_agent_activity_action ON agent_activity(action);
CREATE INDEX idx_agent_activity_created_at ON agent_activity(created_at DESC);
CREATE INDEX idx_agent_activity_status ON agent_activity(status);
```

### Activity Types
```typescript
// src/types/agentActivity.ts
export type AgentAction =
  | 'claimed'
  | 'processing'
  | 'completed'
  | 'handed_off'
  | 'failed'
  | 'released'
  | 'retrying'
  | 'waiting'

export interface AgentActivity {
  id: string
  work_item_id: string
  agent_type: string
  agent_instance_id: string
  action: AgentAction
  details: Record<string, unknown>
  input_data?: Record<string, unknown>
  output_data?: Record<string, unknown>
  duration_ms?: number
  status: 'success' | 'error' | 'warning'
  error_message?: string
  created_at: string
}
```

### Agent Activity Store
```typescript
// src/stores/agentActivityStore.ts
interface AgentActivityState {
  activities: AgentActivity[]
  loading: boolean

  fetchActivities: (filters?: ActivityFilters) => Promise<void>
  subscribeToActivities: (projectId?: string) => void
}

interface ActivityFilters {
  workItemId?: string
  agentType?: string
  action?: string
  status?: string
  startDate?: string
  endDate?: string
}

export const useAgentActivityStore = create<AgentActivityState>((set, get) => ({
  activities: [],
  loading: false,

  fetchActivities: async (filters) => {
    set({ loading: true })

    let query = supabase
      .from('agent_activity')
      .select(`
        *,
        work_item:work_items(id, title, type)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (filters?.workItemId) {
      query = query.eq('work_item_id', filters.workItemId)
    }
    if (filters?.agentType) {
      query = query.eq('agent_type', filters.agentType)
    }
    if (filters?.action) {
      query = query.eq('action', filters.action)
    }

    const { data } = await query
    set({ activities: data ?? [], loading: false })
  },

  subscribeToActivities: (projectId) => {
    const channel = supabase
      .channel('agent-activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_activity'
        },
        (payload) => {
          set({ activities: [payload.new as AgentActivity, ...get().activities.slice(0, 99)] })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }
}))
```

### Activity Logger Helper (Agent Side)
```typescript
// agent/lib/activityLogger.ts
export class ActivityLogger {
  private workItemId: string
  private startTime: number

  constructor(workItemId: string) {
    this.workItemId = workItemId
    this.startTime = Date.now()
  }

  async log(
    action: AgentAction,
    details: Record<string, unknown> = {},
    options: {
      status?: 'success' | 'error' | 'warning'
      error?: Error
      input?: unknown
      output?: unknown
    } = {}
  ) {
    const duration = Date.now() - this.startTime

    await agentClient.from('agent_activity').insert({
      work_item_id: this.workItemId,
      agent_type: AGENT_TYPE,
      agent_instance_id: AGENT_INSTANCE_ID,
      action,
      details,
      duration_ms: duration,
      status: options.status ?? 'success',
      error_message: options.error?.message,
      input_data: options.input,
      output_data: options.output
    })
  }

  async logError(action: AgentAction, error: Error, details: Record<string, unknown> = {}) {
    await this.log(action, details, { status: 'error', error })
  }
}

// Usage
const logger = new ActivityLogger(workItem.id)
await logger.log('claimed', { priority: workItem.priority })
// ... do work
await logger.log('completed', { outputType: 'prd' }, { output: result })
```

### Log Cleanup (Retention Policy)
```sql
-- Delete logs older than 90 days
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM agent_activity
    WHERE created_at < NOW() - INTERVAL '90 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM deleted;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule daily cleanup
SELECT cron.schedule('cleanup-activity-logs', '0 3 * * *', 'SELECT cleanup_old_activity_logs()');
```

---

## UI Components Needed

- [ ] `ActivityFeed` - Real-time activity stream
- [ ] `ActivityLogTable` - Filterable table view
- [ ] `ActivityDetail` - Expanded activity view
- [ ] `ActivityFilters` - Filter controls
- [ ] `AgentStatusBadge` - Show agent action status

---

## Related Stories
- Depends on: STORY-008, STORY-010
- Blocks: STORY-017

---

## Notes
- Consider using Supabase Realtime for live activity feed
- Add export functionality for compliance/audit needs
- Consider separate logging table for high-volume scenarios
