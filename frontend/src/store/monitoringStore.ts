import { create } from 'zustand';
import type { AgentType, AgentAction } from '../types';
import type { Database } from '../types/database';
import { supabase } from '../lib/supabase';

type AgentInstanceUpdate = Database['public']['Tables']['agent_instances']['Update'];

// Database row types
interface AgentInstanceRow {
  id: string;
  agent_type: string;
  display_name: string;
  status: string;
  last_seen_at: string;
  created_at: string;
}

interface WorkItemTaskRow {
  id: string;
  title: string;
  started_at: string;
}

interface AgentActivityRow {
  id: string;
  status: string;
  duration_ms: number | null;
  created_at: string;
}

interface ActivityFeedRow {
  id: string;
  agent_instance_id: string;
  agent_type: string;
  action: string;
  work_item_title: string | null;
  status: string;
  created_at: string;
  duration_ms: number | null;
  agent_display_name: string | null;
  error_message: string | null;
  work_item_id: string | null;
}

interface ClaimedItemRow {
  id: string;
  title: string;
  claimed_minutes_ago: number;
  claimed_by_instance: string;
  claimed_at: string;
}

export interface AgentMetrics {
  tasksCompleted: number;
  tasksToday: number;
  successRate: number;
  avgProcessingTimeMs: number;
  errorsToday: number;
  totalErrors: number;
}

export interface MonitoredAgent {
  id: string;
  type: NonNullable<AgentType>;
  displayName: string;
  status: 'idle' | 'processing' | 'error' | 'offline';
  currentTask?: {
    id: string;
    title: string;
    startedAt: string;
  };
  lastSeenAt: string;
  createdAt: string;
  metrics: AgentMetrics;
}

export interface RecentActivity {
  id: string;
  agentId: string;
  agentType: NonNullable<AgentType>;
  action: AgentAction;
  workItemTitle?: string;
  status: 'success' | 'error' | 'warning';
  timestamp: string;
  durationMs?: number;
}

export interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  agentId?: string;
  workItemId?: string;
  timestamp: string;
  acknowledged: boolean;
}

