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
  isCreateProjectModalOpen: boolean;
  isProjectSettingsOpen: boolean;
  filterType: WorkItemType | 'all';
  filterPriority: Priority | 'all';
  filterAssignee: string | 'all';

  // Actions
  setCurrentProject: (projectId: string) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCreateProjectModalOpen: (open: boolean) => void;
  setProjectSettingsOpen: (open: boolean) => void;
  setSelectedWorkItem: (item: WorkItem | null) => void;
  setCreateModalOpen: (open: boolean) => void;
  setFilterType: (type: WorkItemType | 'all') => void;
  setFilterPriority: (priority: Priority | 'all') => void;
  setFilterAssignee: (assignee: string | 'all') => void;
  moveWorkItem: (itemId: string, newStatus: Status) => void;
  addWorkItem: (item: Omit<WorkItem, 'id' | 'createdAt' | 'updatedAt' | 'columnOrder'>) => void;
  updateWorkItem: (id: string, updates: Partial<WorkItem>) => void;
  deleteWorkItem: (id: string) => void;
  duplicateWorkItem: (id: string) => WorkItem | null;
  reorderWorkItems: (status: Status, orderedIds: string[]) => void;
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
  isCreateProjectModalOpen: false,
  isProjectSettingsOpen: false,
  filterType: 'all',
  filterPriority: 'all',
  filterAssignee: 'all',

  setCurrentProject: (projectId) => set({ currentProjectId: projectId }),

  addProject: (projectData) => {
    const newProject: Project = {
      ...projectData,
      id: `project-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      projects: [...state.projects, newProject],
      currentProjectId: newProject.id,
    }));
    return newProject;
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id
          ? { ...project, ...updates, updatedAt: new Date().toISOString() }
          : project
      ),
    }));
  },

  deleteProject: (id) => {
    const state = get();
    const remainingProjects = state.projects.filter((p) => p.id !== id);
    set({
      projects: remainingProjects,
      currentProjectId:
        state.currentProjectId === id
          ? remainingProjects[0]?.id || null
          : state.currentProjectId,
      workItems: state.workItems.filter((item) => item.projectId !== id),
    });
  },

  setCreateProjectModalOpen: (open) => set({ isCreateProjectModalOpen: open }),

  setProjectSettingsOpen: (open) => set({ isProjectSettingsOpen: open }),

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
      // Also update selectedWorkItem if it's the one being updated
      selectedWorkItem:
        state.selectedWorkItem?.id === id
          ? { ...state.selectedWorkItem, ...updates, updatedAt: new Date().toISOString() }
          : state.selectedWorkItem,
    }));
  },

  deleteWorkItem: (id) => {
    set((state) => ({
      workItems: state.workItems.filter((item) => item.id !== id),
      // Clear selection if the deleted item was selected
      selectedWorkItem: state.selectedWorkItem?.id === id ? null : state.selectedWorkItem,
    }));
  },

  duplicateWorkItem: (id) => {
    const item = get().workItems.find((i) => i.id === id);
    if (!item) return null;

    const newItem: WorkItem = {
      ...item,
      id: `item-${Date.now()}`,
      title: `${item.title} (Copy)`,
      status: 'backlog',
      columnOrder: get().workItems.filter((i) => i.status === 'backlog').length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: undefined,
      completedAt: undefined,
      assignedTo: undefined,
      assignedAgent: undefined,
    };

    set((state) => ({ workItems: [...state.workItems, newItem] }));
    return newItem;
  },

  reorderWorkItems: (status, orderedIds) => {
    set((state) => ({
      workItems: state.workItems.map((item) => {
        if (item.status !== status) return item;
        const newOrder = orderedIds.indexOf(item.id);
        if (newOrder === -1) return item;
        return {
          ...item,
          columnOrder: newOrder,
          updatedAt: new Date().toISOString(),
        };
      }),
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
    return get()
      .getFilteredItems()
      .filter((item) => item.status === status)
      .sort((a, b) => a.columnOrder - b.columnOrder);
  },
}));
