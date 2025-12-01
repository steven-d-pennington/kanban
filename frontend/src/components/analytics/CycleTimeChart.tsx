import type { CycleTimeStats } from '../../store/analyticsStore';

interface CycleTimeChartProps {
  cycleTime: CycleTimeStats;
  leadTime: CycleTimeStats;
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function StatBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-xs text-gray-500">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="w-12 text-xs text-gray-600 text-right">{formatHours(value)}</span>
    </div>
  );
}

export function CycleTimeChart({ cycleTime, leadTime }: CycleTimeChartProps) {
  const maxValue = Math.max(cycleTime.p90, leadTime.p90, 1);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="font-semibold text-gray-900">Cycle & Lead Time</h3>
        <p className="text-xs text-gray-500">Time metrics for completed items</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Cycle Time */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Cycle Time</h4>
            <span className="text-sm text-gray-500">(started → done)</span>
          </div>
          <div className="space-y-2">
            <StatBar label="Average" value={cycleTime.average} max={maxValue} color="bg-blue-500" />
            <StatBar label="Median" value={cycleTime.median} max={maxValue} color="bg-blue-400" />
            <StatBar label="P90" value={cycleTime.p90} max={maxValue} color="bg-blue-300" />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span>Min: {formatHours(cycleTime.min)}</span>
            <span>Max: {formatHours(cycleTime.max)}</span>
          </div>
        </div>

        {/* Lead Time */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Lead Time</h4>
            <span className="text-sm text-gray-500">(created → done)</span>
          </div>
          <div className="space-y-2">
            <StatBar label="Average" value={leadTime.average} max={maxValue} color="bg-purple-500" />
            <StatBar label="Median" value={leadTime.median} max={maxValue} color="bg-purple-400" />
            <StatBar label="P90" value={leadTime.p90} max={maxValue} color="bg-purple-300" />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span>Min: {formatHours(leadTime.min)}</span>
            <span>Max: {formatHours(leadTime.max)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
