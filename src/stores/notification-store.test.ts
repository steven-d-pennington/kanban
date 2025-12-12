import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useNotificationStore } from './notification-store';
import type { Notification } from './notification-store';

// Mock crypto.randomUUID for consistent test IDs
const mockUUID = vi.fn();
vi.stubGlobal('crypto', {
  randomUUID: mockUUID
});

describe('NotificationStore', () => {
  let store: ReturnType<typeof useNotificationStore>;

  beforeEach(() => {
    // Reset the store before each test
    store = useNotificationStore.getState();
    store.notifications = [];
    
    // Reset UUID mock
    mockUUID.mockReset();
    mockUUID.mockReturnValue('mock-uuid-1');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('creates assignment notification', () => {
    it('should create a task assignment notification with correct properties', () => {
      const mockDate = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(mockDate);

      const notificationData = {
        type: 'task_assignment' as const,
        title: 'Task Assigned',
        message: 'You have been assigned to "Complete project documentation"',
        userId: 'user-123'
      };

      store.addNotification(notificationData);

      expect(store.notifications).toHaveLength(1);
      expect(store.notifications[0]).toEqual({
        id: 'mock-uuid-1',
        type: 'task_assignment',
        title: 'Task Assigned',
        message: 'You have been assigned to "Complete project documentation"',
        userId: 'user-123',
        createdAt: mockDate,
        read: false
      });
    });

    it('should generate unique IDs for multiple notifications', () => {
      mockUUID
        .mockReturnValueOnce('mock-uuid-1')
        .mockReturnValueOnce('mock-uuid-2')
        .mockReturnValueOnce('mock-uuid-3');

      const notification1 = {
        type: 'task_assignment' as const,
        title: 'Task 1',
        message: 'Assignment 1',
        userId: 'user-1'
      };

      const notification2 = {
        type: 'due_reminder' as const,
        title: 'Task 2',
        message: 'Reminder 1',
        userId: 'user-2'
      };

      const notification3 = {
        type: 'task_completion' as const,
        title: 'Task 3',
        message: 'Completion 1',
        userId: 'user-1'
      };

      store.addNotification(notification1);
      store.addNotification(notification2);
      store.addNotification(notification3);

      expect(store.notifications).toHaveLength(3);
      expect(store.notifications[0].id).toBe('mock-uuid-1');
      expect(store.notifications[1].id).toBe('mock-uuid-2');
      expect(store.notifications[2].id).toBe('mock-uuid-3');
    });

    it('should handle different notification types', () => {
      const types: Array<Notification['type']> = [
        'task_assignment',
        'task_completion',
        'due_reminder',
        'general'
      ];

      types.forEach((type, index) => {
        mockUUID.mockReturnValueOnce(`mock-uuid-${index + 1}`);
        
        store.addNotification({
          type,
          title: `${type} notification`,
          message: `Message for ${type}`,
          userId: `user-${index + 1}`
        });
      });

      expect(store.notifications).toHaveLength(4);
      types.forEach((type, index) => {
        expect(store.notifications[index].type).toBe(type);
      });
    });

    it('should set createdAt to current date', () => {
      const mockDate1 = new Date('2024-01-15T10:00:00Z');
      const mockDate2 = new Date('2024-01-15T11:00:00Z');

      vi.setSystemTime(mockDate1);
      store.addNotification({
        type: 'task_assignment',
        title: 'First notification',
        message: 'First message',
        userId: 'user-1'
      });

      vi.setSystemTime(mockDate2);
      mockUUID.mockReturnValueOnce('mock-uuid-2');
      store.addNotification({
        type: 'task_completion',
        title: 'Second notification',
        message: 'Second message',
        userId: 'user-2'
      });

      expect(store.notifications[0].createdAt).toEqual(mockDate1);
      expect(store.notifications[1].createdAt).toEqual(mockDate2);
    });
  });

  describe('marks notifications as read', () => {
    beforeEach(() => {
      // Setup test notifications
      mockUUID
        .mockReturnValueOnce('notif-1')
        .mockReturnValueOnce('notif-2')
        .mockReturnValueOnce('notif-3');

      store.addNotification({
        type: 'task_assignment',
        title: 'Task 1',
        message: 'Assignment 1',
        userId: 'user-1'
      });

      store.addNotification({
        type: 'due_reminder',
        title: 'Task 2',
        message: 'Reminder 1',
        userId: 'user-1'
      });

      store.addNotification({
        type: 'task_completion',
        title: 'Task 3',
        message: 'Completion 1',
        userId: 'user-2'
      });
    });

    it('should mark a single notification as read', () => {
      expect(store.notifications[0].read).toBe(false);

      store.markAsRead('notif-1');

      expect(store.notifications[0].read).toBe(true);
      expect(store.notifications[1].read).toBe(false);
      expect(store.notifications[2].read).toBe(false);
    });

    it('should handle marking non-existent notification', () => {
      const initialState = [...store.notifications];

      store.markAsRead('non-existent-id');

      expect(store.notifications).toEqual(initialState);
    });

    it('should mark all notifications as read for a specific user', () => {
      expect(store.notifications.filter(n => n.userId === 'user-1' && !n.read)).toHaveLength(2);
      expect(store.notifications.filter(n => n.userId === 'user-2' && !n.read)).toHaveLength(1);

      store.markAllAsRead('user-1');

      expect(store.notifications.filter(n => n.userId === 'user-1' && !n.read)).toHaveLength(0);
      expect(store.notifications.filter(n => n.userId === 'user-2' && !n.read)).toHaveLength(1);

      expect(store.notifications[0].read).toBe(true); // user-1's first notification
      expect(store.notifications[1].read).toBe(true); // user-1's second notification
      expect(store.notifications[2].read).toBe(false); // user-2's notification
    });

    it('should handle marking all as read for user with no notifications', () => {
      const initialState = [...store.notifications];

      store.markAllAsRead('non-existent-user');

      expect(store.notifications).toEqual(initialState);
    });

    it('should not affect already read notifications when marking all as read', () => {
      store.markAsRead('notif-1');
      expect(store.notifications[0].read).toBe(true);

      store.markAllAsRead('user-1');

      expect(store.notifications[0].read).toBe(true);
      expect(store.notifications[1].read).toBe(true);
    });
  });

  describe('filters notifications by user', () => {
    beforeEach(() => {
      // Setup test notifications for multiple users
      const notifications = [
        { type: 'task_assignment', title: 'Task 1', message: 'Message 1', userId: 'user-1' },
        { type: 'due_reminder', title: 'Task 2', message: 'Message 2', userId: 'user-2' },
        { type: 'task_completion', title: 'Task 3', message: 'Message 3', userId: 'user-1' },
        { type: 'general', title: 'Task 4', message: 'Message 4', userId: 'user-3' },
        { type: 'task_assignment', title: 'Task 5', message: 'Message 5', userId: 'user-2' }
      ];

      notifications.forEach((notif, index) => {
        mockUUID.mockReturnValueOnce(`notif-${index + 1}`);
        store.addNotification(notif as any);
      });
    });

    it('should return notifications for specific user', () => {
      const user1Notifications = store.getNotificationsByUser('user-1');
      const user2Notifications = store.getNotificationsByUser('user-2');
      const user3Notifications = store.getNotificationsByUser('user-3');

      expect(user1Notifications).toHaveLength(2);
      expect(user2Notifications).toHaveLength(2);
      expect(user3Notifications).toHaveLength(1);

      expect(user1Notifications.every(n => n.userId === 'user-1')).toBe(true);
      expect(user2Notifications.every(n => n.userId === 'user-2')).toBe(true);
      expect(user3Notifications.every(n => n.userId === 'user-3')).toBe(true);
    });

    it('should return empty array for user with no notifications', () => {
      const notifications = store.getNotificationsByUser('non-existent-user');
      expect(notifications).toEqual([]);
    });

    it('should return correct unread count for user', () => {
      expect(store.getUnreadCount('user-1')).toBe(2);
      expect(store.getUnreadCount('user-2')).toBe(2);
      expect(store.getUnreadCount('user-3')).toBe(1);

      store.markAsRead('notif-1'); // user-1's first notification
      expect(store.getUnreadCount('user-1')).toBe(1);
      expect(store.getUnreadCount('user-2')).toBe(2);
    });

    it('should return zero unread count for user with no notifications', () => {
      expect(store.getUnreadCount('non-existent-user')).toBe(0);
    });

    it('should return zero unread count when all notifications are read', () => {
      store.markAllAsRead('user-1');
      expect(store.getUnreadCount('user-1')).toBe(0);
    });
  });

  describe('maintains notification order', () => {
    it('should maintain chronological order (newest first)', () => {
      const dates = [
        new Date('2024-01-15T10:00:00Z'),
        new Date('2024-01-15T11:00:00Z'),
        new Date('2024-01-15T09:00:00Z'),
        new Date('2024-01-15T12:00:00Z')
      ];

      dates.forEach((date, index) => {
        vi.setSystemTime(date);
        mockUUID.mockReturnValueOnce(`notif-${index + 1}`);
        
        store.addNotification({
          type: 'task_assignment',
          title: `Task ${index + 1}`,
          message: `Message ${index + 1}`,
          userId: 'user-1'
        });
      });

      // Notifications should be in the order they were added (insertion order)
      expect(store.notifications[0].createdAt).toEqual(dates[0]); // 10:00
      expect(store.notifications[1].createdAt).toEqual(dates[1]); // 11:00
      expect(store.notifications[2].createdAt).toEqual(dates[2]); // 09:00
      expect(store.notifications[3].createdAt).toEqual(dates[3]); // 12:00
    });

    it('should maintain order when marking notifications as read', () => {
      const mockDate = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(mockDate);

      mockUUID
        .mockReturnValueOnce('notif-1')
        .mockReturnValueOnce('notif-2')
        .mockReturnValueOnce('notif-3');

      ['First', 'Second', 'Third'].forEach((title, index) => {
        store.addNotification({
          type: 'task_assignment',
          title: `${title} notification`,
          message: `Message ${index + 1}`,
          userId: 'user-1'
        });
      });

      const originalOrder = store.notifications.map(n => n.id);

      store.markAsRead('notif-2');

      const newOrder = store.notifications.map(n => n.id);
      expect(newOrder).toEqual(originalOrder);
    });

    it('should maintain order when filtering by user', () => {
      const mockDate = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(mockDate);

      const notifications = [
        { userId: 'user-1', title: 'First' },
        { userId: 'user-2', title: 'Second' },
        { userId: 'user-1', title: 'Third' },
        { userId: 'user-2', title: 'Fourth' },
        { userId: 'user-1', title: 'Fifth' }
      ];

      notifications.forEach((notif, index) => {
        mockUUID.mockReturnValueOnce(`notif-${index + 1}`);
        store.addNotification({
          type: 'task_assignment',
          title: notif.title,
          message: `Message ${index + 1}`,
          userId: notif.userId
        });
      });

      const user1Notifications = store.getNotificationsByUser('user-1');
      expect(user1Notifications).toHaveLength(3);
      expect(user1Notifications[0].title).toBe('First');
      expect(user1Notifications[1].title).toBe('Third');
      expect(user1Notifications[2].title).toBe('Fifth');
    });

    it('should preserve insertion order with mixed operations', () => {
      const mockDate = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(mockDate);

      mockUUID
        .mockReturnValueOnce('notif-1')
        .mockReturnValueOnce('notif-2');

      store.addNotification({
        type: 'task_assignment',
        title: 'First',
        message: 'Message 1',
        userId: 'user-1'
      });

      store.addNotification({
        type: 'due_reminder',
        title: 'Second',
        message: 'Message 2',
        userId: 'user-2'
      });

      store.markAsRead('notif-1');
      
      mockUUID.mockReturnValueOnce('notif-3');
      store.addNotification({
        type: 'task_completion',
        title: 'Third',
        message: 'Message 3',
        userId: 'user-1'
      });

      expect(store.notifications).toHaveLength(3);
      expect(store.notifications[0].title).toBe('First');
      expect(store.notifications[1].title).toBe('Second');
      expect(store.notifications[2].title).toBe('Third');