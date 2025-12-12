import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTaskStore } from './task-store';
import { useUserStore } from './user-store';
import { useNotificationStore } from './notification-store';

// Mock the stores
vi.mock('./user-store', () => ({
  useUserStore: vi.fn()
}));

vi.mock('./notification-store', () => ({
  useNotificationStore: vi.fn()
}));

describe('TaskStore - Task Assignment', () => {
  let taskStore: any;
  let mockUserStore: any;
  let mockNotificationStore: any;

  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test task description',
    status: 'todo' as const,
    priority: 'medium' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const mockCurrentUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    isActive: true
  };

  const mockAssignee = {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    isActive: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUserStore = {
      getCurrentUser: vi.fn(() => mockCurrentUser),
      users: [mockCurrentUser, mockAssignee]
    };

    mockNotificationStore = {
      addNotification: vi.fn()
    };

    vi.mocked(useUserStore).mockReturnValue(mockUserStore);
    vi.mocked(useNotificationStore).mockReturnValue(mockNotificationStore);

    // Reset store state
    taskStore = useTaskStore.getState();
    taskStore.tasks = [mockTask];
    taskStore.currentUser = mockCurrentUser;
  });

  afterEach(() => {
    useTaskStore.getState().tasks = [];
    useTaskStore.getState().currentUser = null;
  });

  describe('assignTask', () => {
    it('assigns task to user successfully', async () => {
      // Arrange
      const assignmentDate = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(assignmentDate);

      // Act
      await taskStore.assignTask('task-1', 'user-2');

      // Assert
      const updatedTask = taskStore.getTask('task-1');
      expect(updatedTask.assigneeId).toBe('user-2');
      expect(updatedTask.assignedBy).toBe('user-1');
      expect(updatedTask.assignedAt).toEqual(assignmentDate);
      expect(updatedTask.updatedAt).toEqual(assignmentDate);

      vi.useRealTimers();
    });

    it('records assignment metadata correctly', async () => {
      // Arrange
      const assignmentDate = new Date('2024-01-15T10:30:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(assignmentDate);

      // Act
      await taskStore.assignTask('task-1', 'user-2');

      // Assert
      const updatedTask = taskStore.getTask('task-1');
      expect(updatedTask).toMatchObject({
        id: 'task-1',
        assigneeId: 'user-2',
        assignedBy: 'user-1',
        assignedAt: assignmentDate,
        updatedAt: assignmentDate
      });

      vi.useRealTimers();
    });

    it('prevents assignment without current user (no permissions)', async () => {
      // Arrange
      taskStore.currentUser = null;
      mockUserStore.getCurrentUser.mockReturnValue(null);

      // Act & Assert
      await expect(taskStore.assignTask('task-1', 'user-2')).rejects.toThrow(
        'No current user found'
      );
    });

    it('prevents assignment to inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockAssignee, isActive: false };
      mockUserStore.users = [mockCurrentUser, inactiveUser];

      // Act & Assert
      await expect(taskStore.assignTask('task-1', 'user-2')).rejects.toThrow(
        'Cannot assign task to inactive user'
      );
    });

    it('prevents assignment to non-existent user', async () => {
      // Arrange
      mockUserStore.users = [mockCurrentUser];

      // Act & Assert
      await expect(taskStore.assignTask('task-1', 'non-existent-user')).rejects.toThrow(
        'User not found'
      );
    });

    it('prevents assignment of non-existent task', async () => {
      // Arrange
      taskStore.tasks = [];

      // Act & Assert
      await expect(taskStore.assignTask('non-existent-task', 'user-2')).rejects.toThrow(
        'Task not found'
      );
    });

    it('updates task in store correctly when reassigning', async () => {
      // Arrange
      const alreadyAssignedTask = {
        ...mockTask,
        assigneeId: 'user-3',
        assignedBy: 'user-1',
        assignedAt: new Date('2024-01-01')
      };
      taskStore.tasks = [alreadyAssignedTask];

      const reassignmentDate = new Date('2024-01-02');
      vi.useFakeTimers();
      vi.setSystemTime(reassignmentDate);

      // Act
      await taskStore.assignTask('task-1', 'user-2');

      // Assert
      const updatedTask = taskStore.getTask('task-1');
      expect(updatedTask.assigneeId).toBe('user-2');
      expect(updatedTask.assignedBy).toBe('user-1');
      expect(updatedTask.assignedAt).toEqual(reassignmentDate);
      expect(updatedTask.updatedAt).toEqual(reassignmentDate);

      vi.useRealTimers();
    });

    it('creates notification for task assignment', async () => {
      // Arrange & Act
      await taskStore.assignTask('task-1', 'user-2');

      // Assert
      expect(mockNotificationStore.addNotification).toHaveBeenCalledWith({
        type: 'task_assignment',
        title: 'Task Assigned',
        message: `You have been assigned to task: ${mockTask.title}`,
        userId: 'user-2'
      });
    });

    it('handles self-assignment correctly', async () => {
      // Arrange
      const assignmentDate = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(assignmentDate);

      // Act
      await taskStore.assignTask('task-1', 'user-1');

      // Assert
      const updatedTask = taskStore.getTask('task-1');
      expect(updatedTask.assigneeId).toBe('user-1');
      expect(updatedTask.assignedBy).toBe('user-1');
      expect(mockNotificationStore.addNotification).toHaveBeenCalledWith({
        type: 'task_assignment',
        title: 'Task Assigned',
        message: `You have been assigned to task: ${mockTask.title}`,
        userId: 'user-1'
      });

      vi.useRealTimers();
    });

    it('preserves other task properties during assignment', async () => {
      // Arrange
      const complexTask = {
        ...mockTask,
        description: 'Complex task description',
        priority: 'high' as const,
        dueDate: new Date('2024-02-01'),
        tags: ['urgent', 'frontend']
      };
      taskStore.tasks = [complexTask];

      // Act
      await taskStore.assignTask('task-1', 'user-2');

      // Assert
      const updatedTask = taskStore.getTask('task-1');
      expect(updatedTask.description).toBe('Complex task description');
      expect(updatedTask.priority).toBe('high');
      expect(updatedTask.dueDate).toEqual(new Date('2024-02-01'));
      expect(updatedTask.tags).toEqual(['urgent', 'frontend']);
    });

    it('updates multiple tasks in store correctly', async () => {
      // Arrange
      const secondTask = {
        id: 'task-2',
        title: 'Second Task',
        status: 'in-progress' as const,
        priority: 'low' as const,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      };
      taskStore.tasks = [mockTask, secondTask];

      // Act
      await taskStore.assignTask('task-1', 'user-2');

      // Assert
      const task1 = taskStore.getTask('task-1');
      const task2 = taskStore.getTask('task-2');
      
      expect(task1.assigneeId).toBe('user-2');
      expect(task2.assigneeId).toBeUndefined();
      expect(taskStore.tasks).toHaveLength(2);
    });

    it('handles concurrent assignment attempts gracefully', async () => {
      // Arrange
      const assignmentPromises = [
        taskStore.assignTask('task-1', 'user-2'),
        taskStore.assignTask('task-1', 'user-2')
      ];

      // Act & Assert
      await expect(Promise.all(assignmentPromises)).resolves.not.toThrow();
      
      const finalTask = taskStore.getTask('task-1');
      expect(finalTask.assigneeId).toBe('user-2');
    });
  });

  describe('unassignTask', () => {
    beforeEach(() => {
      const assignedTask = {
        ...mockTask,
        assigneeId: 'user-2',
        assignedBy: 'user-1',
        assignedAt: new Date('2024-01-01')
      };
      taskStore.tasks = [assignedTask];
    });

    it('unassigns task successfully', async () => {
      // Arrange
      const unassignmentDate = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(unassignmentDate);

      // Act
      await taskStore.unassignTask('task-1');

      // Assert
      const updatedTask = taskStore.getTask('task-1');
      expect(updatedTask.assigneeId).toBeUndefined();
      expect(updatedTask.assignedBy).toBeUndefined();
      expect(updatedTask.assignedAt).toBeUndefined();
      expect(updatedTask.updatedAt).toEqual(unassignmentDate);

      vi.useRealTimers();
    });

    it('prevents unassignment without permissions', async () => {
      // Arrange
      taskStore.currentUser = null;
      mockUserStore.getCurrentUser.mockReturnValue(null);

      // Act & Assert
      await expect(taskStore.unassignTask('task-1')).rejects.toThrow(
        'No current user found'
      );
    });
  });
});