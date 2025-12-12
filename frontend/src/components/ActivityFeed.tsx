import { useEffect } from 'react';
import { useAgentActivityStore } from '../store/agentActivityStore';
import {
  AGENT_CONFIG,
  AGENT_ACTION_CONFIG,
  AGENT_STATUS_CONFIG,
  ITEM_TYPE_CONFIG,
  type AgentActivity,
  type AgentType,
} from '../types';

interface ActivityFeedProps {
  projectId?: string;
  workItemId?: string;
  limit?: number;
  compact?: boolean;
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
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatDuration(ms: number | undefined): string {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function ActivityItem({ activity, compact }: { activity: AgentActivity; compact?: boolean }) {
  const actionConfig = AGENT_ACTION_CONFIG[activity.action];
  const statusConfig = AGENT_STATUS_CONFIG[activity.status];
  const agentConfig = activity.agentType ? AGENT_CONFIG[activity.agentType] : null;
  const typeConfig = activity.workItemType ? ITEM_TYPE_CONFIG[activity.workItemType] : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 py-1.5 text-sm">
        <span className="text-base">{actionConfig.icon}</span>
        <span className={`font-medium ${agentConfig?.color || 'text-gray-600'}`}>
          {agentConfig?.label || activity.agentType}
        </span>
        <span className={actionConfig.color}>{actionConfig.label}</span>
        {activity.workItemTitle && (
          <span className="text-gray-500 truncate max-w-[150px]" title={activity.workItemTitle}>
            {activity.workItemTitle}
          </span>
        )}
        <span className="text-gray-400 ml-auto text-xs">{formatTimeAgo(activity.createdAt)}</span>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="text-xl">{actionConfig.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {agentConfig && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${agentConfig.bgColor} ${agentConfig.color}`}>
                {agentConfig.label}
              </span>
            )}
            <span className={`font-medium ${actionConfig.color}`}>{actionConfig.label}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            {activity.durationMs && (
              <span className="text-gray-400 text-xs">{formatDuration(activity.durationMs)}</span>
            )}
          </div>

          {activity.workItemTitle && (
            <div className="mt-1 flex items-center gap-2">
              {typeConfig && (
                <span className={`px-1.5 py-0.5 rounded text-xs ${typeConfig.bgColor} ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
              )}
              <span className="text-gray-700 text-sm truncate" title={activity.workItemTitle}>
                {activity.workItemTitle}
              </span>
            </div>
          )}

          {activity.errorMessage && (
            <div className="mt-1 text-sm text-red-600 bg-red-50 rounded px-2 py-1">
              {activity.errorMessage}
            </div>
          )}

          {Object.keys(activity.details).length > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              {JSON.stringify(activity.details)}
            </div>
          )}

          <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
            <span>{activity.agentDisplayName || activity.agentInstanceId}</span>
            <span>|</span>
            <span>{formatTimeAgo(activity.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActivityFeed({ projectId, workItemId, limit = 50, compact = false }: ActivityFeedProps) {
  const { activities, loading, error, fetchActivities, subscribeToActivities } =
    useAgentActivityStore();

  useEffect(() => {
    const filters: { projectId?: string; workItemId?: string } = {};
    if (projectId) filters.projectId = projectId;
    if (workItemId) filters.workItemId = workItemId;
    fetchActivities(filters);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToActivities(projectId);
    return unsubscribe;
  }, [projectId, workItemId, fetchActivities, subscribeToActivities]);

  const displayedActivities = activities.slice(0, limit);

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Loading activities...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 rounded-lg p-4 text-sm">
        Error loading activities: {error}
      </div>
    );
  }

  if (displayedActivities.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No agent activity yet
      </div>
    );
  }

  return (
    <div className={compact ? 'divide-y divide-gray-100' : ''}>
      {displayedActivities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} compact={compact} />
      ))}
    </div>
  );
}

export function ActivityFilters() {
  const { filters, setFilters, clearFilters, exportActivities } = useAgentActivityStore();

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <select
        value={filters.agentType || ''}
        onChange={(e) => setFilters({ agentType: e.target.value as AgentType || undefined })}
        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Agents</option>
        <option value="project_manager">PM Agent</option>
        <option value="scrum_master">SM Agent</option>
        <option value="developer">Dev Agent</option>
      </select>

      <select
        value={filters.action || ''}
        onChange={(e) => setFilters({ action: e.target.value as AgentActivity['action'] || undefined })}
        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Actions</option>
        <option value="claimed">Claimed</option>
        <option value="processing">Processing</option>
        <option value="completed">Completed</option>
        <option value="handed_off">Handed Off</option>
        <option value="failed">Failed</option>
        <option value="released">Released</option>
        <option value="escalated">Escalated</option>
      </select>

      <select
        value={filters.status || ''}
        onChange={(e) => setFilters({ status: e.target.value as AgentActivity['status'] || undefined })}
        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Statuses</option>
        <option value="success">Success</option>
        <option value="error">Error</option>
        <option value="warning">Warning</option>
      </select>

      {Object.keys(filters).length > 0 && (
        <button
          onClick={clearFilters}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
        >
          Clear Filters
        </button>
      )}

      <div className="ml-auto flex gap-2">
        <button
          onClick={() => exportActivities('csv')}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Export CSV
        </button>
        <button
          onClick={() => exportActivities('json')}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Export JSON
        </button>
      </div>
    </div>
  );
}
