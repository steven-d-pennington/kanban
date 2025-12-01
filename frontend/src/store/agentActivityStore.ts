import { create } from 'zustand';
import type {
  AgentActivity,
  AgentInstance,
  ClaimedItem,
  AgentAction,
  AgentActivityStatus,
  AgentType,
} from '../types';
import { supabase } from '../lib/supabase';

interface ActivityFilters {
  workItemId?: string;
  agentType?: NonNullable<AgentType>;
  action?: AgentAction;
  status?: AgentActivityStatus;
  startDate?: string;
  endDate?: string;
  projectId?: string;
}

interface AgentActivityState {
  activities: AgentActivity[];
  agentInstances: AgentInstance[];
  claimedItems: ClaimedItem[];
  loading: boolean;
  error: string | null;
  filters: ActivityFilters;

  // Actions
  fetchActivities: (filters?: ActivityFilters) => Promise<void>;
  fetchAgentInstances: () => Promise<void>;
  fetchClaimedItems: () => Promise<void>;
  setFilters: (filters: Partial<ActivityFilters>) => void;
  clearFilters: () => void;
  subscribeToActivities: (projectId?: string) => () => void;
  forceReleaseItem: (workItemId: string, reason?: string) => Promise<boolean>;
  deactivateAgent: (instanceId: string) => Promise<boolean>;
  exportActivities: (format: 'csv' | 'json') => void;
}

// Map database snake_case to camelCase
const mapActivityFromDb = (row: Record<string, unknown>): AgentActivity => ({
  id: row.id as string,
  workItemId: row.work_item_id as string,
  workItemTitle: row.work_item_title as string | undefined,
  workItemType: row.work_item_type as AgentActivity['workItemType'],
  agentType: row.agent_type as AgentType,
  agentInstanceId: row.agent_instance_id as string,
  agentDisplayName: row.agent_display_name as string | undefined,
  action: row.action as AgentAction,
  details: (row.details as Record<string, unknown>) || {},
  durationMs: row.duration_ms as number | undefined,
  status: (row.status as AgentActivityStatus) || 'success',
  errorMessage: row.error_message as string | undefined,
  inputData: row.input_data as Record<string, unknown> | undefined,
  outputData: row.output_data as Record<string, unknown> | undefined,
  createdAt: row.created_at as string,
  projectId: row.project_id as string | undefined,
  projectName: row.project_name as string | undefined,
});

const mapAgentInstanceFromDb = (row: Record<string, unknown>): AgentInstance => ({
  id: row.id as string,
  agentType: row.agent_type as NonNullable<AgentType>,
  displayName: row.display_name as string,
  status: row.status as AgentInstance['status'],
  lastSeenAt: row.last_seen_at as string,
  createdAt: row.created_at as string,
});

const mapClaimedItemFromDb = (row: Record<string, unknown>): ClaimedItem => ({
  id: row.id as string,
  title: row.title as string,
  type: row.type as ClaimedItem['type'],
  priority: row.priority as ClaimedItem['priority'],
  assignedAgent: row.assigned_agent as NonNullable<AgentType>,
  claimedByInstance: row.claimed_by_instance as string,
  claimedAt: row.claimed_at as string,
  startedAt: row.started_at as string,
  projectId: row.project_id as string,
  projectName: row.project_name as string,
  claimedMinutesAgo: row.claimed_minutes_ago as number,
});

// Mock data for demo mode
const mockActivities: AgentActivity[] = [
  {
    id: 'activity-1',
    workItemId: 'item-1',
    workItemTitle: 'Implement user authentication',
    workItemType: 'story',
    agentType: 'developer',
    agentInstanceId: 'dev-agent-001',
    agentDisplayName: 'Developer Agent 1',
    action: 'claimed',
    details: { priority: 'high' },
    status: 'success',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    projectId: 'project-1',
    projectName: 'Main Project',
  },
  {
    id: 'activity-2',
    workItemId: 'item-1',
    workItemTitle: 'Implement user authentication',
    workItemType: 'story',
    agentType: 'developer',
    agentInstanceId: 'dev-agent-001',
    agentDisplayName: 'Developer Agent 1',
    action: 'processing',
    details: { step: 'analyzing requirements' },
    status: 'success',
    createdAt: new Date(Date.now() - 3000000).toISOString(),
    projectId: 'project-1',
    projectName: 'Main Project',
  },
  {
    id: 'activity-3',
    workItemId: 'item-2',
    workItemTitle: 'Create PRD for dashboard',
    workItemType: 'prd',
    agentType: 'scrum_master',
    agentInstanceId: 'sm-agent-001',
    agentDisplayName: 'Scrum Master Agent',
    action: 'handed_off',
    details: { childCount: 3 },
    durationMs: 45000,
    status: 'success',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    projectId: 'project-1',
    projectName: 'Main Project',
  },
];

