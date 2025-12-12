import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { WorkItem, Project, ActiveAgent, Status, WorkItemType, Priority, Comment } from '../types';
import type { Database } from '../types/database';

type DbWorkItem = Database['public']['Tables']['work_items']['Row'];
type DbProject = Database['public']['Tables']['projects']['Row'];

interface KanbanState {
  projects: Project[];
  currentProjectId: string | null;
  workItems: WorkItem[];
  activeAgents: ActiveAgent[];
  selectedWorkItem: WorkItem | null;
  isCreateModalOpen: boolean;
  isCreateProjectModalOpen: boolean;
  isProjectSettingsOpen: boolean;
  filterType: WorkItemType | 'all';
  filterPriority: Priority | 'all';
  filterAssignee: string | 'all';
  comments: Comment[];
  loading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  setCurrentProject: (projectId: string) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCreateProjectModalOpen: (open: boolean) => void;
  setProjectSettingsOpen: (open: boolean) => void;
  setSelectedWorkItem: (item: WorkItem | null) => void;
  setCreateModalOpen: (open: boolean) => void;
  setFilterType: (type: WorkItemType | 'all') => void;
  setFilterPriority: (priority: Priority | 'all') => void;
  setFilterAssignee: (assignee: string | 'all') => void;
  moveWorkItem: (itemId: string, newStatus: Status) => Promise<void>;
  addWorkItem: (item: Omit<WorkItem, 'id' | 'createdAt' | 'updatedAt' | 'columnOrder' | 'createdBy'>) => Promise<void>;
  updateWorkItem: (id: string, updates: Partial<WorkItem>) => Promise<void>;
  deleteWorkItem: (id: string) => Promise<void>;
  duplicateWorkItem: (id: string) => Promise<WorkItem | null>;
  reorderWorkItems: (status: Status, orderedIds: string[]) => Promise<void>;
  getFilteredItems: () => WorkItem[];
  getItemsByStatus: (status: Status) => WorkItem[];
  fetchComments: (workItemId: string) => Promise<void>;
  addComment: (workItemId: string, content: string) => Promise<void>;
}

const mapCommentFromDb = (c: any): Comment => ({
  id: c.id,
  workItemId: c.work_item_id,
  authorId: c.author_id,
  authorAgent: c.agent_type,
  content: c.content,
  isSystemMessage: c.is_system_message || false,
  createdAt: c.created_at,
  updatedAt: c.updated_at,
});

// Mapper functions
const mapProjectFromDb = (p: DbProject): Project => ({
  id: p.id,
  name: p.name,
  description: p.description || '',
  status: p.status as Project['status'],
  createdBy: p.created_by || '',
  createdAt: p.created_at,
  updatedAt: p.updated_at,
});

const mapWorkItemFromDb = (wi: DbWorkItem): WorkItem => ({
  id: wi.id,
  projectId: wi.project_id,
  parentId: wi.parent_id || undefined,
  title: wi.title,
  description: wi.description || '',
  type: wi.type as WorkItemType,
  priority: wi.priority as Priority,
  status: wi.status as Status,
  columnOrder: wi.column_order,
  assignedTo: wi.assigned_to || undefined,
  assignedAgent: (wi.assigned_agent as any) || undefined,
  storyPoints: wi.story_points || undefined,
  dueDate: wi.due_date || undefined,
  labels: Array.isArray(wi.labels) ? (wi.labels as string[]) : [],
  metadata: (wi.metadata as Record<string, unknown>) || {},
  createdBy: wi.created_by || '',
  createdAt: wi.created_at,
  updatedAt: wi.updated_at,
  startedAt: wi.started_at || undefined,
  completedAt: wi.completed_at || undefined,
});

