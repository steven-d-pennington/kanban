import { create } from 'zustand';

export interface Agent {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'inactive';
  createdAt: Date;
  lastActivity?: Date;
}

interface AgentStore {
  agents: Agent[];
  pauseAgent: (id: string) => void;
  resumeAgent: (id: string) => void;
  getAgent: (id: string) => Agent | undefined;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: [],
  
  pauseAgent: (id: string) => {
    console.log(`Pausing agent with ID: ${id}`);
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id
          ? { ...agent, status: 'paused' as const, lastActivity: new Date() }
          : agent
      ),
    }));
  },

  resumeAgent: (id: string) => {
    console.log(`Resuming agent with ID: ${id}`);
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id
          ? { ...agent, status: 'active' as const, lastActivity: new Date() }
          : agent
      ),
    }));
  },

  getAgent: (id: string) => {
    return get().agents.find((agent) => agent.id === id);
  },
}));