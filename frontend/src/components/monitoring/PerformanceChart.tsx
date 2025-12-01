import { useMemo } from 'react';
import type { MonitoredAgent } from '../../store/monitoringStore';

interface PerformanceChartProps {
  agents: MonitoredAgent[];
}

// Simple bar chart implementation without external library
function Bar({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-xs text-gray-500 truncate" title={label}>
        {label}
      </span>
      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="w-12 text-xs text-gray-600 text-right">{value}</span>
    </div>
  );
}

export function PerformanceChart({ agents }: PerformanceChartProps) {
  const data = useMemo(() => {
    return agents.map((agent) => ({
      name: agent.type === 'project_manager'
        ? 'PM'
        : agent.type === 'scrum_master'
          ? 'SM'
          : 'Dev',
      id: agent.id,
      tasks: agent.metrics.tasksCompleted,
      successRate: agent.metrics.successRate,
      errors: agent.metrics.totalErrors,
    }));
  }, [agents]);

  const maxTasks = Math.max(...data.map((d) => d.tasks), 1);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="font-semibold text-gray-900">Agent Performance</h3>
        <p className="text-xs text-gray-500 mt-0.5">Tasks completed by agent</p>
      </div>
      <div className="p-4 space-y-3">
        {data.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No agent data available</p>
        ) : (
          data.map((item) => (
            <Bar
              key={item.id}
              label={item.name}
              value={item.tasks}
              max={maxTasks}
              color={
                item.successRate >= 90
                  ? 'bg-green-500'
                  : item.successRate >= 70
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }
            />
          ))
        )}
      </div>

      {/* Legend */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>&ge;90% success</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span>70-90%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>&lt;70%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Success Rate Chart
export function SuccessRateChart({ agents }: PerformanceChartProps) {
  const data = useMemo(() => {
    return agents.map((agent) => ({
      name: agent.displayName,
      type: agent.type,
      rate: agent.metrics.successRate,
    }));
  }, [agents]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="font-semibold text-gray-900">Success Rates</h3>
      </div>
      <div className="p-4 space-y-4">
        {data.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600 truncate max-w-[150px]" title={item.name}>
                {item.name}
              </span>
              <span
                className={`text-sm font-medium ${
                  item.rate >= 90
                    ? 'text-green-600'
                    : item.rate >= 70
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {item.rate.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  item.rate >= 90
                    ? 'bg-green-500'
                    : item.rate >= 70
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${item.rate}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
