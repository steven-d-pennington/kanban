import { create } from 'zustand';
import { logger } from '../utils/logger';

export interface Agent {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'stopped';
  lastActivity: Date;
  type: string;
  config: Record<string, any>;
}

interface AgentStore {
  agents: Agent[];
  selectedAgent: Agent | null;
  addAgent: (agent: Omit<Agent, 'id' | 'lastActivity'>) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  pauseAgent: (id: string) => void;
  resumeAgent: (id: string) => void;
  stopAgent: (id: string) => void;
  selectAgent: (agent: Agent | null) => void;
  getAgentById: (id: string) => Agent | undefined;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: [],
  selectedAgent: null,

  addAgent: (agentData) => {
    const newAgent: Agent = {
      ...agentData,
      id: crypto.randomUUID(),
      lastActivity: new Date(),
    };

    set((state) => ({
      agents: [...state.agents, newAgent],
    }));

    logger.logAgentAction({
      action: 'agent_created',
      agentId: newAgent.id,
      agentName: newAgent.name,
      timestamp: new Date(),
      context: {
        type: newAgent.type,
        status: newAgent.status,
      },
    });
  },

  updateAgent: (id, updates) => {
    const agent = get().getAgentById(id);
    if (!agent) return;

    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id
          ? { ...agent, ...updates, lastActivity: new Date() }
          : agent
      ),
    }));

    logger.logAgentAction({
      action: 'agent_updated',
      agentId: id,
      agentName: agent.name,
      timestamp: new Date(),
      context: {
        updates,
        previousStatus: agent.status,
      },
    });
  },

  removeAgent: (id) => {
    const agent = get().getAgentById(id);
    if (!agent) return;

    set((state) => ({
      agents: state.agents.filter((agent) => agent.id !== id),
      selectedAgent: state.selectedAgent?.id === id ? null : state.selectedAgent,
    }));

    logger.logAgentAction({
      action: 'agent_removed',
      agentId: id,
      agentName: agent.name,
      timestamp: new Date(),
      context: {
        previousStatus: agent.status,
        type: agent.type,
      },
    });
  },

  pauseAgent: (id) => {
    const agent = get().getAgentById(id);
    if (!agent) return;

    const previousStatus = agent.status;

    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id
          ? { ...agent, status: 'paused' as const, lastActivity: new Date() }
          : agent
      ),
    }));

    logger.logAgentAction({
      action: 'agent_paused',
      agentId: id,
      agentName: agent.name,
      timestamp: new Date(),
      context: {
        previousStatus,
        newStatus: 'paused',
        type: agent.type,
      },
    });
  },

  resumeAgent: (id) => {
    const agent = get().getAgentById(id);
    if (!agent) return;

    const previousStatus = agent.status;

    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id
          ? { ...agent, status: 'active' as const, lastActivity: new Date() }
          : agent
      ),
    }));

    logger.logAgentAction({
      action: 'agent_resumed',
      agentId: id,
      agentName: agent.name,
      timestamp: new Date(),
      context: {
        previousStatus,
        newStatus: 'active',
        type: agent.type,
      },
    });
  },

  stopAgent: (id) => {
    const agent = get().getAgentById(id);
    if (!agent) return;

    const previousStatus = agent.status;

    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id
          ? { ...agent, status: 'stopped' as const, lastActivity: new Date() }
          : agent
      ),
    }));

    logger.logAgentAction({
      action: 'agent_stopped',
      agentId: id,
      agentName: agent.name,
      timestamp: new Date(),
      context: {
        previousStatus,
        newStatus: 'stopped',
        type: agent.type,
      },
    });
  },

  selectAgent: (agent) => {
    set({ selectedAgent: agent });
  },

  getAgentById: (id) => {
    return get().agents.find((agent) => agent.id === id);
  },
}));