export const useKanbanStore = create<KanbanState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  workItems: [],
  activeAgents: [], // TODO: wired up to agent_instances/activity if needed
  selectedWorkItem: null,
  isCreateModalOpen: false,
  isCreateProjectModalOpen: false,
  isProjectSettingsOpen: false,
  filterType: 'all',
  filterPriority: 'all',
  filterAssignee: 'all',
  comments: [],
  loading: false,
  error: null,

  initialize: async () => {
    if (!supabase) return;
    set({ loading: true, error: null });
    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await (supabase as any)
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const projects = (projectsData || []).map(mapProjectFromDb);

      // If we have projects but no current project, set the first one
      let currentProjectId = get().currentProjectId;
      if (!currentProjectId && projects.length > 0) {
        currentProjectId = projects[0].id;
      }

      set({ projects, currentProjectId });

      // Fetch work items if we have a project
      if (currentProjectId) {
        const { data: itemsData, error: itemsError } = await (supabase as any)
          .from('work_items')
          .select('*')
          .eq('project_id', currentProjectId)
          .order('column_order', { ascending: true });

        if (itemsError) throw itemsError;

        const workItems = (itemsData || []).map(mapWorkItemFromDb);
        set({ workItems });
      } else {
        set({ workItems: [] });
      }
    } catch (err: any) {
      console.error('Failed to initialize kanban store:', err);
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  setCurrentProject: (projectId) => {
    set({ currentProjectId: projectId });
    // Refetch items for this project
    const fetchItems = async () => {
      if (!supabase) return;
      set({ loading: true });
      try {
        const { data, error } = await (supabase as any)
          .from('work_items')
          .select('*')
          .eq('project_id', projectId)
          .order('column_order', { ascending: true });

        if (error) throw error;
        set({ workItems: (data || []).map(mapWorkItemFromDb) });
      } catch (err: any) {
        set({ error: err.message });
      } finally {
        set({ loading: false });
      }
    };
    fetchItems();
  },

  addProject: async (projectData) => {
    if (!supabase) return null;
    set({ loading: true });
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await (supabase as any)
        .from('projects')
        .insert({
          name: projectData.name,
          description: projectData.description,
          status: projectData.status,
          created_by: userData.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      const newProject = mapProjectFromDb(data);
      set((state) => ({
        projects: [newProject, ...state.projects],
        currentProjectId: newProject.id,
        workItems: [] // New project has no items
      }));
      return newProject;
    } catch (err: any) {
      set({ error: err.message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateProject: async (id, updates) => {
    if (!supabase) return;
    try {
      // Map updates to DB format
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const { data, error } = await (supabase as any)
        .from('projects')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        projects: state.projects.map((p) => p.id === id ? mapProjectFromDb(data) : p)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteProject: async (id) => {
    if (!supabase) return;
    try {
      const { error } = await (supabase as any)
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const state = get();
      const remainingProjects = state.projects.filter((p) => p.id !== id);
      const nextProject = remainingProjects[0]?.id || null;

      set({
        projects: remainingProjects,
        currentProjectId: nextProject,
      });

      if (nextProject) {
        get().setCurrentProject(nextProject);
      } else {
        set({ workItems: [] });
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  setCreateProjectModalOpen: (open) => set({ isCreateProjectModalOpen: open }),
  setProjectSettingsOpen: (open) => set({ isProjectSettingsOpen: open }),
  setSelectedWorkItem: (item) => set({ selectedWorkItem: item }),
  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setFilterType: (type) => set({ filterType: type }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setFilterAssignee: (assignee) => set({ filterAssignee: assignee }),

  moveWorkItem: async (itemId, newStatus) => {
    if (!supabase) return;

    // Optimistic update
    const previousState = get().workItems;
    set((state) => ({
      workItems: state.workItems.map((item) =>
        item.id === itemId
          ? {
            ...item,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            startedAt: newStatus === 'in_progress' && !item.startedAt ? new Date().toISOString() : item.startedAt,
            completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
          }
          : item
      ),
    }));

    try {
      const item = get().workItems.find(i => i.id === itemId);
      if (!item) return;

      const dbUpdates: any = {
        status: newStatus,
        column_order: item.columnOrder // Should probably recalculate proper order, but simple move for now
      };

      if (newStatus === 'in_progress' && !item.startedAt) {
        dbUpdates.started_at = new Date().toISOString();
      }
      if (newStatus === 'done') {
        dbUpdates.completed_at = new Date().toISOString();
      }

      const { error } = await (supabase as any)
        .from('work_items')
        .update(dbUpdates)
        .eq('id', itemId);

      if (error) throw error;
    } catch (err: any) {
      // Revert on error
      set({ workItems: previousState, error: err.message });
    }
  },

  addWorkItem: async (itemData) => {
    if (!supabase) return;
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentProject = get().currentProjectId;
      if (!currentProject) throw new Error("No project selected");

      // Calculate column order
      const itemsInStatus = get().workItems.filter(i => i.status === itemData.status);
      const columnOrder = itemsInStatus.length;

      const { data, error } = await (supabase as any)
        .from('work_items')
        .insert({
          project_id: currentProject,
          title: itemData.title,
          description: itemData.description,
          type: itemData.type,
          priority: itemData.priority,
          status: itemData.status,
          column_order: columnOrder,
          story_points: itemData.storyPoints,
          assigned_to: itemData.assignedTo,
          assigned_agent: itemData.assignedAgent,
          labels: itemData.labels,
          metadata: itemData.metadata || {},
          created_by: userData.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      const newItem = mapWorkItemFromDb(data);
      set((state) => ({ workItems: [...state.workItems, newItem] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateWorkItem: async (id, updates) => {
    if (!supabase) return;

    // Optimistic update
    set((state) => ({
      workItems: state.workItems.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      ),
    }));

    try {
      // Map updates to DB keys
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
      if (updates.assignedAgent !== undefined) dbUpdates.assigned_agent = updates.assignedAgent;
      if (updates.storyPoints !== undefined) dbUpdates.story_points = updates.storyPoints;

      const { data, error } = await (supabase as any)
        .from('work_items')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update with server data to be sure
      const updatedItem = mapWorkItemFromDb(data);
      set((state) => ({
        workItems: state.workItems.map((item) =>
          item.id === id ? updatedItem : item
        ),
        selectedWorkItem: state.selectedWorkItem?.id === id ? updatedItem : state.selectedWorkItem
      }));

    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteWorkItem: async (id) => {
    if (!supabase) return;
    const previousItems = get().workItems;
    set((state) => ({
      workItems: state.workItems.filter((item) => item.id !== id),
      selectedWorkItem: state.selectedWorkItem?.id === id ? null : state.selectedWorkItem,
    }));

    try {
      const { error } = await (supabase as any)
        .from('work_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      set({ workItems: previousItems, error: err.message });
    }
  },

  duplicateWorkItem: async (id) => {
    if (!supabase) return null;
    const item = get().workItems.find((i) => i.id === id);
    if (!item) return null;

    try {
      const { data: userData } = await supabase.auth.getUser();
      // Get count for backlog to put it at the end
      const backlogCount = get().workItems.filter(i => i.status === 'backlog').length;

      const { data, error } = await (supabase as any)
        .from('work_items')
        .insert({
          project_id: item.projectId,
          title: `${item.title} (Copy)`,
          description: item.description,
          type: item.type,
          priority: item.priority,
          status: 'backlog',
          column_order: backlogCount,
          story_points: item.storyPoints,
          labels: item.labels,
          metadata: item.metadata,
          created_by: userData.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      const newItem = mapWorkItemFromDb(data);
      set((state) => ({ workItems: [...state.workItems, newItem] }));
      return newItem;
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },

  reorderWorkItems: async (status, orderedIds) => {
    if (!supabase) return;

    // Optimistic update
    set((state) => ({
      workItems: state.workItems.map((item) => {
        if (item.status !== status) return item;
        const newOrder = orderedIds.indexOf(item.id);
        if (newOrder === -1) return item;
        return {
          ...item,
          columnOrder: newOrder,
        };
      }),
    }));

    try {
      // Create updates for all affected items
      // This is not efficient for large lists but fine for Kanban columns
      const updates = orderedIds.map((id, index) => ({
        id: id,
        column_order: index,
        updated_at: new Date().toISOString()
      }));

      // Supabase supports upsert for bulk updates
      const { error } = await (supabase as any)
        .from('work_items')
        .upsert(updates)
        .select();

      if (error) throw error;
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  getFilteredItems: () => {
    const state = get();
    return state.workItems.filter((item) => {
      if (state.currentProjectId && item.projectId !== state.currentProjectId) return false;
      if (state.filterType !== 'all' && item.type !== state.filterType) return false;
      if (state.filterPriority !== 'all' && item.priority !== state.filterPriority) return false;
      if (state.filterAssignee !== 'all') {
        if (state.filterAssignee === 'agent' && !item.assignedAgent) return false;
        if (state.filterAssignee === 'human' && item.assignedAgent) return false;
      }
      return true;
    });
  },

  getItemsByStatus: (status) => {
    return get()
      .getFilteredItems()
      .filter((item) => item.status === status)
      .sort((a, b) => a.columnOrder - b.columnOrder);
  },

  fetchComments: async (workItemId) => {
    if (!supabase) return;
    try {
      const { data, error } = await (supabase as any)
        .from('comments')
        .select('*')
        .eq('work_item_id', workItemId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ comments: (data || []).map(mapCommentFromDb) });
    } catch (err: any) {
      console.error('Failed to fetch comments:', err);
    }
  },

  addComment: async (workItemId, content) => {
    if (!supabase) return;
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await (supabase as any)
        .from('comments')
        .insert({
          work_item_id: workItemId,
          content,
          author_id: userData.user?.id,
          is_system_message: false
        })
        .select()
        .single();

      if (error) throw error;

      const newComment = mapCommentFromDb(data);
      set((state) => ({ comments: [...state.comments, newComment] }));
    } catch (err: any) {
      console.error('Failed to add comment:', err);
      throw err;
    }
  },
}));
