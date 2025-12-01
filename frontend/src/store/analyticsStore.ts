import { create } from 'zustand';
import type { WorkItem, Status, WorkItemType, AgentType } from '../types';
import { supabase } from '../lib/supabase';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface CycleTimeStats {
  average: number;
  median: number;
  p90: number;
  min: number;
  max: number;
}

export interface ThroughputData {
  week: string;
  count: number;
  points: number;
}

export interface StatusBreakdown {
  status: Status;
  count: number;
  percentage: number;
}

export interface TypeBreakdown {
  type: WorkItemType;
  count: number;
  percentage: number;
}

export interface AgentBreakdown {
  agentType: NonNullable<AgentType> | 'human';
  count: number;
  percentage: number;
  avgCycleTime: number;
}

export interface BottleneckItem {
  id: string;
  title: string;
  status: Status;
  hoursInStatus: number;
  assignedTo?: string;
  assignedAgent?: AgentType;
}

export interface ProjectMetrics {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  backlogItems: number;
  cycleTime: CycleTimeStats;
  leadTime: CycleTimeStats;
  wip: number;
  throughput: ThroughputData[];
  byStatus: StatusBreakdown[];
  byType: TypeBreakdown[];
  byAgent: AgentBreakdown[];
}

interface AnalyticsState {
  projectMetrics: ProjectMetrics | null;
  bottlenecks: BottleneckItem[];
  velocityData: ThroughputData[];
  loading: boolean;
  error: string | null;
  dateRange: DateRange;

  // Actions
  setDateRange: (range: DateRange) => void;
  fetchProjectMetrics: (projectId: string) => Promise<void>;
  fetchBottlenecks: (projectId: string) => Promise<void>;
  exportMetrics: (format: 'csv' | 'json') => void;
}

// Helper functions for statistics
function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(nums: number[], p: number): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

// Calculate metrics from work items
function calculateMetrics(items: WorkItem[], dateRange?: DateRange): ProjectMetrics {
  const filteredItems = dateRange
    ? items.filter((item) => {
        const created = new Date(item.createdAt);
        return created >= dateRange.start && created <= dateRange.end;
      })
    : items;

  const completedItems = filteredItems.filter((i) => i.status === 'done');
  const inProgressItems = filteredItems.filter((i) =>
    ['in_progress', 'review', 'testing'].includes(i.status)
  );
  const backlogItems = filteredItems.filter((i) =>
    ['backlog', 'ready'].includes(i.status)
  );

  // Calculate cycle time (started to done)
  const cycleTimes = completedItems
    .filter((i) => i.startedAt && i.completedAt)
    .map((i) => {
      const start = new Date(i.startedAt!);
      const end = new Date(i.completedAt!);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
    });

  // Calculate lead time (created to done)
  const leadTimes = completedItems
    .filter((i) => i.completedAt)
    .map((i) => {
      const created = new Date(i.createdAt);
      const completed = new Date(i.completedAt!);
      return (completed.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
    });

  // Calculate throughput by week
  const throughputMap: Record<string, { count: number; points: number }> = {};
  completedItems.forEach((item) => {
    if (!item.completedAt) return;
    const week = getWeekStart(new Date(item.completedAt));
    if (!throughputMap[week]) {
      throughputMap[week] = { count: 0, points: 0 };
    }
    throughputMap[week].count++;
    throughputMap[week].points += item.storyPoints ?? 0;
  });

  const throughput = Object.entries(throughputMap)
    .map(([week, data]) => ({ week, ...data }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-12); // Last 12 weeks

  // Status breakdown
  const statusCounts: Record<Status, number> = {
    backlog: 0,
    ready: 0,
    in_progress: 0,
    review: 0,
    testing: 0,
    done: 0,
  };
  filteredItems.forEach((item) => {
    statusCounts[item.status]++;
  });

  const byStatus: StatusBreakdown[] = Object.entries(statusCounts).map(([status, count]) => ({
    status: status as Status,
    count,
    percentage: filteredItems.length > 0 ? (count / filteredItems.length) * 100 : 0,
  }));

  // Type breakdown
  const typeCounts: Record<string, number> = {};
  filteredItems.forEach((item) => {
    typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
  });

  const byType: TypeBreakdown[] = Object.entries(typeCounts).map(([type, count]) => ({
    type: type as WorkItemType,
    count,
    percentage: filteredItems.length > 0 ? (count / filteredItems.length) * 100 : 0,
  }));

  // Agent breakdown
  const agentCounts: Record<string, { count: number; cycleTimes: number[] }> = {
    human: { count: 0, cycleTimes: [] },
    project_manager: { count: 0, cycleTimes: [] },
    scrum_master: { count: 0, cycleTimes: [] },
    developer: { count: 0, cycleTimes: [] },
  };

  completedItems.forEach((item) => {
    const key = item.assignedAgent || 'human';
    agentCounts[key].count++;
    if (item.startedAt && item.completedAt) {
      const cycleTime =
        (new Date(item.completedAt).getTime() - new Date(item.startedAt).getTime()) /
        (1000 * 60 * 60);
      agentCounts[key].cycleTimes.push(cycleTime);
    }
  });

  const totalCompleted = completedItems.length;
  const byAgent: AgentBreakdown[] = Object.entries(agentCounts)
    .filter(([_, data]) => data.count > 0)
    .map(([agentType, data]) => ({
      agentType: agentType as NonNullable<AgentType> | 'human',
      count: data.count,
      percentage: totalCompleted > 0 ? (data.count / totalCompleted) * 100 : 0,
      avgCycleTime: average(data.cycleTimes),
    }));

  return {
    totalItems: filteredItems.length,
    completedItems: completedItems.length,
    inProgressItems: inProgressItems.length,
    backlogItems: backlogItems.length,
    cycleTime: {
      average: average(cycleTimes),
      median: median(cycleTimes),
      p90: percentile(cycleTimes, 90),
      min: cycleTimes.length > 0 ? Math.min(...cycleTimes) : 0,
      max: cycleTimes.length > 0 ? Math.max(...cycleTimes) : 0,
    },
    leadTime: {
      average: average(leadTimes),
      median: median(leadTimes),
      p90: percentile(leadTimes, 90),
      min: leadTimes.length > 0 ? Math.min(...leadTimes) : 0,
      max: leadTimes.length > 0 ? Math.max(...leadTimes) : 0,
    },
    wip: inProgressItems.length,
    throughput,
    byStatus,
    byType,
    byAgent,
  };
}

// Mock data for demo mode
function generateMockMetrics(): ProjectMetrics {
  return {
    totalItems: 47,
    completedItems: 28,
    inProgressItems: 8,
    backlogItems: 11,
    cycleTime: {
      average: 18.5,
      median: 12.3,
      p90: 42.1,
      min: 2.1,
      max: 72.5,
    },
    leadTime: {
      average: 48.2,
      median: 36.5,
      p90: 96.0,
      min: 8.0,
      max: 168.0,
    },
    wip: 8,
    throughput: [
      { week: '2025-10-27', count: 4, points: 13 },
      { week: '2025-11-03', count: 6, points: 21 },
      { week: '2025-11-10', count: 5, points: 18 },
      { week: '2025-11-17', count: 7, points: 24 },
      { week: '2025-11-24', count: 6, points: 19 },
    ],
    byStatus: [
      { status: 'backlog', count: 5, percentage: 10.6 },
      { status: 'ready', count: 6, percentage: 12.8 },
      { status: 'in_progress', count: 4, percentage: 8.5 },
      { status: 'review', count: 2, percentage: 4.3 },
      { status: 'testing', count: 2, percentage: 4.3 },
      { status: 'done', count: 28, percentage: 59.6 },
    ],
    byType: [
      { type: 'story', count: 18, percentage: 38.3 },
      { type: 'bug', count: 8, percentage: 17.0 },
      { type: 'task', count: 12, percentage: 25.5 },
      { type: 'feature', count: 5, percentage: 10.6 },
      { type: 'prd', count: 4, percentage: 8.5 },
    ],
    byAgent: [
      { agentType: 'developer', count: 15, percentage: 53.6, avgCycleTime: 24.5 },
      { agentType: 'human', count: 8, percentage: 28.6, avgCycleTime: 36.2 },
      { agentType: 'scrum_master', count: 3, percentage: 10.7, avgCycleTime: 8.3 },
      { agentType: 'project_manager', count: 2, percentage: 7.1, avgCycleTime: 12.5 },
    ],
  };
}

function generateMockBottlenecks(): BottleneckItem[] {
  return [
    {
      id: 'bottleneck-1',
      title: 'Fix authentication timeout issue',
      status: 'in_progress',
      hoursInStatus: 72,
      assignedAgent: 'developer',
    },
    {
      id: 'bottleneck-2',
      title: 'Update API documentation',
      status: 'review',
      hoursInStatus: 48,
      assignedTo: 'John Doe',
    },
    {
      id: 'bottleneck-3',
      title: 'Performance testing for dashboard',
      status: 'testing',
      hoursInStatus: 36,
    },
  ];
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  projectMetrics: null,
  bottlenecks: [],
  velocityData: [],
  loading: false,
  error: null,
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  },

  setDateRange: (range) => {
    set({ dateRange: range });
  },

  fetchProjectMetrics: async (projectId) => {
    set({ loading: true, error: null });

    try {
      if (!supabase) {
        // Demo mode - use mock data
        set({
          projectMetrics: generateMockMetrics(),
          velocityData: generateMockMetrics().throughput,
          loading: false,
        });
        return;
      }

      const { dateRange } = get();

      // Fetch work items for the project
      const { data: items, error } = await supabase
        .from('work_items')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      // Map database fields to WorkItem type
      const workItems: WorkItem[] = (items || []).map((row) => ({
        id: row.id,
        projectId: row.project_id,
        parentId: row.parent_id,
        title: row.title,
        description: row.description || '',
        type: row.type,
        priority: row.priority,
        status: row.status,
        columnOrder: row.column_order,
        assignedTo: row.assigned_to,
        assignedAgent: row.assigned_agent,
        storyPoints: row.story_points,
        dueDate: row.due_date,
        labels: row.labels || [],
        metadata: row.metadata || {},
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        startedAt: row.started_at,
        completedAt: row.completed_at,
      }));

      const metrics = calculateMetrics(workItems, dateRange);
      set({
        projectMetrics: metrics,
        velocityData: metrics.throughput,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch metrics',
        loading: false,
      });
    }
  },

  fetchBottlenecks: async (projectId) => {
    try {
      if (!supabase) {
        set({ bottlenecks: generateMockBottlenecks() });
        return;
      }

      const { data, error } = await supabase
        .from('work_items')
        .select('id, title, status, updated_at, assigned_to, assigned_agent')
        .eq('project_id', projectId)
        .not('status', 'in', '("backlog","done")')
        .order('updated_at', { ascending: true })
        .limit(10);

      if (error) throw error;

      const bottlenecks: BottleneckItem[] = (data || [])
        .map((row) => ({
          id: row.id,
          title: row.title,
          status: row.status as Status,
          hoursInStatus:
            (Date.now() - new Date(row.updated_at).getTime()) / (1000 * 60 * 60),
          assignedTo: row.assigned_to,
          assignedAgent: row.assigned_agent,
        }))
        .filter((item) => item.hoursInStatus > 24); // Only show items stuck for > 24 hours

      set({ bottlenecks });
    } catch (error) {
      console.error('Failed to fetch bottlenecks:', error);
    }
  },

  exportMetrics: (format) => {
    const { projectMetrics, bottlenecks } = get();

    if (!projectMetrics) return;

    const exportData = {
      summary: {
        totalItems: projectMetrics.totalItems,
        completedItems: projectMetrics.completedItems,
        wip: projectMetrics.wip,
        avgCycleTime: projectMetrics.cycleTime.average,
        avgLeadTime: projectMetrics.leadTime.average,
      },
      throughput: projectMetrics.throughput,
      byStatus: projectMetrics.byStatus,
      byType: projectMetrics.byType,
      byAgent: projectMetrics.byAgent,
      bottlenecks,
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      downloadBlob(blob, `analytics-${Date.now()}.json`);
    } else {
      // CSV export - simplified
      const rows = [
        ['Metric', 'Value'],
        ['Total Items', projectMetrics.totalItems.toString()],
        ['Completed Items', projectMetrics.completedItems.toString()],
        ['WIP', projectMetrics.wip.toString()],
        ['Avg Cycle Time (hours)', projectMetrics.cycleTime.average.toFixed(1)],
        ['Avg Lead Time (hours)', projectMetrics.leadTime.average.toFixed(1)],
        [''],
        ['Week', 'Items Completed', 'Story Points'],
        ...projectMetrics.throughput.map((t) => [t.week, t.count.toString(), t.points.toString()]),
      ];

      const csv = rows.map((r) => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadBlob(blob, `analytics-${Date.now()}.csv`);
    }
  },
}));

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
