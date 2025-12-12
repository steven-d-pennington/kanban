import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAgentStore } from './agent-store';
import type { Agent } from './agent-store';

// Mock the logger utility
vi.mock('../utils/logger', () => ({
  logger: {
    logAgentAction: vi.fn(),
  },
}));

describe('AgentStore', () => {
  const createMockAgent = (id: string, status: Agent['status'] = 'active'): Agent => ({
    id,
    name: `Agent ${id}`,
    status,
    lastActivity: new Date('2023-10-01T10:00:00Z'),
    type: 'test-agent',
    config: {},
  });

  beforeEach(() => {
    // Reset store state before each test
    const { agents } = useAgentStore.getState();
    agents.length = 0;
    vi.clearAllMocks();
  });

  describe('pauseAgent', () => {
    it('should pause running agent and update status', () => {
      const { addAgent, pauseAgent, getAgent } = useAgentStore.getState();
      const mockAgent = createMockAgent('agent-1', 'active');
      
      // Arrange
      addAgent({
        name: mockAgent.name,
        status: mockAgent.status,
        type: mockAgent.type,
        config: mockAgent.config,
      });

      // Act
      pauseAgent('agent-1');

      // Assert
      const updatedAgent = getAgent('agent-1');
      expect(updatedAgent).toBeDefined();
      expect(updatedAgent!.status).toBe('paused');
      expect(updatedAgent!.lastActivity).toBeInstanceOf(Date);
    });

    it('should not pause already paused agent', () => {
      const { addAgent, pauseAgent, getAgent } = useAgentStore.getState();
      const mockAgent = createMockAgent('agent-2', 'paused');
      
      // Arrange
      addAgent({
        name: mockAgent.name,
        status: mockAgent.status,
        type: mockAgent.type,
        config: mockAgent.config,
      });
      const initialAgent = getAgent('agent-2');
      const initialLastActivity = initialAgent!.lastActivity;

      // Act
      pauseAgent('agent-2');

      // Assert
      const unchangedAgent = getAgent('agent-2');
      expect(unchangedAgent!.status).toBe('paused');
      expect(unchangedAgent!.lastActivity).toEqual(initialLastActivity);
    });

    it('should handle non-existent agent IDs gracefully', () => {
      const { pauseAgent, agents } = useAgentStore.getState();
      
      // Arrange - empty store
      expect(agents).toHaveLength(0);

      // Act & Assert - should not throw
      expect(() => {
        pauseAgent('non-existent-id');
      }).not.toThrow();
    });

    it('should log agent actions when pausing', () => {
      const { logger } = await import('../utils/logger');
      const { addAgent, pauseAgent } = useAgentStore.getState();
      const mockAgent = createMockAgent('agent-3', 'active');
      
      // Arrange
      addAgent({
        name: mockAgent.name,
        status: mockAgent.status,
        type: mockAgent.type,
        config: mockAgent.config,
      });

      // Act
      pauseAgent('agent-3');

      // Assert
      expect(logger.logAgentAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pause',
          agentId: 'agent-3',
          timestamp: expect.any(Date),
        })
      );
    });

    it('should update lastActivity when pausing active agent', () => {
      const { addAgent, pauseAgent, getAgent } = useAgentStore.getState();
      const mockAgent = createMockAgent('agent-4', 'active');
      const oldDate = new Date('2023-09-01T10:00:00Z');
      
      // Arrange
      addAgent({
        name: mockAgent.name,
        status: mockAgent.status,
        type: mockAgent.type,
        config: mockAgent.config,
      });
      // Manually set old lastActivity
      useAgentStore.setState((state) => ({
        agents: state.agents.map(agent => 
          agent.id === 'agent-4' 
            ? { ...agent, lastActivity: oldDate }
            : agent
        )
      }));

      // Act
      pauseAgent('agent-4');

      // Assert
      const updatedAgent = getAgent('agent-4');
      expect(updatedAgent!.lastActivity.getTime()).toBeGreaterThan(oldDate.getTime());
    });
  });

  describe('resumeAgent', () => {
    it('should resume paused agent and update status', () => {
      const { addAgent, resumeAgent, getAgent } = useAgentStore.getState();
      const mockAgent = createMockAgent('agent-5', 'paused');
      
      // Arrange
      addAgent({
        name: mockAgent.name,
        status: mockAgent.status,
        type: mockAgent.type,
        config: mockAgent.config,
      });

      // Act
      resumeAgent('agent-5');

      // Assert
      const updatedAgent = getAgent('agent-5');
      expect(updatedAgent).toBeDefined();
      expect(updatedAgent!.status).toBe('active');
      expect(updatedAgent!.lastActivity).toBeInstanceOf(Date);
    });

    it('should not resume already active agent', () => {
      const { addAgent, resumeAgent, getAgent } = useAgentStore.getState();
      const mockAgent = createMockAgent('agent-6', 'active');
      
      // Arrange
      addAgent({
        name: mockAgent.name,
        status: mockAgent.status,
        type: mockAgent.type,
        config: mockAgent.config,
      });
      const initialAgent = getAgent('agent-6');
      const initialLastActivity = initialAgent!.lastActivity;

      // Act
      resumeAgent('agent-6');

      // Assert
      const unchangedAgent = getAgent('agent-6');
      expect(unchangedAgent!.status).toBe('active');
      expect(unchangedAgent!.lastActivity).toEqual(initialLastActivity);
    });

    it('should handle non-existent agent IDs gracefully', () => {
      const { resumeAgent, agents } = useAgentStore.getState();
      
      // Arrange - empty store
      expect(agents).toHaveLength(0);

      // Act & Assert - should not throw
      expect(() => {
        resumeAgent('non-existent-id');
      }).not.toThrow();
    });

    it('should log agent actions when resuming', () => {
      const { logger } = await import('../utils/logger');
      const { addAgent, resumeAgent } = useAgentStore.getState();
      const mockAgent = createMockAgent('agent-7', 'paused');
      
      // Arrange
      addAgent({
        name: mockAgent.name,
        status: mockAgent.status,
        type: mockAgent.type,
        config: mockAgent.config,
      });

      // Act
      resumeAgent('agent-7');

      // Assert
      expect(logger.logAgentAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'resume',
          agentId: 'agent-7',
          timestamp: expect.any(Date),
        })
      );
    });

    it('should update lastActivity when resuming paused agent', () => {
      const { addAgent, resumeAgent, getAgent } = useAgentStore.getState();
      const mockAgent = createMockAgent('agent-8', 'paused');
      const oldDate = new Date('2023-09-01T10:00:00Z');
      
      // Arrange
      addAgent({
        name: mockAgent.name,
        status: mockAgent.status,
        type: mockAgent.type,
        config: mockAgent.config,
      });
      // Manually set old lastActivity
      useAgentStore.setState((state) => ({
        agents: state.agents.map(agent => 
          agent.id === 'agent-8' 
            ? { ...agent, lastActivity: oldDate }
            : agent
        )
      }));

      // Act
      resumeAgent('agent-8');

      // Assert
      const updatedAgent = getAgent('agent-8');
      expect(updatedAgent!.lastActivity.getTime()).toBeGreaterThan(oldDate.getTime());
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null or undefined agent IDs', () => {
      const { pauseAgent, resumeAgent } = useAgentStore.getState();

      // Act & Assert
      expect(() => {
        pauseAgent('');
        pauseAgent(null as any);
        pauseAgent(undefined as any);
        resumeAgent('');
        resumeAgent(null as any);
        resumeAgent(undefined as any);
      }).not.toThrow();
    });

    it('should maintain agent immutability during status updates', () => {
      const { addAgent, pauseAgent, agents } = useAgentStore.getState();
      const mockAgent = createMockAgent('agent-9', 'active');
      
      // Arrange
      addAgent({
        name: mockAgent.name,
        status: mockAgent.status,
        type: mockAgent.type,
        config: mockAgent.config,
      });
      const originalAgent = agents[0];

      // Act
      pauseAgent('agent-9');

      // Assert
      const updatedAgents = useAgentStore.getState().agents;
      expect(updatedAgents[0]).not.toBe(originalAgent); // Different object reference
      expect(updatedAgents[0].id).toBe(originalAgent.id);
      expect(updatedAgents[0].name).toBe(originalAgent.name);
    });

    it('should handle stopped agents appropriately', () => {
      const { addAgent, pauseAgent, resumeAgent, getAgent } = useAgentStore.getState();
      const mockAgent = createMockAgent('agent-10', 'stopped');
      
      // Arrange
      addAgent({
        name: mockAgent.name,
        status: mockAgent.status,
        type: mockAgent.type,
        config: mockAgent.config,
      });

      // Act
      pauseAgent('agent-10');
      const afterPause = getAgent('agent-10');
      
      resumeAgent('agent-10');
      const afterResume = getAgent('agent-10');

      // Assert
      expect(afterPause!.status).toBe('stopped'); // Should remain stopped
      expect(afterResume!.status).toBe('stopped'); // Should remain stopped
    });

    it('should not log actions for non-existent agents', () => {
      const { logger } = await import('../utils/logger');
      const { pauseAgent, resumeAgent } = useAgentStore.getState();

      // Act
      pauseAgent('non-existent');
      resumeAgent('non-existent');

      // Assert
      expect(logger.logAgentAction).not.toHaveBeenCalled();
    });
  });

  describe('concurrent operations', () => {
    it('should handle rapid pause/resume operations', () => {
      const { addAgent, pauseAgent, resumeAgent, getAgent } = useAgentStore.getState();
      const mockAgent = createMockAgent('agent-11', 'active');
      
      // Arrange
      addAgent({
        name: mockAgent.name,
        status: mockAgent.status,
        type: mockAgent.type,
        config: mockAgent.config,
      });

      // Act - rapid operations
      pauseAgent('agent-11');
      resumeAgent('agent-11');
      pauseAgent('agent-11');

      // Assert
      const finalAgent = getAgent('agent-11');
      expect(finalAgent!.status).toBe('paused');
    });
  });
});