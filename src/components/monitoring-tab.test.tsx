import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MonitoringTab } from './monitoring-tab';
import { useAgentStore } from '../stores/agent-store';

// Mock the agent store
vi.mock('../stores/agent-store', () => ({
  useAgentStore: vi.fn(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Play: () => <div data-testid="play-icon">Play</div>,
  Pause: () => <div data-testid="pause-icon">Pause</div>,
  Square: () => <div data-testid="square-icon">Square</div>,
  Activity: () => <div data-testid="activity-icon">Activity</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  XCircle: () => <div data-testid="x-circle-icon">XCircle</div>,
}));

describe('MonitoringTab', () => {
  const mockPauseAgent = vi.fn();
  const mockResumeAgent = vi.fn();
  const mockStopAgent = vi.fn();

  const createMockAgent = (id: string, status: 'running' | 'paused' | 'stopped' | 'error', overrides = {}) => ({
    id,
    name: `Agent ${id}`,
    status,
    lastActivity: new Date('2023-10-01T10:00:00Z'),
    tasksCompleted: 5,
    uptime: 3600,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (useAgentStore as any).mockReturnValue({
      agents: [],
      pauseAgent: mockPauseAgent,
      resumeAgent: mockResumeAgent,
      stopAgent: mockStopAgent,
    });
  });

  describe('should render list of agents with correct status', () => {
    it('displays all agents with their status indicators', () => {
      const mockAgents = [
        createMockAgent('1', 'running'),
        createMockAgent('2', 'paused'),
        createMockAgent('3', 'stopped'),
        createMockAgent('4', 'error'),
      ];

      (useAgentStore as any).mockReturnValue({
        agents: mockAgents,
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });

      render(<MonitoringTab />);

      expect(screen.getByText('Agent 1')).toBeInTheDocument();
      expect(screen.getByText('Agent 2')).toBeInTheDocument();
      expect(screen.getByText('Agent 3')).toBeInTheDocument();
      expect(screen.getByText('Agent 4')).toBeInTheDocument();
    });

    it('displays correct status text for each agent', () => {
      const mockAgents = [
        createMockAgent('1', 'running'),
        createMockAgent('2', 'paused'),
        createMockAgent('3', 'stopped'),
        createMockAgent('4', 'error'),
      ];

      (useAgentStore as any).mockReturnValue({
        agents: mockAgents,
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });

      render(<MonitoringTab />);

      expect(screen.getByText('running')).toBeInTheDocument();
      expect(screen.getByText('paused')).toBeInTheDocument();
      expect(screen.getByText('stopped')).toBeInTheDocument();
      expect(screen.getByText('error')).toBeInTheDocument();
    });

    it('renders empty state when no agents exist', () => {
      render(<MonitoringTab />);

      expect(screen.getByText(/no agents/i)).toBeInTheDocument();
    });
  });

  describe('should show pause button for running agents', () => {
    it('displays pause button for agents with running status', () => {
      const mockAgents = [
        createMockAgent('1', 'running'),
        createMockAgent('2', 'running'),
      ];

      (useAgentStore as any).mockReturnValue({
        agents: mockAgents,
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });

      render(<MonitoringTab />);

      const pauseButtons = screen.getAllByTestId('pause-icon');
      expect(pauseButtons).toHaveLength(2);
    });

    it('does not show pause button for non-running agents', () => {
      const mockAgents = [
        createMockAgent('1', 'paused'),
        createMockAgent('2', 'stopped'),
        createMockAgent('3', 'error'),
      ];

      (useAgentStore as any).mockReturnValue({
        agents: mockAgents,
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });

      render(<MonitoringTab />);

      expect(screen.queryByTestId('pause-icon')).not.toBeInTheDocument();
    });
  });

  describe('should show resume button for paused agents', () => {
    it('displays resume button for agents with paused status', () => {
      const mockAgents = [
        createMockAgent('1', 'paused'),
        createMockAgent('2', 'paused'),
      ];

      (useAgentStore as any).mockReturnValue({
        agents: mockAgents,
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });

      render(<MonitoringTab />);

      const playButtons = screen.getAllByTestId('play-icon');
      expect(playButtons).toHaveLength(2);
    });

    it('does not show resume button for non-paused agents', () => {
      const mockAgents = [
        createMockAgent('1', 'running'),
        createMockAgent('2', 'stopped'),
        createMockAgent('3', 'error'),
      ];

      (useAgentStore as any).mockReturnValue({
        agents: mockAgents,
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });

      render(<MonitoringTab />);

      expect(screen.queryByTestId('play-icon')).not.toBeInTheDocument();
    });
  });

  describe('should call pauseAgent when pause button clicked', () => {
    it('calls pauseAgent with correct agent id when pause button is clicked', () => {
      const mockAgents = [
        createMockAgent('agent-1', 'running'),
        createMockAgent('agent-2', 'running'),
      ];

      (useAgentStore as any).mockReturnValue({
        agents: mockAgents,
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });

      render(<MonitoringTab />);

      const pauseButtons = screen.getAllByTestId('pause-icon');
      fireEvent.click(pauseButtons[0]);

      expect(mockPauseAgent).toHaveBeenCalledTimes(1);
      expect(mockPauseAgent).toHaveBeenCalledWith('agent-1');
    });

    it('calls pauseAgent only once per click', () => {
      const mockAgents = [createMockAgent('agent-1', 'running')];

      (useAgentStore as any).mockReturnValue({
        agents: mockAgents,
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });

      render(<MonitoringTab />);

      const pauseButton = screen.getByTestId('pause-icon');
      fireEvent.click(pauseButton);
      fireEvent.click(pauseButton);

      expect(mockPauseAgent).toHaveBeenCalledTimes(2);
    });

    it('calls resumeAgent with correct agent id when resume button is clicked', () => {
      const mockAgents = [
        createMockAgent('agent-3', 'paused'),
        createMockAgent('agent-4', 'paused'),
      ];

      (useAgentStore as any).mockReturnValue({
        agents: mockAgents,
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });

      render(<MonitoringTab />);

      const playButtons = screen.getAllByTestId('play-icon');
      fireEvent.click(playButtons[1]);

      expect(mockResumeAgent).toHaveBeenCalledTimes(1);
      expect(mockResumeAgent).toHaveBeenCalledWith('agent-4');
    });
  });

  describe('should update UI when agent status changes', () => {
    it('updates button display when agent status changes from running to paused', () => {
      const { rerender } = render(<MonitoringTab />);

      // Initial render with running agent
      (useAgentStore as any).mockReturnValue({
        agents: [createMockAgent('agent-1', 'running')],
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });
      
      rerender(<MonitoringTab />);
      expect(screen.getByTestId('pause-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('play-icon')).not.toBeInTheDocument();

      // Update agent status to paused
      (useAgentStore as any).mockReturnValue({
        agents: [createMockAgent('agent-1', 'paused')],
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });

      rerender(<MonitoringTab />);
      expect(screen.queryByTestId('pause-icon')).not.toBeInTheDocument();
      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
    });

    it('updates status text when agent status changes', () => {
      const { rerender } = render(<MonitoringTab />);

      // Initial render with running agent
      (useAgentStore as any).mockReturnValue({
        agents: [createMockAgent('agent-1', 'running')],
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });

      rerender(<MonitoringTab />);
      expect(screen.getByText('running')).toBeInTheDocument();

      // Update agent status to error
      (useAgentStore as any).mockReturnValue({
        agents: [createMockAgent('agent-1', 'error')],
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });

      rerender(<MonitoringTab />);
      expect(screen.getByText('error')).toBeInTheDocument();
      expect(screen.queryByText('running')).not.toBeInTheDocument();
    });

    it('updates agent count when agents are added or removed', () => {
      const { rerender } = render(<MonitoringTab />);

      // Initial render with one agent
      (useAgentStore as any).mockReturnValue({
        agents: [createMockAgent('agent-1', 'running')],
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });

      rerender(<MonitoringTab />);
      expect(screen.getByText('Agent agent-1')).toBeInTheDocument();

      // Add another agent
      (useAgentStore as any).mockReturnValue({
        agents: [
          createMockAgent('agent-1', 'running'),
          createMockAgent('agent-2', 'paused'),
        ],
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });

      rerender(<MonitoringTab />);
      expect(screen.getByText('Agent agent-1')).toBeInTheDocument();
      expect(screen.getByText('Agent agent-2')).toBeInTheDocument();
    });

    it('handles status transitions correctly', () => {
      const { rerender } = render(<MonitoringTab />);

      const statusTransitions = [
        'running',
        'paused', 
        'running',
        'stopped',
        'error'
      ] as const;

      statusTransitions.forEach((status, index) => {
        (useAgentStore as any).mockReturnValue({
          agents: [createMockAgent('agent-1', status)],
          pauseAgent: mockPauseAgent,
          resumeAgent: mockResumeAgent,
          stopAgent: mockStopAgent,
        });

        rerender(<MonitoringTab />);
        expect(screen.getByText(status)).toBeInTheDocument();

        // Check correct button is displayed
        if (status === 'running') {
          expect(screen.queryByTestId('pause-icon')).toBeInTheDocument();
          expect(screen.queryByTestId('play-icon')).not.toBeInTheDocument();
        } else if (status === 'paused') {
          expect(screen.queryByTestId('play-icon')).toBeInTheDocument();
          expect(screen.queryByTestId('pause-icon')).not.toBeInTheDocument();
        } else {
          expect(screen.queryByTestId('play-icon')).not.toBeInTheDocument();
          expect(screen.queryByTestId('pause-icon')).not.toBeInTheDocument();
        }
      });
    });
  });

  describe('edge cases', () => {
    it('handles agents with missing properties gracefully', () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          status: 'running' as const,
          // Missing optional properties
        },
      ];

      (useAgentStore as any).mockReturnValue({
        agents: mockAgents,
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });

      expect(() => render(<MonitoringTab />)).not.toThrow();
      expect(screen.getByText('Agent 1')).toBeInTheDocument();
    });

    it('handles undefined agent id in action calls', () => {
      const mockAgents = [createMockAgent('', 'running')];

      (useAgentStore as any).mockReturnValue({
        agents: mockAgents,
        pauseAgent: mockPauseAgent,
        resumeAgent: mockResumeAgent,
        stopAgent: mockStopAgent,
      });

      render(<MonitoringTab />);

      const pauseButton = screen.getByTestId('pause-icon');
      fireEvent.click(pauseButton);

      expect(mockPauseAgent).toHaveBeenCalledWith('');
    });

    it('handles rapid status changes', () => {
      const { rerender } = render(<MonitoringTab />);

      // Simulate rapid status changes
      const rapidChanges = ['running', 'paused', 'running', 'paused'] as const;
      
      rapidChanges.forEach(status => {
        (useAgentStore as any).mockReturnValue({
          agents: [createMockAgent('agent-1', status)],
          pauseAgent: