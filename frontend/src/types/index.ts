export type WorkItemType = 'project_spec' | 'feature' | 'prd' | 'story' | 'bug' | 'task';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Status = 'backlog' | 'ready' | 'in_progress' | 'review' | 'testing' | 'done';
export type AgentType = 'project_manager' | 'scrum_master' | 'developer' | null;

export interface WorkItem {
  id: string;
  projectId: string;
  parentId?: string;
  title: string;
  description: string;
  type: WorkItemType;
  priority: Priority;
  status: Status;
  columnOrder: number;
  assignedTo?: string;
  assignedAgent?: AgentType;
  storyPoints?: number;
  dueDate?: string;
  labels: string[];
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentActivity {
  id: string;
  workItemId: string;
  agentType: AgentType;
  agentInstanceId: string;
  action: 'claimed' | 'processing' | 'completed' | 'handed_off' | 'failed';
  details: Record<string, unknown>;
  createdAt: string;
}

export interface Comment {
  id: string;
  workItemId: string;
  authorId?: string;
  authorAgent?: AgentType;
  content: string;
  isSystemMessage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface ActiveAgent {
  agentType: AgentType;
  instanceId: string;
  currentWorkItemId?: string;
  status: 'idle' | 'processing' | 'error';
  lastActivity: string;
}

export const COLUMNS: { id: Status; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'ready', title: 'Ready' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'testing', title: 'Testing' },
  { id: 'done', title: 'Done' },
];

export const ITEM_TYPE_CONFIG: Record<WorkItemType, { label: string; color: string; bgColor: string }> = {
  project_spec: { label: 'Project Spec', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  feature: { label: 'Feature', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  prd: { label: 'PRD', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  story: { label: 'Story', color: 'text-green-700', bgColor: 'bg-green-100' },
  bug: { label: 'Bug', color: 'text-red-700', bgColor: 'bg-red-100' },
  task: { label: 'Task', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; icon: string }> = {
  critical: { label: 'Critical', color: 'text-red-600', icon: '!!!' },
  high: { label: 'High', color: 'text-orange-500', icon: '!!' },
  medium: { label: 'Medium', color: 'text-yellow-500', icon: '!' },
  low: { label: 'Low', color: 'text-gray-400', icon: '-' },
};

export const AGENT_CONFIG: Record<NonNullable<AgentType>, { label: string; color: string; bgColor: string }> = {
  project_manager: { label: 'PM Agent', color: 'text-violet-700', bgColor: 'bg-violet-100' },
  scrum_master: { label: 'SM Agent', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  developer: { label: 'Dev Agent', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
};
