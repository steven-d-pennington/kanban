import type { StatusBreakdown } from '../../store/analyticsStore';

interface StatusBreakdownChartProps {
  data: StatusBreakdown[];
}

const statusColors: Record<string, string> = {
  backlog: 'bg-gray-400',
  ready: 'bg-blue-400',
  in_progress: 'bg-yellow-400',
  review: 'bg-purple-400',
  testing: 'bg-orange-400',
  done: 'bg-green-500',
};

const statusLabels: Record<string, string> = {
  backlog: 'Backlog',
  ready: 'Ready',
  in_progress: 'In Progress',
  review: 'Review',
  testing: 'Testing',
  done: 'Done',
};

export function StatusBreakdownChart({ data }: StatusBreakdownChartProps) {
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="font-semibold text-gray-900">Status Distribution</h3>
      </div>

      <div className="p-4">
        {/* Stacked bar */}
        <div className="h-6 flex rounded-full overflow-hidden bg-gray-100">
          {data
            .filter((d) => d.count > 0)
            .map((item) => (
              <div
                key={item.status}
                className={`${statusColors[item.status]} transition-all duration-500`}
                style={{ width: `${item.percentage}%` }}
                title={`${statusLabels[item.status]}: ${item.count} (${item.percentage.toFixed(1)}%)`}
              />
            ))}
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {data.map((item) => (
            <div key={item.status} className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded ${statusColors[item.status]}`} />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-600 truncate block">
                  {statusLabels[item.status]}
                </span>
                <span className="text-xs text-gray-400">
                  {item.count} ({item.percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
