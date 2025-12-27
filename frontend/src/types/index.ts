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

export type AgentAction =
  | 'claimed'
  | 'processing'
  | 'completed'
  | 'handed_off'
  | 'failed'
  | 'released'
  | 'escalated'
  | 'retrying'
  | 'waiting'
  | 'started'
  | 'paused'
  | 'resumed';

export type AgentActivityStatus = 'success' | 'error' | 'warning';

export interface AgentActivity {
  id: string;
  workItemId: string;
  workItemTitle?: string;
  workItemType?: WorkItemType;
  agentType: AgentType;
  agentInstanceId: string;
  agentDisplayName?: string;
  action: AgentAction;
  details: Record<string, unknown>;
  durationMs?: number;
  status: AgentActivityStatus;
  errorMessage?: string;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  createdAt: string;
  projectId?: string;
  projectName?: string;
}

export interface AgentInstance {
  id: string;
  agentType: NonNullable<AgentType>;
  displayName: string;
  status: 'active' | 'inactive' | 'error';
  lastSeenAt: string;
  createdAt: string;
}

export interface HandoffRule {
  id: string;
  sourceType: WorkItemType;
  processedBy: NonNullable<AgentType>;
  outputType: string;
  createsTypes: WorkItemType[];
  validationRules: Record<string, unknown>;
  isActive: boolean;
}

export interface HandoffHistory {
  id: string;
  sourceWorkItemId: string;
  targetWorkItemIds: string[];
  fromAgentType: NonNullable<AgentType>;
  fromAgentInstance: string;
  toAgentType?: NonNullable<AgentType>;
  outputData?: Record<string, unknown>;
  validationPassed: boolean;
  validationErrors?: string[];
  handoffStatus: 'completed' | 'failed' | 'rolled_back';
  createdAt: string;
}

export interface ClaimedItem {
  id: string;
  title: string;
  type: WorkItemType;
  priority: Priority;
  assignedAgent: NonNullable<AgentType>;
  claimedByInstance: string;
  claimedAt: string;
  startedAt: string;
  projectId: string;
  projectName: string;
  claimedMinutesAgo: number;
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

export const AGENT_ACTION_CONFIG: Record<AgentAction, { label: string; color: string; icon: string }> = {
  claimed: { label: 'Claimed', color: 'text-blue-600', icon: '🎯' },
  processing: { label: 'Processing', color: 'text-yellow-600', icon: '⚙️' },
  completed: { label: 'Completed', color: 'text-green-600', icon: '✅' },
  handed_off: { label: 'Handed Off', color: 'text-purple-600', icon: '🤝' },
  failed: { label: 'Failed', color: 'text-red-600', icon: '❌' },
  released: { label: 'Released', color: 'text-gray-600', icon: '🔓' },
  escalated: { label: 'Escalated', color: 'text-orange-600', icon: '⚠️' },
  retrying: { label: 'Retrying', color: 'text-yellow-500', icon: '🔄' },
  waiting: { label: 'Waiting', color: 'text-gray-500', icon: '⏳' },
  started: { label: 'Started', color: 'text-blue-500', icon: '▶️' },
  paused: { label: 'Paused', color: 'text-gray-400', icon: '⏸️' },
  resumed: { label: 'Resumed', color: 'text-blue-400', icon: '▶️' },
};

export const AGENT_STATUS_CONFIG: Record<AgentActivityStatus, { label: string; color: string; bgColor: string }> = {
  success: { label: 'Success', color: 'text-green-700', bgColor: 'bg-green-100' },
  error: { label: 'Error', color: 'text-red-700', bgColor: 'bg-red-100' },
  warning: { label: 'Warning', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
};

export type MemoryType = 'decision' | 'pattern' | 'convention' | 'lesson' | 'architecture' | 'warning' | 'preference';

export interface ProjectMemory {
  id: string;
  projectId: string;
  memoryType: MemoryType;
  title: string;
  content: string;
  sourceWorkItemId?: string;
  createdByAgent?: string;
  createdByUser?: string;
  relevanceScore: number;
  isGlobal: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const MEMORY_TYPE_CONFIG: Record<MemoryType, { label: string; color: string; bgColor: string; icon: string }> = {
  decision: { label: 'Decision', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: '🎯' },
  pattern: { label: 'Pattern', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: '🔄' },
  convention: { label: 'Convention', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: '📋' },
  lesson: { label: 'Lesson', color: 'text-green-700', bgColor: 'bg-green-100', icon: '💡' },
  architecture: { label: 'Architecture', color: 'text-cyan-700', bgColor: 'bg-cyan-100', icon: '🏗️' },
  warning: { label: 'Warning', color: 'text-red-700', bgColor: 'bg-red-100', icon: '⚠️' },
  preference: { label: 'Preference', color: 'text-pink-700', bgColor: 'bg-pink-100', icon: '⭐' },
};
