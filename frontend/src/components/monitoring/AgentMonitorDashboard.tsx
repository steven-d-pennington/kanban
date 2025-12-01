import { useEffect } from 'react';
import {
  Bot,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { useMonitoringStore } from '../../store/monitoringStore';
import { MetricCard } from './MetricCard';
import { MonitoredAgentCard } from './MonitoredAgentCard';
import { ActivityTimeline } from './ActivityTimeline';
import { AlertsPanel } from './AlertsPanel';
import { PerformanceChart, SuccessRateChart } from './PerformanceChart';

export function AgentMonitorDashboard() {
  const {
    agents,
    recentActivities,
    alerts,
    loading,
    error,
    summaryStats,
    lastUpdated,
    fetchAgents,
    fetchRecentActivities,
    fetchAlerts,
    pauseAgent,
    resumeAgent,
    acknowledgeAlert,
    subscribeToUpdates,
    refreshAll,
  } = useMonitoringStore();

  useEffect(() => {
    refreshAll();
    const unsubscribe = subscribeToUpdates();

    // Refresh every 30 seconds
    const interval = setInterval(refreshAll, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refreshAll, subscribeToUpdates]);

  const handleRefresh = () => {
    refreshAll();
  };

  if (loading && agents.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading monitoring data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Monitor</h1>
          <p className="text-sm text-gray-500">
            Real-time monitoring of AI agent activity and health
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          <p className="font-medium">Error loading monitoring data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Agents"
          value={summaryStats.activeAgents}
          subtitle={`${agents.length} total registered`}
          icon={<Bot className="h-5 w-5" />}
        />
        <MetricCard
          title="Processing"
          value={summaryStats.processingAgents}
          subtitle="Currently working on tasks"
          icon={<Activity className="h-5 w-5" />}
          variant={summaryStats.processingAgents > 0 ? 'success' : 'default'}
        />
        <MetricCard
          title="Tasks Today"
          value={summaryStats.tasksToday}
          subtitle="Completed across all agents"
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
        />
        <MetricCard
          title="Errors Today"
          value={summaryStats.errorsToday}
          subtitle={summaryStats.errorsToday > 0 ? 'Requires attention' : 'All systems healthy'}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={summaryStats.errorsToday > 0 ? 'error' : 'default'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Agent Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Grid */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Agent Instances</h2>
            {agents.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
                <Bot className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-3 font-medium">No agents registered</p>
                <p className="text-sm">Agents will appear here when they connect</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {agents.map((agent) => (
                  <MonitoredAgentCard
                    key={agent.id}
                    agent={agent}
                    onPause={pauseAgent}
                    onResume={resumeAgent}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Charts */}
          <div className="grid gap-4 sm:grid-cols-2">
            <PerformanceChart agents={agents} />
            <SuccessRateChart agents={agents} />
          </div>
        </div>

        {/* Right Column - Activity & Alerts */}
        <div className="space-y-6">
          {/* Alerts */}
          <AlertsPanel alerts={alerts} onAcknowledge={acknowledgeAlert} />

          {/* Activity Timeline */}
          <ActivityTimeline activities={recentActivities} maxItems={8} />
        </div>
      </div>
    </div>
  );
}
