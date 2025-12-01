# STORY-017: Agent Monitoring Dashboard

## Overview
Build a comprehensive dashboard for monitoring agent activity, health, and performance in real-time.

## Status
**Current**: BACKLOG
**Phase**: 5 - Polish
**Priority**: MEDIUM
**Estimated Effort**: Large

---

## User Story
As a system administrator, I want a dashboard to monitor all agent activities so that I can ensure agents are working correctly and troubleshoot issues quickly.

---

## Acceptance Criteria

- [ ] Dashboard showing all active agent instances
- [ ] Real-time agent status (idle, processing, error)
- [ ] Current task per agent
- [ ] Agent health metrics:
  - Uptime
  - Tasks completed (today/week/all-time)
  - Success rate
  - Average processing time
  - Error rate
- [ ] Activity timeline/feed
- [ ] Error log with stack traces
- [ ] Ability to pause/resume agent instances
- [ ] Alerts for agent failures
- [ ] Historical performance charts

---

## Technical Notes

### Dashboard Store
```typescript
// src/stores/monitoringStore.ts
import { create } from 'zustand'

interface AgentInstance {
  id: string
  type: string
  status: 'idle' | 'processing' | 'error' | 'offline'
  currentTask?: {
    id: string
    title: string
    startedAt: string
  }
  lastSeenAt: string
  metrics: {
    tasksCompleted: number
    successRate: number
    avgProcessingTimeMs: number
    errorsToday: number
  }
}

interface MonitoringState {
  agents: AgentInstance[]
  activities: AgentActivity[]
  loading: boolean

  fetchAgents: () => Promise<void>
  fetchMetrics: (agentId: string) => Promise<AgentMetrics>
  subscribeToAgentUpdates: () => () => void
}

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
  agents: [],
  activities: [],
  loading: false,

  fetchAgents: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('agent_instances')
      .select('*')
      .eq('status', 'active')

    // Enrich with current task info
    const enrichedAgents = await Promise.all(
      data.map(async (agent) => {
        const { data: task } = await supabase
          .from('work_items')
          .select('id, title, started_at')
          .eq('metadata->>claimed_by_instance', agent.id)
          .eq('status', 'in_progress')
          .single()

        return {
          ...agent,
          currentTask: task ? {
            id: task.id,
            title: task.title,
            startedAt: task.started_at
          } : undefined
        }
      })
    )

    set({ agents: enrichedAgents, loading: false })
  },

  subscribeToAgentUpdates: () => {
    const channel = supabase
      .channel('agent-monitoring')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_instances'
      }, () => get().fetchAgents())
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'agent_activity'
      }, (payload) => {
        set(state => ({
          activities: [payload.new as AgentActivity, ...state.activities.slice(0, 99)]
        }))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }
}))
```

### Dashboard Components
```typescript
// src/components/monitoring/AgentMonitorDashboard.tsx
export function AgentMonitorDashboard() {
  const { agents, activities, fetchAgents, subscribeToAgentUpdates } = useMonitoringStore()

  useEffect(() => {
    fetchAgents()
    const unsubscribe = subscribeToAgentUpdates()
    return unsubscribe
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Agent Monitor</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Active Agents"
          value={agents.filter(a => a.status !== 'offline').length}
          icon={<RobotIcon />}
        />
        <MetricCard
          title="Processing"
          value={agents.filter(a => a.status === 'processing').length}
          icon={<SpinnerIcon />}
        />
        <MetricCard
          title="Tasks Today"
          value={getTotalTasksToday(agents)}
          icon={<CheckIcon />}
        />
        <MetricCard
          title="Errors Today"
          value={getTotalErrorsToday(agents)}
          icon={<AlertIcon />}
          variant="error"
        />
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-3 gap-4">
        {agents.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-2 gap-6">
        <ActivityFeed activities={activities} />
        <PerformanceChart agents={agents} />
      </div>
    </div>
  )
}
```

### Agent Card Component
```typescript
// src/components/monitoring/AgentCard.tsx
export function AgentCard({ agent }: { agent: AgentInstance }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AgentTypeIcon type={agent.type} />
          <span className="font-medium">{agent.id}</span>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      {agent.currentTask && (
        <div className="bg-blue-50 rounded p-2 mb-3">
          <div className="text-xs text-blue-600">Processing</div>
          <div className="text-sm truncate">{agent.currentTask.title}</div>
          <div className="text-xs text-gray-500">
            Started {formatDistanceToNow(new Date(agent.currentTask.startedAt))} ago
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-gray-500">Success Rate</div>
          <div className="font-medium">{agent.metrics.successRate}%</div>
        </div>
        <div>
          <div className="text-gray-500">Avg Time</div>
          <div className="font-medium">{formatDuration(agent.metrics.avgProcessingTimeMs)}</div>
        </div>
        <div>
          <div className="text-gray-500">Completed</div>
          <div className="font-medium">{agent.metrics.tasksCompleted}</div>
        </div>
        <div>
          <div className="text-gray-500">Errors</div>
          <div className="font-medium text-red-600">{agent.metrics.errorsToday}</div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-400">
        Last seen {formatDistanceToNow(new Date(agent.lastSeenAt))} ago
      </div>
    </div>
  )
}
```

### Metrics Aggregation (Database)
```sql
-- View for agent metrics
CREATE VIEW agent_metrics AS
SELECT
  ai.id as agent_id,
  ai.agent_type,
  ai.status,
  ai.last_seen_at,
  COUNT(aa.id) FILTER (WHERE aa.created_at > NOW() - INTERVAL '24 hours') as tasks_today,
  COUNT(aa.id) FILTER (WHERE aa.status = 'success') as success_count,
  COUNT(aa.id) as total_count,
  ROUND(
    COUNT(aa.id) FILTER (WHERE aa.status = 'success')::numeric /
    NULLIF(COUNT(aa.id), 0) * 100,
    1
  ) as success_rate,
  AVG(aa.duration_ms) as avg_duration_ms,
  COUNT(aa.id) FILTER (WHERE aa.status = 'error' AND aa.created_at > NOW() - INTERVAL '24 hours') as errors_today
FROM agent_instances ai
LEFT JOIN agent_activity aa ON aa.agent_instance_id = ai.id
GROUP BY ai.id, ai.agent_type, ai.status, ai.last_seen_at;
```

---

## UI Components Needed

- [ ] `AgentMonitorDashboard` - Main dashboard layout
- [ ] `AgentCard` - Individual agent status card
- [ ] `AgentDetailPanel` - Expanded agent view
- [ ] `ActivityFeed` - Real-time activity stream
- [ ] `PerformanceChart` - Historical metrics chart
- [ ] `ErrorLog` - Filterable error list
- [ ] `MetricCard` - Summary metric display
- [ ] `StatusBadge` - Agent status indicator

---

## Related Stories
- Depends on: STORY-012 (agent activity logging)
- Blocks: None

---

## Notes
- Consider using Chart.js or Recharts for visualizations
- Add email/Slack alerts for critical errors
- Consider agent health checks via heartbeat
- Add ability to drill down into specific agent's history
