import { useEffect } from 'react';
import {
  BarChart3,
  Loader2,
  RefreshCw,
  Download,
  CheckCircle2,
  Clock,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { useAnalyticsStore } from '../../store/analyticsStore';
import { useKanbanStore } from '../../store/kanbanStore';
import { MetricCard } from '../monitoring/MetricCard';
import { DateRangePicker } from './DateRangePicker';
import { VelocityChart } from './VelocityChart';
import { CycleTimeChart } from './CycleTimeChart';
import { StatusBreakdownChart } from './StatusBreakdownChart';
import { AgentPerformanceTable } from './AgentPerformanceTable';
import { BottlenecksList } from './BottlenecksList';

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export function AnalyticsDashboard() {
  const { currentProjectId, projects } = useKanbanStore();
  const {
    projectMetrics,
    bottlenecks,
    velocityData,
    loading,
    error,
    dateRange,
    setDateRange,
    fetchProjectMetrics,
    fetchBottlenecks,
    exportMetrics,
  } = useAnalyticsStore();

  const currentProject = projects.find((p) => p.id === currentProjectId);

  useEffect(() => {
    if (currentProjectId) {
      fetchProjectMetrics(currentProjectId);
      fetchBottlenecks(currentProjectId);
    }
  }, [currentProjectId, dateRange, fetchProjectMetrics, fetchBottlenecks]);

  const handleRefresh = () => {
    if (currentProjectId) {
      fetchProjectMetrics(currentProjectId);
      fetchBottlenecks(currentProjectId);
    }
  };

  if (!currentProjectId) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 font-medium">No project selected</p>
          <p className="text-sm">Select a project to view analytics</p>
        </div>
      </div>
    );
  }

  if (loading && !projectMetrics) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">
            Project metrics and insights for {currentProject?.name || 'current project'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="relative group">
            <button
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <div className="absolute right-0 top-full z-10 mt-1 hidden w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg group-hover:block">
              <button
                onClick={() => exportMetrics('csv')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Export CSV
              </button>
              <button
                onClick={() => exportMetrics('json')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          <p className="font-medium">Error loading analytics</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {projectMetrics && (
        <>
          {/* Summary Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Items"
              value={projectMetrics.totalItems}
              subtitle={`${projectMetrics.completedItems} completed`}
              icon={<Layers className="h-5 w-5" />}
            />
            <MetricCard
              title="Completed"
              value={projectMetrics.completedItems}
              subtitle={`${((projectMetrics.completedItems / Math.max(projectMetrics.totalItems, 1)) * 100).toFixed(0)}% completion rate`}
              icon={<CheckCircle2 className="h-5 w-5" />}
              variant="success"
            />
            <MetricCard
              title="Avg Cycle Time"
              value={formatHours(projectMetrics.cycleTime.average)}
              subtitle={`Median: ${formatHours(projectMetrics.cycleTime.median)}`}
              icon={<Clock className="h-5 w-5" />}
            />
            <MetricCard
              title="Current WIP"
              value={projectMetrics.wip}
              subtitle="Items in progress"
              icon={<TrendingUp className="h-5 w-5" />}
              variant={projectMetrics.wip > 10 ? 'warning' : 'default'}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <VelocityChart data={velocityData} />
            <CycleTimeChart
              cycleTime={projectMetrics.cycleTime}
              leadTime={projectMetrics.leadTime}
            />
          </div>

          {/* Charts Row 2 */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <StatusBreakdownChart data={projectMetrics.byStatus} />
            <div className="lg:col-span-2">
              <AgentPerformanceTable data={projectMetrics.byAgent} />
            </div>
          </div>

          {/* Bottlenecks */}
          <BottlenecksList bottlenecks={bottlenecks} />
        </>
      )}
    </div>
  );
}
