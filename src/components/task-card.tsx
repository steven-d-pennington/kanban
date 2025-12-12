import React from 'react';
import { User, Calendar, Flag } from 'lucide-react';
import { UserAvatar } from './user-avatar';

interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  tags?: string[];
  onClick?: () => void;
  onAssigneeClick?: () => void;
}

const priorityColors = {
  low: 'text-green-600 bg-green-50 border-green-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  high: 'text-red-600 bg-red-50 border-red-200',
};

const statusColors = {
  'todo': 'bg-gray-100 text-gray-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  'completed': 'bg-green-100 text-green-700',
};

export const TaskCard: React.FC<TaskCardProps> = ({
  id,
  title,
  description,
  status,
  priority,
  dueDate,
  assignee,
  tags = [],
  onClick,
  onAssigneeClick,
}) => {
  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  const isOverdue = dueDate && new Date() > dueDate;

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 space-y-3"
      onClick={onClick}
    >
      {/* Header with title and assignee */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}
            >
              {status.replace('-', ' ')}
            </span>
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[priority]}`}
            >
              <Flag size={10} />
              {priority}
            </div>
          </div>
        </div>

        {/* Assignee Avatar */}
        <div className="flex-shrink-0">
          {assignee ? (
            <div className="group relative">
              <UserAvatar
                user={assignee}
                size="sm"
                className="cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-1 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssigneeClick?.();
                }}
              />
              {/* Tooltip */}
              <div className="absolute right-0 top-full mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {assignee.name}
              </div>
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group"
              onClick={(e) => {
                e.stopPropagation();
                onAssigneeClick?.();
              }}
              title="Assign task"
            >
              <User size={14} className="text-gray-400 group-hover:text-blue-500" />
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Due Date */}
      {dueDate && (
        <div className="flex items-center gap-1 text-xs">
          <Calendar size={12} className={isOverdue ? 'text-red-500' : 'text-gray-500'} />
          <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
            {formatDueDate(dueDate)}
          </span>
        </div>
      )}
    </div>
  );
};