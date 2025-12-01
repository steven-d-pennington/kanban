import { useEffect, useState } from 'react';
import { useAgentActivityStore } from '../store/agentActivityStore';
import { AGENT_CONFIG, type AgentInstance, type ClaimedItem } from '../types';

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

function AgentInstanceCard({
  instance,
  onDeactivate,
}: {
  instance: AgentInstance;
  onDeactivate: () => void;
}) {
  const config = AGENT_CONFIG[instance.agentType];
  const isOnline = instance.status === 'active';
  const lastSeenMs = Date.now() - new Date(instance.lastSeenAt).getTime();
  const isRecentlyActive = lastSeenMs < 5 * 60 * 1000; // 5 minutes

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor}`}>
              <span className={`text-lg ${config.color}`}>
                {instance.agentType === 'project_manager' && 'PM'}
                {instance.agentType === 'scrum_master' && 'SM'}
                {instance.agentType === 'developer' && 'Dev'}
              </span>
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                isOnline && isRecentlyActive
                  ? 'bg-green-500'
                  : isOnline
                  ? 'bg-yellow-500'
                  : 'bg-gray-400'
              }`}
            />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{instance.displayName}</h3>
            <p className={`text-sm ${config.color}`}>{config.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              instance.status === 'active'
                ? 'bg-green-100 text-green-700'
                : instance.status === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {instance.status}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
        <span className="text-gray-500">Last seen: {formatTimeAgo(instance.lastSeenAt)}</span>
        {instance.status === 'active' && (
          <button
            onClick={onDeactivate}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            Deactivate
          </button>
        )}
      </div>
    </div>
  );
}

function ClaimedItemCard({
  item,
  onForceRelease,
}: {
  item: ClaimedItem;
  onForceRelease: () => void;
}) {
  const agentConfig = AGENT_CONFIG[item.assignedAgent];
  const isStale = item.claimedMinutesAgo > 30;

  return (
    <div className={`border rounded-lg p-3 ${isStale ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate" title={item.title}>
            {item.title}
          </h4>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className={`px-1.5 py-0.5 rounded text-xs ${agentConfig.bgColor} ${agentConfig.color}`}>
              {agentConfig.label}
            </span>
            <span className="text-gray-500">{item.claimedByInstance}</span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-sm ${isStale ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
            {Math.round(item.claimedMinutesAgo)}m
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">{item.projectName}</span>
        <button
          onClick={onForceRelease}
          className="text-xs text-red-600 hover:text-red-700"
        >
          Force Release
        </button>
      </div>
    </div>
  );
}

export function AgentInstancesPanel() {
  const {
    agentInstances,
    claimedItems,
    loading,
    error,
    fetchAgentInstances,
    fetchClaimedItems,
    deactivateAgent,
    forceReleaseItem,
  } = useAgentActivityStore();

  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const [confirmRelease, setConfirmRelease] = useState<string | null>(null);

  useEffect(() => {
    fetchAgentInstances();
    fetchClaimedItems();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAgentInstances();
      fetchClaimedItems();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAgentInstances, fetchClaimedItems]);

  const handleDeactivate = async (instanceId: string) => {
    if (confirmDeactivate !== instanceId) {
      setConfirmDeactivate(instanceId);
      return;
    }
    await deactivateAgent(instanceId);
    setConfirmDeactivate(null);
  };

  const handleForceRelease = async (workItemId: string) => {
    if (confirmRelease !== workItemId) {
      setConfirmRelease(workItemId);
      return;
    }
    await forceReleaseItem(workItemId);
    setConfirmRelease(null);
  };

  if (loading && agentInstances.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        Loading agent instances...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent Instances */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Agent Instances</h3>
        {error && (
          <div className="text-red-600 bg-red-50 rounded-lg p-3 text-sm mb-3">{error}</div>
        )}
        {agentInstances.length === 0 ? (
          <div className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
            No agent instances registered
          </div>
        ) : (
          <div className="grid gap-3">
            {agentInstances.map((instance) => (
              <div key={instance.id}>
                <AgentInstanceCard
                  instance={instance}
                  onDeactivate={() => handleDeactivate(instance.id)}
                />
                {confirmDeactivate === instance.id && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 mb-2">
                      Deactivate this agent? Any claimed items will be released.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeactivate(instance.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeactivate(null)}
                        className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Currently Claimed Items */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Currently Claimed Items
          {claimedItems.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({claimedItems.length} active)
            </span>
          )}
        </h3>
        {claimedItems.length === 0 ? (
          <div className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
            No items currently claimed by agents
          </div>
        ) : (
          <div className="grid gap-3">
            {claimedItems.map((item) => (
              <div key={item.id}>
                <ClaimedItemCard
                  item={item}
                  onForceRelease={() => handleForceRelease(item.id)}
                />
                {confirmRelease === item.id && (
                  <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-700 mb-2">
                      Force release this item? The agent will lose its claim.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleForceRelease(item.id)}
                        className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmRelease(null)}
                        className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {agentInstances.filter((a) => a.status === 'active').length}
          </div>
          <div className="text-xs text-gray-500">Active Agents</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{claimedItems.length}</div>
          <div className="text-xs text-gray-500">Items Claimed</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {claimedItems.filter((i) => i.claimedMinutesAgo > 30).length}
          </div>
          <div className="text-xs text-gray-500">Stale Claims</div>
        </div>
      </div>
    </div>
  );
}
