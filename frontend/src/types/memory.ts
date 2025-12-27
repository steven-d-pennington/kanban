export type MemoryType =
  | 'decision'
  | 'pattern'
  | 'convention'
  | 'lesson'
  | 'architecture'
  | 'warning'
  | 'preference';

export interface ProjectMemory {
  id: string;
  projectId: string;
  memoryType: MemoryType;
  title: string;
  content: string;
  embedding?: number[] | null;
  sourceWorkItemId?: string | null;
  createdByAgent?: string | null;
  createdByUser?: string | null;
  relevanceScore: number;
  isGlobal: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryFormData {
  title: string;
  content: string;
  memoryType: MemoryType;
}
