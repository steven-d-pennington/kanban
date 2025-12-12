import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'task_assignment' | 'task_completion' | 'due_reminder' | 'general';
  title: string;
  message: string;
  userId: string;
  createdAt: Date;
  read: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (userId: string) => void;
  getUnreadCount: (userId: string) => number;
  getNotificationsByUserId: (userId: string) => Notification[];
  removeNotification: (notificationId: string) => void;
  clearNotifications: (userId: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      read: false,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }));
  },

  markAsRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      ),
    }));
  },

  markAllAsRead: (userId) => {
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.userId === userId
          ? { ...notification, read: true }
          : notification
      ),
    }));
  },

  getUnreadCount: (userId) => {
    const { notifications } = get();
    return notifications.filter(
      (notification) => notification.userId === userId && !notification.read
    ).length;
  },

  getNotificationsByUserId: (userId) => {
    const { notifications } = get();
    return notifications
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  removeNotification: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== notificationId
      ),
    }));
  },

  clearNotifications: (userId) => {
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.userId !== userId
      ),
    }));
  },
}));

// Helper function for creating task assignment notifications
export const createTaskAssignmentNotification = (
  task: { id: string; title: string; description?: string },
  assignee: { id: string; name: string; email: string },
  assigner: { id: string; name: string; email: string }
): Omit<Notification, 'id' | 'createdAt' | 'read'> => {
  return {
    type: 'task_assignment',
    title: 'New Task Assignment',
    message: `${assigner.name} assigned you the task "${task.title}"`,
    userId: assignee.id,
  };
};

// Additional helper functions for other notification types
export const createTaskCompletionNotification = (
  task: { id: string; title: string },
  completedBy: { id: string; name: string },
  taskOwner: { id: string; name: string }
): Omit<Notification, 'id' | 'createdAt' | 'read'> => {
  return {
    type: 'task_completion',
    title: 'Task Completed',
    message: `${completedBy.name} completed the task "${task.title}"`,
    userId: taskOwner.id,
  };
};

export const createDueReminderNotification = (
  task: { id: string; title: string; dueDate: Date },
  userId: string
): Omit<Notification, 'id' | 'createdAt' | 'read'> => {
  return {
    type: 'due_reminder',
    title: 'Task Due Reminder',
    message: `Task "${task.title}" is due soon`,
    userId,
  };
};

export const createGeneralNotification = (
  title: string,
  message: string,
  userId: string
): Omit<Notification, 'id' | 'createdAt' | 'read'> => {
  return {
    type: 'general',
    title,
    message,
    userId,
  };
};