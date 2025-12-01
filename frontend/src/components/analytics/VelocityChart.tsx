import { useMemo } from 'react';
import type { ThroughputData } from '../../store/analyticsStore';

interface VelocityChartProps {
  data: ThroughputData[];
}

export function VelocityChart({ data }: VelocityChartProps) {
  const { maxCount, maxPoints } = useMemo(() => {
    return {
      maxCount: Math.max(...data.map((d) => d.count), 1),
      maxPoints: Math.max(...data.map((d) => d.points), 1),
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-500">
        No velocity data available
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="font-semibold text-gray-900">Velocity Trend</h3>
        <p className="text-xs text-gray-500">Items completed and story points per week</p>
      </div>

      <div className="p-4">
        {/* Chart area */}
        <div className="flex items-end gap-1 h-48">
          {data.map((item) => (
            <div key={item.week} className="flex-1 flex flex-col items-center gap-1">
              {/* Bars */}
              <div className="w-full flex items-end justify-center gap-0.5 h-40">
                {/* Items bar */}
                <div
                  className="w-3 bg-blue-500 rounded-t transition-all duration-300"
                  style={{ height: `${(item.count / maxCount) * 100}%` }}
                  title={`${item.count} items`}
                />
                {/* Points bar */}
                <div
                  className="w-3 bg-green-500 rounded-t transition-all duration-300"
                  style={{ height: `${(item.points / maxPoints) * 100}%` }}
                  title={`${item.points} points`}
                />
              </div>
              {/* Label */}
              <span className="text-xs text-gray-400 truncate w-full text-center" title={item.week}>
                {new Date(item.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-blue-500" />
            <span className="text-gray-600">Items</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-green-500" />
            <span className="text-gray-600">Story Points</span>
          </div>
        </div>
      </div>
    </div>
  );
}
