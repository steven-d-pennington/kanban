import { AGENT_CONFIG, AGENT_ACTION_CONFIG, AGENT_STATUS_CONFIG } from '../../types';
import type { RecentActivity } from '../../store/monitoringStore';

interface ActivityTimelineProps {
  activities: RecentActivity[];
  maxItems?: number;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

function formatDuration(ms: number | undefined): string {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function ActivityTimeline({ activities, maxItems = 10 }: ActivityTimelineProps) {
  const displayedActivities = activities.slice(0, maxItems);

  if (displayedActivities.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-500">
        No recent activity
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="font-semibold text-gray-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {displayedActivities.map((activity, index) => {
          const agentConfig = AGENT_CONFIG[activity.agentType];
          const actionConfig = AGENT_ACTION_CONFIG[activity.action];
          const statusConfig = AGENT_STATUS_CONFIG[activity.status];

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div className="text-lg">{actionConfig.icon}</div>
                {index < displayedActivities.length - 1 && (
                  <div className="mt-2 h-full w-px bg-gray-200 flex-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${agentConfig.bgColor} ${agentConfig.color}`}
                  >
                    {agentConfig.label}
                  </span>
                  <span className={`font-medium text-sm ${actionConfig.color}`}>
                    {actionConfig.label}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs ${statusConfig.bgColor} ${statusConfig.color}`}
                  >
                    {statusConfig.label}
                  </span>
                  {activity.durationMs && (
                    <span className="text-xs text-gray-400">
                      {formatDuration(activity.durationMs)}
                    </span>
                  )}
                </div>
                {activity.workItemTitle && (
                  <p
                    className="mt-1 truncate text-sm text-gray-600"
                    title={activity.workItemTitle}
                  >
                    {activity.workItemTitle}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
