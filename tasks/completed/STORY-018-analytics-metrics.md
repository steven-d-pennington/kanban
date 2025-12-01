# STORY-018: Analytics and Metrics

## Overview
Implement analytics and metrics tracking to measure project progress, team velocity, and overall system performance.

## Status
**Current**: BACKLOG
**Phase**: 5 - Polish
**Priority**: MEDIUM
**Estimated Effort**: Medium

---

## User Story
As a project manager, I want to see analytics and metrics about my projects so that I can track progress and identify bottlenecks.

---

## Acceptance Criteria

- [ ] Project-level metrics dashboard
- [ ] Work item metrics:
  - Cycle time (backlog to done)
  - Lead time (created to done)
  - Throughput (items completed per week)
  - WIP (work in progress) count
- [ ] Burndown/burnup charts
- [ ] Velocity tracking (story points per sprint)
- [ ] Agent vs human completion rates
- [ ] Bottleneck identification (items stuck in status)
- [ ] Customizable date ranges
- [ ] Export metrics to CSV

---

## Technical Notes

### Analytics Store
```typescript
// src/stores/analyticsStore.ts
interface AnalyticsState {
  projectMetrics: ProjectMetrics | null
  cycleTimeData: CycleTimeData[]
  velocityData: VelocityData[]
  loading: boolean

  fetchProjectMetrics: (projectId: string, dateRange?: DateRange) => Promise<void>
  fetchCycleTimeData: (projectId: string) => Promise<void>
  fetchVelocityData: (projectId: string) => Promise<void>
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  projectMetrics: null,
  cycleTimeData: [],
  velocityData: [],
  loading: false,

  fetchProjectMetrics: async (projectId, dateRange) => {
    set({ loading: true })
    const metrics = await calculateProjectMetrics(projectId, dateRange)
    set({ projectMetrics: metrics, loading: false })
  }
}))
```

### Metrics Calculations
```typescript
// src/lib/analytics.ts
export async function calculateProjectMetrics(
  projectId: string,
  dateRange?: DateRange
): Promise<ProjectMetrics> {
  const { data: items } = await supabase
    .from('work_items')
    .select('*')
    .eq('project_id', projectId)

  const completedItems = items.filter(i => i.status === 'done')

  // Calculate cycle time (time in active states)
  const cycleTime = calculateCycleTime(completedItems)

  // Calculate lead time (created to done)
  const leadTime = calculateLeadTime(completedItems)

  // Calculate throughput
  const throughput = calculateThroughput(completedItems, dateRange)

  // Current WIP
  const wip = items.filter(i =>
    ['in_progress', 'review', 'testing'].includes(i.status)
  ).length

  return {
    totalItems: items.length,
    completedItems: completedItems.length,
    cycleTime,
    leadTime,
    throughput,
    wip,
    byStatus: groupByStatus(items),
    byType: groupByType(items),
    byAgent: groupByAgent(items)
  }
}

function calculateCycleTime(items: WorkItem[]): CycleTimeStats {
  const times = items
    .filter(i => i.started_at && i.completed_at)
    .map(i => {
      const start = new Date(i.started_at!)
      const end = new Date(i.completed_at!)
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60) // hours
    })

  return {
    average: average(times),
    median: median(times),
    p90: percentile(times, 90),
    min: Math.min(...times),
    max: Math.max(...times)
  }
}

function calculateThroughput(
  items: WorkItem[],
  dateRange?: DateRange
): ThroughputData[] {
  // Group by week
  const byWeek = items.reduce((acc, item) => {
    if (!item.completed_at) return acc
    const week = getWeekStart(new Date(item.completed_at))
    if (!acc[week]) acc[week] = { count: 0, points: 0 }
    acc[week].count++
    acc[week].points += item.story_points ?? 0
    return acc
  }, {} as Record<string, { count: number; points: number }>)

  return Object.entries(byWeek)
    .map(([week, data]) => ({
      week,
      count: data.count,
      points: data.points
    }))
    .sort((a, b) => a.week.localeCompare(b.week))
}
```

### Database Views for Metrics
```sql
-- Work item metrics view
CREATE VIEW work_item_metrics AS
SELECT
  project_id,
  status,
  type,
  EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600 as cycle_time_hours,
  EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600 as lead_time_hours,
  story_points,
  assigned_agent IS NOT NULL as completed_by_agent,
  DATE_TRUNC('week', completed_at) as completed_week
FROM work_items
WHERE status = 'done';

-- Bottleneck detection view
CREATE VIEW work_item_bottlenecks AS
SELECT
  id,
  title,
  status,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600 as hours_in_status,
  assigned_to,
  assigned_agent
FROM work_items
WHERE status NOT IN ('backlog', 'done')
  AND updated_at < NOW() - INTERVAL '24 hours'
ORDER BY hours_in_status DESC;
```

### Analytics Dashboard Component
```typescript
// src/components/analytics/AnalyticsDashboard.tsx
export function AnalyticsDashboard({ projectId }: Props) {
  const {
    projectMetrics,
    cycleTimeData,
    velocityData,
    fetchProjectMetrics,
    fetchCycleTimeData,
    fetchVelocityData
  } = useAnalyticsStore()

  const [dateRange, setDateRange] = useState<DateRange>({
    start: subDays(new Date(), 30),
    end: new Date()
  })

  useEffect(() => {
    fetchProjectMetrics(projectId, dateRange)
    fetchCycleTimeData(projectId)
    fetchVelocityData(projectId)
  }, [projectId, dateRange])

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Avg Cycle Time"
          value={`${projectMetrics?.cycleTime.average.toFixed(1)}h`}
        />
        <MetricCard
          title="Throughput/Week"
          value={projectMetrics?.throughput[0]?.count ?? 0}
        />
        <MetricCard
          title="Current WIP"
          value={projectMetrics?.wip}
        />
        <MetricCard
          title="Completion Rate"
          value={`${((projectMetrics?.completedItems / projectMetrics?.totalItems) * 100).toFixed(0)}%`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <VelocityChart data={velocityData} />
        <CycleTimeChart data={cycleTimeData} />
      </div>

      {/* Breakdown Tables */}
      <div className="grid grid-cols-2 gap-6">
        <StatusBreakdown data={projectMetrics?.byStatus} />
        <AgentPerformance data={projectMetrics?.byAgent} />
      </div>

      {/* Bottlenecks */}
      <BottlenecksList projectId={projectId} />
    </div>
  )
}
```

### Velocity Chart
```typescript
// src/components/analytics/VelocityChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export function VelocityChart({ data }: { data: VelocityData[] }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-medium mb-4">Velocity Trend</h3>
      <LineChart width={500} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="points" stroke="#3b82f6" name="Story Points" />
        <Line type="monotone" dataKey="count" stroke="#10b981" name="Items" />
      </LineChart>
    </div>
  )
}
```

---

## UI Components Needed

- [ ] `AnalyticsDashboard` - Main analytics page
- [ ] `DateRangePicker` - Date range selector
- [ ] `MetricCard` - Individual metric display
- [ ] `VelocityChart` - Velocity line chart
- [ ] `CycleTimeChart` - Cycle time histogram
- [ ] `BurndownChart` - Sprint burndown
- [ ] `StatusBreakdown` - Items by status pie chart
- [ ] `AgentPerformance` - Agent comparison table
- [ ] `BottlenecksList` - Stalled items list

---

## Related Stories
- Depends on: STORY-006, STORY-012
- Blocks: None

---

## Notes
- Use Recharts or Chart.js for visualizations
- Consider caching aggregated metrics for performance
- Add ability to compare periods (this week vs last week)
- Support team-level and project-level views
