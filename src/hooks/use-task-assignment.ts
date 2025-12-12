import { useState } from 'react';
import { useTaskStore } from '../stores/task-store';
import { useNotificationStore } from '../stores/notification-store';
import { useUserStore } from '../stores/user-store';

export interface AssignTaskPayload {
  taskId: string;
  assigneeId: string;
  assignedBy: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
}

export interface UnassignTaskPayload {
  taskId: string;
  unassignedBy: string;
  reason?: string;
}

export interface AssignmentValidationError {
  field: string;
  message: string;
}

export interface UseTaskAssignmentReturn {
  assignTask: (payload: AssignTaskPayload) => Promise<boolean>;
  unassignTask: (payload: UnassignTaskPayload) => Promise<boolean>;
  reassignTask: (payload: AssignTaskPayload) => Promise<boolean>;
  bulkAssignTasks: (taskIds: string[], assigneeId: string, assignedBy: string) => Promise<boolean>;
  isAssigning: boolean;
  isUnassigning: boolean;
  isReassigning: boolean;
  isBulkAssigning: boolean;
  validationErrors: AssignmentValidationError[];
  clearErrors: () => void;
}

/**
 * Custom hook to handle task assignment operations with validation and notifications
 * 
 * Features:
 * - Task assignment with validation
 * - Unassignment with optional reason
 * - Task reassignment
 * - Bulk assignment operations
 * - Real-time notifications
 * - Permission validation
 * - Loading states management
 */
