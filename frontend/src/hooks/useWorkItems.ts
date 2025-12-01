import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { WorkItem, Status } from '../types';
import { mockWorkItems } from '../data/mockData';

interface DbWorkItem {
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  column_order: number;
  assigned_to: string | null;
  assigned_agent: string | null;
  story_points: number | null;
  due_date: string | null;
  labels: unknown;
  metadata: unknown;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

function mapDbToWorkItem(item: DbWorkItem): WorkItem {
  return {
    id: item.id,
    projectId: item.project_id,
    parentId: item.parent_id || undefined,
    title: item.title,
    description: item.description || '',
    type: item.type as WorkItem['type'],
    priority: item.priority as WorkItem['priority'],
    status: item.status as WorkItem['status'],
    columnOrder: item.column_order,
    assignedTo: item.assigned_to || undefined,
    assignedAgent: item.assigned_agent as WorkItem['assignedAgent'],
    storyPoints: item.story_points || undefined,
    dueDate: item.due_date || undefined,
    labels: (item.labels as string[]) || [],
    metadata: (item.metadata as Record<string, unknown>) || {},
    createdBy: item.created_by || '',
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    startedAt: item.started_at || undefined,
    completedAt: item.completed_at || undefined,
  };
}

export function useWorkItems(projectId: string | null) {
  const [workItems, setWorkItems] = useState<WorkItem[]>(mockWorkItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkItems = useCallback(async () => {
    if (!projectId) {
      return;
    }

    if (!isSupabaseConfigured() || !supabase) {
      // Filter mock data by project
      setWorkItems(mockWorkItems.filter((item) => item.projectId === projectId));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('work_items')
        .select('*')
        .eq('project_id', projectId)
        .order('column_order', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const mappedItems = ((data || []) as DbWorkItem[]).map(mapDbToWorkItem);
      setWorkItems(mappedItems.length > 0 ? mappedItems : mockWorkItems.filter((item) => item.projectId === projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch work items');
      setWorkItems(mockWorkItems.filter((item) => item.projectId === projectId));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createWorkItem = useCallback(
    async (itemData: Omit<WorkItem, 'id' | 'createdAt' | 'updatedAt' | 'columnOrder'>) => {
      if (!isSupabaseConfigured() || !supabase) {
        // Mock mode
        const newItem: WorkItem = {
          ...itemData,
          id: `item-${Date.now()}`,
          columnOrder: workItems.filter((i) => i.status === itemData.status).length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setWorkItems((prev) => [...prev, newItem]);
        return newItem;
      }

      const insertData = {
        project_id: itemData.projectId,
        parent_id: itemData.parentId || null,
        title: itemData.title,
        description: itemData.description,
        type: itemData.type,
        priority: itemData.priority,
        status: itemData.status,
        assigned_to: itemData.assignedTo || null,
        assigned_agent: itemData.assignedAgent || null,
        story_points: itemData.storyPoints || null,
        due_date: itemData.dueDate || null,
        labels: itemData.labels,
        metadata: itemData.metadata,
      };

      const { data, error: createError } = await supabase
        .from('work_items')
        .insert(insertData as never)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      const newItem = mapDbToWorkItem(data as DbWorkItem);
      setWorkItems((prev) => [...prev, newItem]);
      return newItem;
    },
    [workItems]
  );

  const updateWorkItem = useCallback(async (id: string, updates: Partial<WorkItem>) => {
    if (!isSupabaseConfigured() || !supabase) {
      // Mock mode
      setWorkItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
        )
      );
      return;
    }

    const dbUpdates: Record<string, unknown> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.storyPoints !== undefined) dbUpdates.story_points = updates.storyPoints;
    if (updates.assignedAgent !== undefined) dbUpdates.assigned_agent = updates.assignedAgent;
    if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

    const { error: updateError } = await supabase
      .from('work_items')
      .update(dbUpdates as never)
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    setWorkItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      )
    );
  }, []);

  const moveWorkItem = useCallback(
    async (itemId: string, newStatus: Status) => {
      const item = workItems.find((i) => i.id === itemId);
      if (!item) return;

      const updates: Partial<WorkItem> = {
        status: newStatus,
        startedAt: newStatus === 'in_progress' && !item.startedAt ? new Date().toISOString() : item.startedAt,
        completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
      };

      await updateWorkItem(itemId, updates);
    },
    [workItems, updateWorkItem]
  );

  const deleteWorkItem = useCallback(async (id: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      // Mock mode
      setWorkItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }

    const { error: deleteError } = await supabase.from('work_items').delete().eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    setWorkItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    fetchWorkItems();
  }, [fetchWorkItems]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !projectId) {
      return;
    }

    const client = supabase;
    const channel = client
      .channel(`work-items-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_items',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchWorkItems();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [projectId, fetchWorkItems]);

  return {
    workItems,
    loading,
    error,
    fetchWorkItems,
    createWorkItem,
    updateWorkItem,
    moveWorkItem,
    deleteWorkItem,
  };
}
