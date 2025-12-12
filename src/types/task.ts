export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  assigneeId?: string;
  assignedBy?: string;
  assignedAt?: Date;
}

export interface TaskFilter {
  status?: Task['status'];
  priority?: Task['priority'];
  assigneeId?: string;
  tags?: string[];
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
}

export type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export type TaskUpdate = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> & {
  updatedAt: Date;
};