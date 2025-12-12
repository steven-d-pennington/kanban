export interface Agent {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'stopped';
  lastActivity?: Date;
}

export interface AgentAction {
  type: 'pause' | 'resume' | 'stop';
  agentId: string;
  timestamp: Date;
}

export type AgentStatus = Agent['status'];

export type AgentActionType = AgentAction['type'];