const mockAgentInstances: AgentInstance[] = [
  {
    id: 'pm-agent-001',
    agentType: 'project_manager',
    displayName: 'Project Manager Agent',
    status: 'active',
    lastSeenAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'sm-agent-001',
    agentType: 'scrum_master',
    displayName: 'Scrum Master Agent',
    status: 'active',
    lastSeenAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'dev-agent-001',
    agentType: 'developer',
    displayName: 'Developer Agent 1',
    status: 'active',
    lastSeenAt: new Date(Date.now() - 60000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const mockClaimedItems: ClaimedItem[] = [
  {
    id: 'item-1',
    title: 'Implement user authentication',
    type: 'story',
    priority: 'high',
    assignedAgent: 'developer',
    claimedByInstance: 'dev-agent-001',
    claimedAt: new Date(Date.now() - 3600000).toISOString(),
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    projectId: 'project-1',
    projectName: 'Main Project',
    claimedMinutesAgo: 60,
  },
];

export const useAgentActivityStore = create<AgentActivityState>((set, get) => ({
  activities: mockActivities,
  agentInstances: mockAgentInstances,
  claimedItems: mockClaimedItems,
  loading: false,
  error: null,
  filters: {},

  fetchActivities: async (filters) => {
    set({ loading: true, error: null });

    try {
      // Check if Supabase is configured
      if (!supabase) {
        // Use mock data in demo mode
        let filtered = [...mockActivities];
        if (filters?.agentType) {
          filtered = filtered.filter((a) => a.agentType === filters.agentType);
        }
        if (filters?.action) {
          filtered = filtered.filter((a) => a.action === filters.action);
        }
        set({ activities: filtered, loading: false });
        return;
      }

      let query = supabase
        .from('agent_activity_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.workItemId) {
        query = query.eq('work_item_id', filters.workItemId);
      }
      if (filters?.agentType) {
        query = query.eq('agent_type', filters.agentType);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const activities = (data || []).map(mapActivityFromDb);
      set({ activities, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch activities',
        loading: false,
      });
    }
  },

  fetchAgentInstances: async () => {
    set({ loading: true, error: null });

    try {
      if (!supabase) {
        set({ agentInstances: mockAgentInstances, loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('agent_instances')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (error) throw error;

      const instances = (data || []).map(mapAgentInstanceFromDb);
      set({ agentInstances: instances, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch agent instances',
        loading: false,
      });
    }
  },

  fetchClaimedItems: async () => {
    set({ loading: true, error: null });

    try {
      if (!supabase) {
        set({ claimedItems: mockClaimedItems, loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('agent_claimed_items')
        .select('*')
        .order('claimed_at', { ascending: false });

      if (error) throw error;

      const items = (data || []).map(mapClaimedItemFromDb);
      set({ claimedItems: items, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch claimed items',
        loading: false,
      });
    }
  },

  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ filters: updatedFilters });
    get().fetchActivities(updatedFilters);
  },

  clearFilters: () => {
    set({ filters: {} });
    get().fetchActivities({});
  },

  subscribeToActivities: (projectId) => {
    if (!supabase) {
      // Demo mode - no real subscription
      return () => {};
    }

    const channel = supabase
      .channel('agent-activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_activity',
        },
        async (payload) => {
          // Fetch the full activity with joined data
          const { data } = await supabase
            .from('agent_activity_feed')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const activity = mapActivityFromDb(data);
            // Filter by project if specified
            if (!projectId || activity.projectId === projectId) {
              set((state) => ({
                activities: [activity, ...state.activities.slice(0, 99)],
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  forceReleaseItem: async (workItemId, reason = 'admin_force_release') => {
    try {
      if (!supabase) {
        // Demo mode - update local state
        set((state) => ({
          claimedItems: state.claimedItems.filter((item) => item.id !== workItemId),
        }));
        return true;
      }

      const { error } = await supabase.rpc('force_release_work_item', {
        p_work_item_id: workItemId,
        p_reason: reason,
      });

      if (error) throw error;

      // Refresh claimed items
      await get().fetchClaimedItems();
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to force release item',
      });
      return false;
    }
  },

  deactivateAgent: async (instanceId) => {
    try {
      if (!supabase) {
        // Demo mode - update local state
        set((state) => ({
          agentInstances: state.agentInstances.map((inst) =>
            inst.id === instanceId ? { ...inst, status: 'inactive' as const } : inst
          ),
        }));
        return true;
      }

      const { error } = await supabase.rpc('deactivate_agent_instance', {
        p_instance_id: instanceId,
      });

      if (error) throw error;

      // Refresh data
      await Promise.all([get().fetchAgentInstances(), get().fetchClaimedItems()]);
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to deactivate agent',
      });
      return false;
    }
  },

  exportActivities: (format) => {
    const { activities } = get();

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(activities, null, 2)], {
        type: 'application/json',
      });
      downloadBlob(blob, `agent-activities-${Date.now()}.json`);
    } else {
      // CSV format
      const headers = [
        'ID',
        'Work Item ID',
        'Work Item Title',
        'Agent Type',
        'Agent Instance',
        'Action',
        'Status',
        'Duration (ms)',
        'Error Message',
        'Created At',
      ];
      const rows = activities.map((a) => [
        a.id,
        a.workItemId,
        a.workItemTitle || '',
        a.agentType || '',
        a.agentInstanceId,
        a.action,
        a.status,
        a.durationMs?.toString() || '',
        a.errorMessage || '',
        a.createdAt,
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join(
        '\n'
      );
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadBlob(blob, `agent-activities-${Date.now()}.csv`);
    }
  },
}));

// Helper functions
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

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