export const useTaskAssignment = (): UseTaskAssignmentReturn => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [validationErrors, setValidationErrors] = useState<AssignmentValidationError[]>([]);

  const { 
    assignTaskToUser, 
    unassignTaskFromUser, 
    getTaskById,
    updateTaskPriority,
    updateTaskDueDate,
  } = useTaskStore();

  const { addNotification } = useNotificationStore();
  const { getUserById, currentUser, hasPermission } = useUserStore();

  /**
   * Validates assignment payload and user permissions
   */
  const validateAssignment = (payload: AssignTaskPayload): AssignmentValidationError[] => {
    const errors: AssignmentValidationError[] = [];

    // Check if task exists
    const task = getTaskById(payload.taskId);
    if (!task) {
      errors.push({ field: 'taskId', message: 'Task not found' });
      return errors;
    }

    // Check if assignee exists
    const assignee = getUserById(payload.assigneeId);
    if (!assignee) {
      errors.push({ field: 'assigneeId', message: 'User not found' });
    }

    // Check if assigner exists and has permission
    const assigner = getUserById(payload.assignedBy);
    if (!assigner) {
      errors.push({ field: 'assignedBy', message: 'Assigner not found' });
    } else if (!hasPermission(assigner.id, 'assign_tasks')) {
      errors.push({ field: 'assignedBy', message: 'Insufficient permissions to assign tasks' });
    }

    // Validate due date if provided
    if (payload.dueDate && payload.dueDate < new Date()) {
      errors.push({ field: 'dueDate', message: 'Due date cannot be in the past' });
    }

    // Check if task is already completed
    if (task.status === 'completed') {
      errors.push({ field: 'taskId', message: 'Cannot assign completed tasks' });
    }

    return errors;
  };

  /**
   * Validates unassignment payload and permissions
   */
  const validateUnassignment = (payload: UnassignTaskPayload): AssignmentValidationError[] => {
    const errors: AssignmentValidationError[] = [];

    // Check if task exists
    const task = getTaskById(payload.taskId);
    if (!task) {
      errors.push({ field: 'taskId', message: 'Task not found' });
      return errors;
    }

    // Check if task has an assignee
    if (!task.assigneeId) {
      errors.push({ field: 'taskId', message: 'Task is not currently assigned' });
    }

    // Check if unassigner has permission
    const unassigner = getUserById(payload.unassignedBy);
    if (!unassigner) {
      errors.push({ field: 'unassignedBy', message: 'User not found' });
    } else if (!hasPermission(unassigner.id, 'assign_tasks') && unassigner.id !== task.assigneeId) {
      errors.push({ field: 'unassignedBy', message: 'Insufficient permissions to unassign tasks' });
    }

    return errors;
  };

  /**
   * Creates notification for task assignment
   */
  const createAssignmentNotification = (
    taskId: string,
    assigneeId: string,
    assignedBy: string,
    type: 'assigned' | 'unassigned' | 'reassigned'
  ) => {
    const task = getTaskById(taskId);
    const assignee = getUserById(assigneeId);
    const assigner = getUserById(assignedBy);

    if (!task || !assignee || !assigner) return;

    const notificationMessages = {
      assigned: `You have been assigned to task: ${task.title}`,
      unassigned: `You have been unassigned from task: ${task.title}`,
      reassigned: `Task reassigned: ${task.title}`,
    };

    addNotification({
      id: `task-${type}-${Date.now()}`,
      type: type === 'unassigned' ? 'info' : 'success',
      title: `Task ${type}`,
      message: notificationMessages[type],
      userId: assigneeId,
      timestamp: new Date(),
      read: false,
      actionUrl: `/tasks/${taskId}`,
      metadata: {
        taskId,
        assigneeId,
        assignedBy,
        action: type,
      },
    });

    // Notify assigner if different from assignee
    if (assignedBy !== assigneeId) {
      addNotification({
        id: `task-${type}-confirmation-${Date.now()}`,
        type: 'info',
        title: `Task ${type} confirmed`,
        message: `Successfully ${type} task "${task.title}" ${type === 'unassigned' ? 'from' : 'to'} ${assignee.name}`,
        userId: assignedBy,
        timestamp: new Date(),
        read: false,
        actionUrl: `/tasks/${taskId}`,
        metadata: {
          taskId,
          assigneeId,
          assignedBy,
          action: `${type}_confirmation`,
        },
      });
    }
  };

  /**
   * Assigns a task to a user
   */
  const assignTask = async (payload: AssignTaskPayload): Promise<boolean> => {
    setIsAssigning(true);
    setValidationErrors([]);

    try {
      // Validate assignment
      const errors = validateAssignment(payload);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return false;
      }

      // Perform assignment
      const success = assignTaskToUser(payload.taskId, payload.assigneeId);
      if (!success) {
        setValidationErrors([{ field: 'general', message: 'Failed to assign task' }]);
        return false;
      }

      // Update additional task properties
      if (payload.priority) {
        updateTaskPriority(payload.taskId, payload.priority);
      }
      if (payload.dueDate) {
        updateTaskDueDate(payload.taskId, payload.dueDate);
      }

      // Create notification
      createAssignmentNotification(
        payload.taskId,
        payload.assigneeId,
        payload.assignedBy,
        'assigned'
      );

      return true;
    } catch (error) {
      console.error('Assignment error:', error);
      setValidationErrors([{ field: 'general', message: 'An unexpected error occurred' }]);
      return false;
    } finally {
      setIsAssigning(false);
    }
  };

  /**
   * Unassigns a task from a user
   */
  const unassignTask = async (payload: UnassignTaskPayload): Promise<boolean> => {
    setIsUnassigning(true);
    setValidationErrors([]);

    try {
      // Validate unassignment
      const errors = validateUnassignment(payload);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return false;
      }

      const task = getTaskById(payload.taskId);
      if (!task?.assigneeId) {
        return false;
      }

      const previousAssigneeId = task.assigneeId;

      // Perform unassignment
      const success = unassignTaskFromUser(payload.taskId);
      if (!success) {
        setValidationErrors([{ field: 'general', message: 'Failed to unassign task' }]);
        return false;
      }

      // Create notification
      createAssignmentNotification(
        payload.taskId,
        previousAssigneeId,
        payload.unassignedBy,
        'unassigned'
      );

      return true;
    } catch (error) {
      console.error('Unassignment error:', error);
      setValidationErrors([{ field: 'general', message: 'An unexpected error occurred' }]);
      return false;
    } finally {
      setIsUnassigning(false);
    }
  };

  /**
   * Reassigns a task from one user to another
   */
  const reassignTask = async (payload: AssignTaskPayload): Promise<boolean> => {
    setIsReassigning(true);
    setValidationErrors([]);

    try {
      const task = getTaskById(payload.taskId);
      if (!task) {
        setValidationErrors([{ field: 'taskId', message: 'Task not found' }]);
        return false;
      }

      const previousAssigneeId = task.assigneeId;

      // First unassign if currently assigned
      if (previousAssigneeId && previousAssigneeId !== payload.assigneeId) {
        const unassignSuccess = await unassignTask({
          taskId: payload.taskId,
          unassignedBy: payload.assignedBy,
          reason: 'Task reassignment',
        });
        if (!unassignSuccess) {
          return false;
        }
      }

      // Then assign to new user
      const assignSuccess = await assignTask(payload);
      if (!assignSuccess) {
        return false;
      }

      // Create reassignment notification
      createAssignmentNotification(
        payload.taskId,
        payload.assigneeId,
        payload.assignedBy,
        'reassigned'
      );

      return true;
    } catch (error) {
      console.error('Reassignment error:', error);
      setValidationErrors([{ field: 'general', message: 'An unexpected error occurred' }]);
      return false;
    } finally {
      setIsReassigning(false);
    }
  };

  /**
   * Assigns multiple tasks to a single user
   */
  const bulkAssignTasks = async (
    taskIds: string[],
    assigneeId: string,
    assignedBy: string
  ): Promise<boolean> => {
    setIsBulkAssigning(true);
    setValidationErrors([]);

    try {
      if (taskIds.length === 0) {
        setValidationErrors([{ field: 'taskIds', message: 'No tasks selected for assignment' }]);
        return false;
      }

      // Validate assignee and assigner
      const assignee = getUserById(assigneeId);
      const assigner = getUserById(assignedBy);

      if (!assignee) {
        setValidationErrors([{ field: 'assigneeId', message: 'Assignee not found' }]);
        return false;
      }

      if (!assigner || !hasPermission(assigner.id, 'assign_tasks')) {
        setValidationErrors([{ field: 'assignedBy', message: 'Insufficient permissions' }]);
        return false;
      }

      // Process assignments
      const results = await Promise.allSettled(
        taskIds.map(taskId =>
          assignTask({
            taskId,
            assigneeId,
            assignedBy,
          })
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failed = results.length - successful;

      // Create bulk assignment notification
      addNotification({
        id: `bulk-assignment-${Date.now()}`,
        type: failed > 0 ? 'warning' : 'success',
        title: 'Bulk Assignment Complete',
        message: `${successful} tasks assigned successfully${failed > 0 ? `, ${failed} failed` : ''}`,
        userId: assignedBy,
        timestamp: new Date(),
        read: false,
        metadata: {
          assigneeId,
          assignedBy,
          totalTasks: taskIds.length,
          successful,
          failed,
          action: 'bulk_assignment',
        },
      });

      return failed === 0;
    } catch (error) {
      console.error('Bulk assignment error:', error);
      setValidationErrors([{ field: 'general', message: 'An unexpected error occurred' }]);
      return false;
    } finally {
      setIsBulkAssigning(false);
    }
  };

  /**
   * Clears validation errors
   */
  const clearErrors = () => {
    setValidationErrors([]);
  };

  return {
    assignTask,
    unassignTask,
    reassignTask,
    bulkAssignTasks,
    isAssigning,
    isUnassigning,
    isReassigning,
    isBulkAssigning,
    validationErrors,
    clearErrors,
  };
};