import { AlertTriangle, Clock } from 'lucide-react';
import type { BottleneckItem } from '../../store/analyticsStore';
import { AGENT_CONFIG } from '../../types';

interface BottlenecksListProps {
  bottlenecks: BottleneckItem[];
}

const statusLabels: Record<string, string> = {
  in_progress: 'In Progress',
  review: 'Review',
  testing: 'Testing',
};

function formatHours(hours: number): string {
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function BottlenecksList({ bottlenecks }: BottlenecksListProps) {
  if (bottlenecks.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Clock className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="mt-3 font-medium text-gray-900">No Bottlenecks</h3>
          <p className="mt-1 text-sm text-gray-500">All items are flowing smoothly</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-orange-500" />
        <h3 className="font-semibold text-gray-900">Bottlenecks</h3>
        <span className="ml-auto rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
          {bottlenecks.length} items stuck
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {bottlenecks.map((item) => (
          <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate" title={item.title}>
                  {item.title}
                </h4>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                    {statusLabels[item.status] || item.status}
                  </span>
                  {item.assignedAgent && (
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        AGENT_CONFIG[item.assignedAgent].bgColor
                      } ${AGENT_CONFIG[item.assignedAgent].color}`}
                    >
                      {AGENT_CONFIG[item.assignedAgent].label}
                    </span>
                  )}
                  {item.assignedTo && (
                    <span className="text-xs text-gray-500">{item.assignedTo}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-medium ${
                    item.hoursInStatus > 72
                      ? 'text-red-600'
                      : item.hoursInStatus > 48
                        ? 'text-orange-600'
                        : 'text-yellow-600'
                  }`}
                >
                  {formatHours(item.hoursInStatus)}
                </span>
                <p className="text-xs text-gray-400">stuck</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
