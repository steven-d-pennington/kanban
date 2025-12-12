import React from 'react';
import { formatDistanceToNow } from 'date-fns';

interface AssignmentRecord {
  id: string;
  assignedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  assignedTo: {
    id: string;
    name: string;
    avatar?: string;
  };
  assignedAt: Date;
  previousAssignee?: {
    id: string;
    name: string;
  };
}

interface TaskAssignmentHistoryProps {
  history: AssignmentRecord[];
  className?: string;
}

/**
 * Component to display the assignment history of a task
 * Shows who assigned the task, to whom, and when
 */
export const TaskAssignmentHistory: React.FC<TaskAssignmentHistoryProps> = ({
  history,
  className = '',
}) => {
  if (!history || history.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No assignment history available
      </div>
    );
  }

  const formatRelativeTime = (date: Date): string => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const UserAvatar: React.FC<{ user: { name: string; avatar?: string }; size?: 'sm' | 'xs' }> = ({
    user,
    size = 'xs',
  }) => {
    const sizeClasses = size === 'sm' ? 'w-6 h-6' : 'w-4 h-4';
    const textSizeClasses = size === 'sm' ? 'text-xs' : 'text-[10px]';

    return user.avatar ? (
      <img
        src={user.avatar}
        alt={user.name}
        className={`${sizeClasses} rounded-full object-cover`}
      />
    ) : (
      <div
        className={`${sizeClasses} rounded-full bg-blue-500 flex items-center justify-center text-white font-medium ${textSizeClasses}`}
      >
        {user.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-900 mb-3">Assignment History</h4>
      
      <div className="space-y-2">
        {history.map((record, index) => (
          <div
            key={record.id}
            className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg border"
          >
            <div className="flex-shrink-0 mt-0.5">
              <UserAvatar user={record.assignedBy} size="sm" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-900">
                <span className="font-medium">{record.assignedBy.name}</span>
                <span className="text-gray-600"> assigned this task to </span>
                <span className="font-medium inline-flex items-center space-x-1">
                  <UserAvatar user={record.assignedTo} />
                  <span>{record.assignedTo.name}</span>
                </span>
              </div>
              
              {record.previousAssignee && (
                <div className="text-xs text-gray-500 mt-1">
                  Previously assigned to {record.previousAssignee.name}
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-1">
                {formatRelativeTime(record.assignedAt)}
              </div>
            </div>
            
            {index === 0 && (
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Current
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {history.length > 5 && (
        <button
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          onClick={() => {
            // Implement show more functionality
            console.log('Show more assignment history');
          }}
        >
          Show more history
        </button>
      )}
    </div>
  );
};

export default TaskAssignmentHistory;