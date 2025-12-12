import React from 'react';
import { useAgentStore } from '../stores/agent-store';
import { Play, Pause, Square, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'stopped' | 'error';
  lastActivity: Date;
  tasksCompleted: number;
  uptime: number;
}

const MonitoringTab: React.FC = () => {
  const { agents, pauseAgent, resumeAgent, stopAgent } = useAgentStore();

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'running':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'stopped':
        return <Square className="w-4 h-4 text-gray-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: Agent['status']) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'running':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'paused':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'stopped':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'error':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatLastActivity = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handlePauseAgent = async (id: string) => {
    try {
      await pauseAgent(id);
    } catch (error) {
      console.error('Failed to pause agent:', error);
    }
  };

  const handleResumeAgent = async (id: string) => {
    try {
      await resumeAgent(id);
    } catch (error) {
      console.error('Failed to resume agent:', error);
    }
  };

  const handleStopAgent = async (id: string) => {
    try {
      await stopAgent(id);
    } catch (error) {
      console.error('Failed to stop agent:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Agent Monitoring</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Activity className="w-4 h-4" />
          <span>{agents.filter(agent => agent.status === 'running').length} active agents</span>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No agents</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first agent.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 gap-4 px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-2">Agent</div>
            <div>Status</div>
            <div>Last Activity</div>
            <div>Tasks Completed</div>
            <div>Uptime</div>
            <div>Actions</div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {agents.map((agent) => (
              <div key={agent.id} className="grid grid-cols-7 gap-4 px-6 py-4 items-center hover:bg-gray-50">
                <div className="col-span-2 flex items-center space-x-3">
                  {getStatusIcon(agent.status)}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                    <div className="text-sm text-gray-500">{agent.id}</div>
                  </div>
                </div>
                
                <div>
                  <span className={getStatusBadge(agent.status)}>
                    {agent.status}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatLastActivity(agent.lastActivity)}
                </div>
                
                <div className="text-sm text-gray-900">
                  {agent.tasksCompleted.toLocaleString()}
                </div>
                
                <div className="text-sm text-gray-500">
                  {formatUptime(agent.uptime)}
                </div>
                
                <div className="flex items-center space-x-2">
                  {agent.status === 'running' && (
                    <button
                      onClick={() => handlePauseAgent(agent.id)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Pause className="w-3 h-3 mr-1" />
                      Pause
                    </button>
                  )}
                  
                  {agent.status === 'paused' && (
                    <button
                      onClick={() => handleResumeAgent(agent.id)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Resume
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleStopAgent(agent.id)}
                    disabled={agent.status === 'stopped'}
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Square className="w-3 h-3 mr-1" />
                    Stop
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringTab;