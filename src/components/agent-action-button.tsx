import React from 'react';
import { Pause, Play, Loader2 } from 'lucide-react';

interface AgentActionButtonProps {
  action: 'pause' | 'resume';
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Reusable button component for agent actions
 * Displays appropriate icon and styling based on the action type
 */
export const AgentActionButton: React.FC<AgentActionButtonProps> = ({
  action,
  onClick,
  disabled = false,
  loading = false,
}) => {
  const isPause = action === 'pause';
  
  const getIcon = () => {
    if (loading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    return isPause ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />;
  };

  const getStyles = () => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    if (isPause) {
      return `${baseStyles} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500`;
    }
    
    return `${baseStyles} bg-green-600 hover:bg-green-700 text-white focus:ring-green-500`;
  };

  const getLabel = () => {
    if (loading) {
      return isPause ? 'Pausing...' : 'Resuming...';
    }
    return isPause ? 'Pause' : 'Resume';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={getStyles()}
      aria-label={`${action} agent`}
    >
      {getIcon()}
      {getLabel()}
    </button>
  );
};

export default AgentActionButton;