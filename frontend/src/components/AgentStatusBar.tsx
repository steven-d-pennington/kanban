import { useKanbanStore } from '../store/kanbanStore';
import { AGENT_CONFIG } from '../types';
import type { AgentType } from '../types';
import { Bot, Activity, Circle, AlertCircle } from 'lucide-react';

export function AgentStatusBar() {
  const { activeAgents } = useKanbanStore();

  const getAgentCounts = () => {
    const counts: Record<NonNullable<AgentType>, { total: number; active: number }> = {
      project_manager: { total: 0, active: 0 },
      scrum_master: { total: 0, active: 0 },
      developer: { total: 0, active: 0 },
    };

    activeAgents.forEach((agent) => {
      if (agent.agentType) {
        counts[agent.agentType].total++;
        if (agent.status === 'processing') {
          counts[agent.agentType].active++;
        }
      }
    });

    return counts;
  };

  const agentCounts = getAgentCounts();
  const totalActive = activeAgents.filter((a) => a.status === 'processing').length;
  const totalIdle = activeAgents.filter((a) => a.status === 'idle').length;
  const totalError = activeAgents.filter((a) => a.status === 'error').length;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white px-6 py-3 border-t border-gray-700">
      <div className="flex items-center justify-between">
        {/* Left: Agent status */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            <span className="font-medium">Active Agents</span>
          </div>

          <div className="flex items-center gap-4">
            {(Object.entries(agentCounts) as [NonNullable<AgentType>, { total: number; active: number }][]).map(
              ([agentType, count]) => (
                <div key={agentType} className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      count.active > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                    }`}
                  />
                  <span className="text-sm text-gray-300">{AGENT_CONFIG[agentType].label}</span>
                  <span className="text-sm font-medium">
                    {count.active}/{count.total}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Center: Status indicators */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Circle className="w-3 h-3 fill-green-400 text-green-400" />
            <span className="text-sm text-gray-300">Processing:</span>
            <span className="text-sm font-medium">{totalActive}</span>
          </div>

          <div className="flex items-center gap-2">
            <Circle className="w-3 h-3 fill-gray-500 text-gray-500" />
            <span className="text-sm text-gray-300">Idle:</span>
            <span className="text-sm font-medium">{totalIdle}</span>
          </div>

          {totalError > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-300">Errors:</span>
              <span className="text-sm font-medium text-red-400">{totalError}</span>
            </div>
          )}
        </div>

        {/* Right: Activity feed preview */}
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Last activity: 2 min ago</span>
        </div>
      </div>
    </div>
  );
}
