import { create } from 'zustand';
import type { WorkItem, Project, ActiveAgent, Status, WorkItemType, Priority } from '../types';
import { mockWorkItems, mockProjects, mockActiveAgents } from '../data/mockData';

interface KanbanState {
  projects: Project[];
  currentProjectId: string | null;
  workItems: WorkItem[];
  activeAgents: ActiveAgent[];
  selectedWorkItem: WorkItem | null;
  isCreateModalOpen: boolean;
  filterType: WorkItemType | 'all';
  filterPriority: Priority | 'all';
  filterAssignee: string | 'all';

  // Actions
  setCurrentProject: (projectId: string) => void;
  setSelectedWorkItem: (item: WorkItem | null) => void;
  setCreateModalOpen: (open: boolean) => void;
  setFilterType: (type: WorkItemType | 'all') => void;
  setFilterPriority: (priority: Priority | 'all') => void;
  setFilterAssignee: (assignee: string | 'all') => void;
  moveWorkItem: (itemId: string, newStatus: Status) => void;
  addWorkItem: (item: Omit<WorkItem, 'id' | 'createdAt' | 'updatedAt' | 'columnOrder'>) => void;
  updateWorkItem: (id: string, updates: Partial<WorkItem>) => void;
  getFilteredItems: () => WorkItem[];
  getItemsByStatus: (status: Status) => WorkItem[];
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  projects: mockProjects,
  currentProjectId: mockProjects[0]?.id || null,
  workItems: mockWorkItems,
  activeAgents: mockActiveAgents,
  selectedWorkItem: null,
  isCreateModalOpen: false,
  filterType: 'all',
  filterPriority: 'all',
  filterAssignee: 'all',

  setCurrentProject: (projectId) => set({ currentProjectId: projectId }),

  setSelectedWorkItem: (item) => set({ selectedWorkItem: item }),

  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),

  setFilterType: (type) => set({ filterType: type }),

  setFilterPriority: (priority) => set({ filterPriority: priority }),

  setFilterAssignee: (assignee) => set({ filterAssignee: assignee }),

  moveWorkItem: (itemId, newStatus) => {
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
  },

  addWorkItem: (itemData) => {
    const newItem: WorkItem = {
      ...itemData,
      id: `item-${Date.now()}`,
      columnOrder: get().workItems.filter((i) => i.status === itemData.status).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ workItems: [...state.workItems, newItem] }));
  },

  updateWorkItem: (id, updates) => {
    set((state) => ({
      workItems: state.workItems.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      ),
    }));
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
    return get().getFilteredItems().filter((item) => item.status === status);
  },
}));
