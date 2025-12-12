import React from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { useAgentStore } from '../stores/agent-store';

interface AgentListItemProps {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'loading';
  description?: string;
  lastActivity?: Date;
  disabled?: boolean;
}

/**
 * Individual agent list item component with pause/resume functionality
 */
export const AgentListItem: React.FC<AgentListItemProps> = ({
  id,
  name,
  status,
  description,
  lastActivity,
  disabled = false,
}) => {
  const { pauseAgent, resumeAgent, isAgentLoading } = useAgentStore();
  const isLoading = isAgentLoading(id) || status === 'loading';

  const handleToggleStatus = async () => {
    if (disabled || isLoading) return;

    try {
      if (status === 'active') {
        await pauseAgent(id);
      } else if (status === 'paused') {
        await resumeAgent(id);
      }
    } catch (error) {
      console.error(`Failed to toggle agent ${id} status:`, error);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'paused':
        return 'text-yellow-600';
      case 'loading':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getButtonIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    return status === 'active' ? (
      <Pause className="h-4 w-4" />
    ) : (
      <Play className="h-4 w-4" />
    );
  };

  const formatLastActivity = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div
      className={`
        flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 
        shadow-sm hover:shadow-md transition-shadow duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {name}
            </h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1 truncate">
                {description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`
                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${getStatusColor()} bg-current bg-opacity-10
              `}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            <span className="text-xs text-gray-500">
              {formatLastActivity(lastActivity)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={handleToggleStatus}
          disabled={disabled || isLoading}
          className={`
            inline-flex items-center justify-center w-8 h-8 rounded-full
            transition-colors duration-200 focus:outline-none focus:ring-2 
            focus:ring-offset-2 focus:ring-blue-500
            ${
              disabled || isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : status === 'active'
                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }
          `}
          title={
            isLoading
              ? 'Loading...'
              : status === 'active'
              ? 'Pause agent'
              : 'Resume agent'
          }
        >
          {getButtonIcon()}
        </button>
      </div>
    </div>
  );
};