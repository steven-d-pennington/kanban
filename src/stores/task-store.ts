import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  assigneeId?: string;
  assignedBy?: string;
  assignedAt?: Date;
}

export interface TaskFilter {
  status?: Task['status'];
  priority?: Task['priority'];
  assigneeId?: string;
  search?: string;
}

interface TaskState {
  tasks: Task[];
  filter: TaskFilter;
  selectedTaskId: string | null;
}

interface TaskActions {
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  assignTask: (taskId: string, assigneeId: string, assignedBy: string) => void;
  unassignTask: (taskId: string) => void;
  setFilter: (filter: Partial<TaskFilter>) => void;
  clearFilter: () => void;
  setSelectedTask: (id: string | null) => void;
  getTaskById: (id: string) => Task | undefined;
  getFilteredTasks: () => Task[];
  getTasksByAssignee: (assigneeId: string) => Task[];
  getTasksByStatus: (status: Task['status']) => Task[];
}

type TaskStore = TaskState & TaskActions;

const initialState: TaskState = {
  tasks: [],
  filter: {},
  selectedTaskId: null,
};

export const useTaskStore = create<TaskStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        addTask: (taskData) => {
          const newTask: Task = {
            ...taskData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          set((state) => ({
            tasks: [...state.tasks, newTask],
          }));
        },
        
        updateTask: (id, updates) => {
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === id
                ? {
                    ...task,
                    ...updates,
                    updatedAt: new Date(),
                    // Preserve assignment data when updating other fields
                    assigneeId: updates.assigneeId ?? task.assigneeId,
                    assignedBy: updates.assignedBy ?? task.assignedBy,
                    assignedAt: updates.assignedAt ?? task.assignedAt,
                  }
                : task
            ),
          }));
        },
        
        deleteTask: (id) => {
          set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== id),
            selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
          }));
        },
        
        assignTask: (taskId, assigneeId, assignedBy) => {
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    assigneeId,
                    assignedBy,
                    assignedAt: new Date(),
                    updatedAt: new Date(),
                  }
                : task
            ),
          }));
        },
        
        unassignTask: (taskId) => {
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    assigneeId: undefined,
                    assignedBy: undefined,
                    assignedAt: undefined,
                    updatedAt: new Date(),
                  }
                : task
            ),
          }));
        },
        
        setFilter: (filter) => {
          set((state) => ({
            filter: { ...state.filter, ...filter },
          }));
        },
        
        clearFilter: () => {
          set(() => ({ filter: {} }));
        },
        
        setSelectedTask: (id) => {
          set(() => ({ selectedTaskId: id }));
        },
        
        getTaskById: (id) => {
          return get().tasks.find((task) => task.id === id);
        },
        
        getFilteredTasks: () => {
          const { tasks, filter } = get();
          
          return tasks.filter((task) => {
            const matchesStatus = !filter.status || task.status === filter.status;
            const matchesPriority = !filter.priority || task.priority === filter.priority;
            const matchesAssignee = !filter.assigneeId || task.assigneeId === filter.assigneeId;
            const matchesSearch = !filter.search || 
              task.title.toLowerCase().includes(filter.search.toLowerCase()) ||
              task.description?.toLowerCase().includes(filter.search.toLowerCase());
            
            return matchesStatus && matchesPriority && matchesAssignee && matchesSearch;
          });
        },
        
        getTasksByAssignee: (assigneeId) => {
          return get().tasks.filter((task) => task.assigneeId === assigneeId);
        },
        
        getTasksByStatus: (status) => {
          return get().tasks.filter((task) => task.status === status);
        },
      }),
      {
        name: 'task-store',
        partialize: (state) => ({
          tasks: state.tasks,
          filter: state.filter,
        }),
      }
    ),
    {
      name: 'TaskStore',
    }
  )
);