interface MonitoringState {
  agents: MonitoredAgent[];
  recentActivities: RecentActivity[];
  alerts: SystemAlert[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;

  // Summary stats
  summaryStats: {
    activeAgents: number;
    processingAgents: number;
    tasksToday: number;
    errorsToday: number;
  };

  // Actions
  fetchAgents: (projectId?: string) => Promise<void>;
  fetchRecentActivities: (projectId?: string, limit?: number) => Promise<void>;
  fetchAlerts: (projectId?: string) => Promise<void>;
  acknowledgeAlert: (alertId: string) => void;
  pauseAgent: (agentId: string) => Promise<boolean>;
  resumeAgent: (agentId: string) => Promise<boolean>;
  subscribeToUpdates: (projectId?: string) => () => void;
  refreshAll: (projectId?: string) => Promise<void>;
}

// Mock data for demo mode
const mockAgents: MonitoredAgent[] = [
  {
    id: 'pm-agent-001',
    type: 'project_manager',
    displayName: 'Project Manager Agent',
    status: 'idle',
    lastSeenAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    metrics: {
      tasksCompleted: 42,
      tasksToday: 3,
      successRate: 95.2,
      avgProcessingTimeMs: 45000,
      errorsToday: 0,
      totalErrors: 2,
    },
  },
  {
    id: 'sm-agent-001',
    type: 'scrum_master',
    displayName: 'Scrum Master Agent',
    status: 'processing',
    currentTask: {
      id: 'item-1',
      title: 'Break down user authentication PRD into stories',
      startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    lastSeenAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    metrics: {
      tasksCompleted: 78,
      tasksToday: 5,
      successRate: 98.7,
      avgProcessingTimeMs: 32000,
      errorsToday: 0,
      totalErrors: 1,
    },
  },
  {
    id: 'dev-agent-001',
    type: 'developer',
    displayName: 'Developer Agent 1',
    status: 'processing',
    currentTask: {
      id: 'item-2',
      title: 'Implement user login form with validation',
      startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    lastSeenAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    metrics: {
      tasksCompleted: 156,
      tasksToday: 8,
      successRate: 92.3,
      avgProcessingTimeMs: 180000,
      errorsToday: 1,
      totalErrors: 12,
    },
  },
  {
    id: 'dev-agent-002',
    type: 'developer',
    displayName: 'Developer Agent 2',
    status: 'idle',
    lastSeenAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    metrics: {
      tasksCompleted: 89,
      tasksToday: 4,
      successRate: 94.4,
      avgProcessingTimeMs: 165000,
      errorsToday: 0,
      totalErrors: 5,
    },
  },
];

const mockActivities: RecentActivity[] = [
  {
    id: 'act-1',
    agentId: 'dev-agent-001',
    agentType: 'developer',
    action: 'processing',
    workItemTitle: 'Implement user login form with validation',
    status: 'success',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-2',
    agentId: 'sm-agent-001',
    agentType: 'scrum_master',
    action: 'claimed',
    workItemTitle: 'Break down user authentication PRD into stories',
    status: 'success',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-3',
    agentId: 'dev-agent-002',
    agentType: 'developer',
    action: 'completed',
    workItemTitle: 'Add password reset functionality',
    status: 'success',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    durationMs: 125000,
  },
  {
    id: 'act-4',
    agentId: 'pm-agent-001',
    agentType: 'project_manager',
    action: 'handed_off',
    workItemTitle: 'Dashboard feature specification',
    status: 'success',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    durationMs: 42000,
  },
  {
    id: 'act-5',
    agentId: 'dev-agent-001',
    agentType: 'developer',
    action: 'failed',
    workItemTitle: 'Integrate external API',
    status: 'error',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    durationMs: 95000,
  },
];

const mockAlerts: SystemAlert[] = [
  {
    id: 'alert-1',
    type: 'error',
    title: 'Task Failed',
    message: 'Developer Agent 1 failed to complete "Integrate external API" - API rate limit exceeded',
    agentId: 'dev-agent-001',
    workItemId: 'item-3',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: 'alert-2',
    type: 'warning',
    title: 'Long Running Task',
    message: 'Developer Agent 1 has been processing "Implement user login form" for over 45 minutes',
    agentId: 'dev-agent-001',
    workItemId: 'item-2',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
];

// Helper function to calculate summary stats
function calculateSummaryStats(agents: MonitoredAgent[]) {
  return {
    activeAgents: agents.filter((a) => a.status !== 'offline').length,
    processingAgents: agents.filter((a) => a.status === 'processing').length,
    tasksToday: agents.reduce((sum, a) => sum + a.metrics.tasksToday, 0),
    errorsToday: agents.reduce((sum, a) => sum + a.metrics.errorsToday, 0),
  };
}

// Map database row to MonitoredAgent
const mapAgentFromDb = (row: Record<string, unknown>, currentTask?: { id: string; title: string; startedAt: string }): MonitoredAgent => {
  const lastSeenMs = Date.now() - new Date(row.last_seen_at as string).getTime();
  const isOffline = lastSeenMs > 10 * 60 * 1000; // 10 minutes
  const hasError = (row.status as string) === 'error';

  let status: MonitoredAgent['status'] = 'idle';
  if (isOffline) status = 'offline';
  else if (hasError) status = 'error';
  else if (currentTask) status = 'processing';

  return {
    id: row.id as string,
    type: row.agent_type as NonNullable<AgentType>,
    displayName: row.display_name as string,
    status,
    currentTask,
    lastSeenAt: row.last_seen_at as string,
    createdAt: row.created_at as string,
    metrics: {
      tasksCompleted: (row.total_count as number) || 0,
      tasksToday: (row.tasks_today as number) || 0,
      successRate: (row.success_rate as number) || 100,
      avgProcessingTimeMs: (row.avg_duration_ms as number) || 0,
      errorsToday: (row.errors_today as number) || 0,
      totalErrors: ((row.total_count as number) || 0) - ((row.success_count as number) || 0),
    },
  };
};

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
  agents: mockAgents,
  recentActivities: mockActivities,
  alerts: mockAlerts,
  loading: false,
  error: null,
  lastUpdated: new Date().toISOString(),
  summaryStats: calculateSummaryStats(mockAgents),

  fetchAgents: async (projectId?: string) => {
    set({ loading: true, error: null });

    try {
      if (!supabase) {
        // Demo mode
        set({
          agents: mockAgents,
          summaryStats: calculateSummaryStats(mockAgents),
          loading: false,
          lastUpdated: new Date().toISOString(),
        });
        return;
      }

      // supabase is guaranteed to be non-null here due to the check above
      const sb = supabase;

      // Fetch agent instances with metrics
      const { data: agentData, error: agentError } = await sb
        .from('agent_instances')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (agentError) throw agentError;

      // Fetch metrics for each agent
      const enrichedAgents = await Promise.all(
        ((agentData || []) as AgentInstanceRow[]).map(async (agent) => {
          // Get current task if any - filter by project if provided
          let taskQuery = sb
            .from('work_items')
            .select('id, title, started_at')
            .eq('metadata->>claimed_by_instance', agent.id)
            .eq('status', 'in_progress');

          if (projectId) {
            taskQuery = taskQuery.eq('project_id', projectId);
          }

          const { data: taskData } = await taskQuery.single();

          // Get activity stats
          const { data: activityStats } = await sb
            .from('agent_activity')
            .select('id, status, duration_ms, created_at')
            .eq('agent_instance_id', agent.id);

          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

          const activities = (activityStats || []) as AgentActivityRow[];
          const todayActivities = activities.filter(
            (a) => new Date(a.created_at) >= todayStart
          );

          const successCount = activities.filter((a) => a.status === 'success').length;
          const totalDuration = activities.reduce((sum, a) => sum + (a.duration_ms || 0), 0);

          const task = taskData as WorkItemTaskRow | null;
          const currentTask = task
            ? {
                id: task.id,
                title: task.title,
                startedAt: task.started_at,
              }
            : undefined;

          return mapAgentFromDb(
            {
              ...agent,
              total_count: activities.length,
              tasks_today: todayActivities.length,
              success_count: successCount,
              success_rate: activities.length > 0 ? (successCount / activities.length) * 100 : 100,
              avg_duration_ms: activities.length > 0 ? totalDuration / activities.length : 0,
              errors_today: todayActivities.filter((a) => a.status === 'error').length,
            },
            currentTask
          );
        })
      );

      set({
        agents: enrichedAgents,
        summaryStats: calculateSummaryStats(enrichedAgents),
        loading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch agents',
        loading: false,
      });
    }
  },

  fetchRecentActivities: async (projectId?: string, limit = 20) => {
    try {
      if (!supabase) {
        set({ recentActivities: mockActivities.slice(0, limit) });
        return;
      }

      let query = supabase
        .from('agent_activity_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by project_id if provided (agent_activity_feed view should include project_id)
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const activities: RecentActivity[] = ((data || []) as ActivityFeedRow[]).map((row) => ({
        id: row.id,
        agentId: row.agent_instance_id,
        agentType: row.agent_type as NonNullable<AgentType>,
        action: row.action as AgentAction,
        workItemTitle: row.work_item_title ?? undefined,
        status: row.status as 'success' | 'error' | 'warning',
        timestamp: row.created_at,
        durationMs: row.duration_ms ?? undefined,
      }));

      set({ recentActivities: activities });
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
    }
  },

  fetchAlerts: async (projectId?: string) => {
    try {
      if (!supabase) {
        set({ alerts: mockAlerts });
        return;
      }

      // Fetch errors from recent activity - filter by project if provided
      let errorQuery = supabase
        .from('agent_activity_feed')
        .select('*')
        .eq('status', 'error')
        .order('created_at', { ascending: false })
        .limit(10);

      if (projectId) {
        errorQuery = errorQuery.eq('project_id', projectId);
      }

      const { data: errorData } = await errorQuery;

      // Fetch stale claims as warnings - filter by project if provided
      let staleQuery = supabase
        .from('agent_claimed_items')
        .select('*')
        .gt('claimed_minutes_ago', 30);

      if (projectId) {
        staleQuery = staleQuery.eq('project_id', projectId);
      }

      const { data: staleData } = await staleQuery;

      const alerts: SystemAlert[] = [];

      ((errorData || []) as ActivityFeedRow[]).forEach((row) => {
        alerts.push({
          id: `error-${row.id}`,
          type: 'error',
          title: 'Task Failed',
          message: `${row.agent_display_name || row.agent_instance_id} failed: ${row.error_message || 'Unknown error'}`,
          agentId: row.agent_instance_id,
          workItemId: row.work_item_id ?? undefined,
          timestamp: row.created_at,
          acknowledged: false,
        });
      });

      ((staleData || []) as ClaimedItemRow[]).forEach((row) => {
        alerts.push({
          id: `stale-${row.id}`,
          type: 'warning',
          title: 'Long Running Task',
          message: `"${row.title}" has been claimed for ${Math.round(row.claimed_minutes_ago)} minutes`,
          agentId: row.claimed_by_instance,
          workItemId: row.id,
          timestamp: row.claimed_at,
          acknowledged: false,
        });
      });

      set({ alerts });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  },

  acknowledgeAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ),
    }));
  },

