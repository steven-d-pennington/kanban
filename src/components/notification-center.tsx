import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, User } from 'lucide-react';
import { useNotificationStore } from '../stores/notification-store';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: {
    id: string;
    type: 'task_assigned' | 'task_completed' | 'task_overdue' | 'system';
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
    metadata?: {
      taskId?: string;
      assignedBy?: string;
      projectName?: string;
    };
  };
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onRemove,
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'task_assigned':
        return <User className="w-5 h-5 text-blue-500" />;
      case 'task_completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'task_overdue':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'system':
        return <Info className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBgColor = () => {
    if (notification.read) return 'bg-white';
    switch (notification.type) {
      case 'task_assigned':
        return 'bg-blue-50';
      case 'task_completed':
        return 'bg-green-50';
      case 'task_overdue':
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${getBgColor()}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">{getIcon()}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                {notification.message}
              </p>
              
              {notification.metadata && (
                <div className="mt-2 space-y-1">
                  {notification.metadata.assignedBy && (
                    <p className="text-xs text-gray-500">
                      Assigned by: {notification.metadata.assignedBy}
                    </p>
                  )}
                  {notification.metadata.projectName && (
                    <p className="text-xs text-gray-500">
                      Project: {notification.metadata.projectName}
                    </p>
                  )}
                </div>
              )}
              
              <p className="text-xs text-gray-400 mt-2">
                {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
              </p>
            </div>
            
            <button
              onClick={() => onRemove(notification.id)}
              className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600"
              aria-label="Remove notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {!notification.read && (
            <div className="mt-3">
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Mark as read
              </button>
            </div>
          )}
        </div>
        
        {!notification.read && (
          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
        )}
      </div>
    </div>
  );
};

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleRemove = (id: string) => {
    removeNotification(id);
  };

  const handleClearAll = () => {
    clearAll();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  You'll see updates about tasks and projects here
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;