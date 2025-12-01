import { useState } from 'react';
import { Pause, Play, AlertCircle } from 'lucide-react';
import type { MonitoredAgent } from '../../store/monitoringStore';
import { AGENT_CONFIG } from '../../types';

interface MonitoredAgentCardProps {
  agent: MonitoredAgent;
  onPause: (agentId: string) => Promise<boolean>;
  onResume: (agentId: string) => Promise<boolean>;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

const statusColors = {
  idle: 'bg-gray-400',
  processing: 'bg-blue-500 animate-pulse',
  error: 'bg-red-500',
  offline: 'bg-gray-300',
};

const statusLabels = {
  idle: 'Idle',
  processing: 'Processing',
  error: 'Error',
  offline: 'Offline',
};

export function MonitoredAgentCard({ agent, onPause, onResume }: MonitoredAgentCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const config = AGENT_CONFIG[agent.type];

  const handlePause = async () => {
    setIsLoading(true);
    await onPause(agent.id);
    setIsLoading(false);
  };

  const handleResume = async () => {
    setIsLoading(true);
    await onResume(agent.id);
    setIsLoading(false);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bgColor}`}
            >
              <span className={`font-semibold ${config.color}`}>
                {agent.type === 'project_manager' && 'PM'}
                {agent.type === 'scrum_master' && 'SM'}
                {agent.type === 'developer' && 'Dev'}
              </span>
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${statusColors[agent.status]}`}
            />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{agent.displayName}</h3>
            <p className="text-xs text-gray-500">{agent.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              agent.status === 'processing'
                ? 'bg-blue-100 text-blue-700'
                : agent.status === 'error'
                  ? 'bg-red-100 text-red-700'
                  : agent.status === 'offline'
                    ? 'bg-gray-100 text-gray-500'
                    : 'bg-gray-100 text-gray-600'
            }`}
          >
            {statusLabels[agent.status]}
          </span>
        </div>
      </div>

      {/* Current Task */}
      {agent.currentTask && (
        <div className="mb-3 rounded-lg bg-blue-50 p-3">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-700">Currently Processing</p>
              <p className="mt-0.5 truncate text-sm text-gray-700" title={agent.currentTask.title}>
                {agent.currentTask.title}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Started {formatTimeAgo(agent.currentTask.startedAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded bg-gray-50 p-2">
          <p className="text-xs text-gray-500">Success Rate</p>
          <p className={`font-semibold ${agent.metrics.successRate >= 90 ? 'text-green-600' : agent.metrics.successRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
            {agent.metrics.successRate.toFixed(1)}%
          </p>
        </div>
        <div className="rounded bg-gray-50 p-2">
          <p className="text-xs text-gray-500">Avg Time</p>
          <p className="font-semibold text-gray-700">
            {formatDuration(agent.metrics.avgProcessingTimeMs)}
          </p>
        </div>
        <div className="rounded bg-gray-50 p-2">
          <p className="text-xs text-gray-500">Today</p>
          <p className="font-semibold text-gray-700">{agent.metrics.tasksToday} tasks</p>
        </div>
        <div className="rounded bg-gray-50 p-2">
          <p className="text-xs text-gray-500">Total</p>
          <p className="font-semibold text-gray-700">{agent.metrics.tasksCompleted} tasks</p>
        </div>
      </div>

      {/* Errors indicator */}
      {agent.metrics.errorsToday > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{agent.metrics.errorsToday} error{agent.metrics.errorsToday > 1 ? 's' : ''} today</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-400">
          Last seen {formatTimeAgo(agent.lastSeenAt)}
        </span>
        {agent.status !== 'offline' && (
          <button
            onClick={agent.status === 'idle' || agent.status === 'processing' ? handlePause : handleResume}
            disabled={isLoading}
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
              agent.status === 'idle' || agent.status === 'processing'
                ? 'text-orange-600 hover:bg-orange-50'
                : 'text-green-600 hover:bg-green-50'
            } disabled:opacity-50`}
          >
            {isLoading ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : agent.status === 'idle' || agent.status === 'processing' ? (
              <>
                <Pause className="h-3 w-3" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                Resume
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