  pauseAgent: async (agentId) => {
    try {
      if (!supabase) {
        // Demo mode - simulate pause
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === agentId ? { ...agent, status: 'idle' as const } : agent
          ),
        }));
        return true;
      }

      // In real implementation, this would send a signal to the agent
      // For now, we just update the status
      const updateData: AgentInstanceUpdate = { status: 'inactive' };
      const { error } = await supabase
        .from('agent_instances')
        .update(updateData as never)
        .eq('id', agentId);

      if (error) throw error;
      await get().fetchAgents();
      return true;
    } catch (error) {
      console.error('Failed to pause agent:', error);
      return false;
    }
  },

  resumeAgent: async (agentId) => {
    try {
      if (!supabase) {
        // Demo mode - simulate resume
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === agentId ? { ...agent, status: 'idle' as const } : agent
          ),
        }));
        return true;
      }

      const updateData: AgentInstanceUpdate = { status: 'active' };
      const { error } = await supabase
        .from('agent_instances')
        .update(updateData as never)
        .eq('id', agentId);

      if (error) throw error;
      await get().fetchAgents();
      return true;
    } catch (error) {
      console.error('Failed to resume agent:', error);
      return false;
    }
  },

  subscribeToUpdates: (projectId?: string) => {
    if (!supabase) {
      // Demo mode - no real subscription, but simulate updates
      const interval = setInterval(() => {
        set({ lastUpdated: new Date().toISOString() });
      }, 30000);
      return () => clearInterval(interval);
    }

    // Capture supabase reference for closure
    const sb = supabase;
    const channel = sb
      .channel('monitoring-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_instances',
        },
        () => get().fetchAgents(projectId)
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_activity',
        },
        () => {
          get().fetchRecentActivities(projectId);
          get().fetchAlerts(projectId);
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  },

  refreshAll: async (projectId?: string) => {
    await Promise.all([
      get().fetchAgents(projectId),
      get().fetchRecentActivities(projectId),
      get().fetchAlerts(projectId),
    ]);
  },
}));
