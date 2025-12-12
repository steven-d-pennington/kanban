export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'task_assignment';
  title: string;
  message: string;
  userId: string;
  createdAt: Date;
  read: boolean;
}

export interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (userId: string) => void;
  getUnreadCount: (userId: string) => number;
  getUserNotifications: (userId: string) => Notification[];
  removeNotification: (notificationId: string) => void;
  clearUserNotifications: (userId: string) => void;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigneeId?: string;
  projectId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export type CreateNotificationParams = Omit<Notification, 'id' | 'createdAt'>;

export interface NotificationHelpers {
  createTaskAssignmentNotification: (
    task: Task,
    assignee: User,
    assigner: User
  ) => CreateNotificationParams;
  createTaskCompletionNotification: (
    task: Task,
    completedBy: User,
    assignerId: string
  ) => CreateNotificationParams;
  createProjectInvitationNotification: (
    projectName: string,
    invitedBy: User,
    inviteeId: string
  ) => CreateNotificationParams;
}