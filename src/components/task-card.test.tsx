import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from './task-card';
import type { User } from '../types/user';

// Mock the UserAvatar component
vi.mock('./user-avatar', () => ({
  UserAvatar: ({ user, size, className }: { user: User; size?: string; className?: string }) => (
    <div 
      data-testid="user-avatar" 
      data-user-name={user.name}
      data-size={size}
      className={className}
    >
      {user.name.charAt(0).toUpperCase()}
    </div>
  )
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon">User Icon</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar Icon</div>,
  Flag: () => <div data-testid="flag-icon">Flag Icon</div>
}));

describe('TaskCard', () => {
  const mockUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://example.com/avatar.jpg',
    isActive: true
  };

  const baseProps = {
    id: '1',
    title: 'Test Task',
    description: 'Test description',
    status: 'todo' as const,
    priority: 'medium' as const,
    dueDate: new Date('2024-01-15'),
    tags: ['frontend', 'urgent']
  };

  const mockOnClick = vi.fn();
  const mockOnAssigneeClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Assignee Avatar Display', () => {
    it('shows assignee avatar when assigned', () => {
      render(
        <TaskCard
          {...baseProps}
          assignee={mockUser}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      const avatar = screen.getByTestId('user-avatar');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('data-user-name', 'John Doe');
      expect(avatar).toHaveTextContent('J');
    });

    it('shows empty state when unassigned', () => {
      render(
        <TaskCard
          {...baseProps}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      expect(screen.queryByTestId('user-avatar')).not.toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('displays assignee name in tooltip when hovering over avatar', async () => {
      const user = userEvent.setup();
      
      render(
        <TaskCard
          {...baseProps}
          assignee={mockUser}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      const avatarContainer = screen.getByRole('button', { name: /assignee/i });
      
      await user.hover(avatarContainer);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('calls onAssigneeClick when avatar is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TaskCard
          {...baseProps}
          assignee={mockUser}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      const avatarContainer = screen.getByRole('button', { name: /assignee/i });
      await user.click(avatarContainer);

      expect(mockOnAssigneeClick).toHaveBeenCalledTimes(1);
    });

    it('calls onAssigneeClick when unassigned state is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TaskCard
          {...baseProps}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      const unassignedButton = screen.getByRole('button', { name: /assign task/i });
      await user.click(unassignedButton);

      expect(mockOnAssigneeClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Assignment History', () => {
    it('renders assignment history correctly when provided', () => {
      const assignmentHistory = [
        {
          id: '1',
          assignedBy: { id: '2', name: 'Manager User', avatar: 'https://example.com/manager.jpg' },
          assignedTo: mockUser,
          assignedAt: new Date('2024-01-10T10:00:00Z'),
          previousAssignee: { id: '3', name: 'Previous User' }
        },
        {
          id: '2',
          assignedBy: { id: '4', name: 'Admin User' },
          assignedTo: { id: '3', name: 'Previous User', avatar: 'https://example.com/prev.jpg' },
          assignedAt: new Date('2024-01-05T15:30:00Z')
        }
      ];

      render(
        <TaskCard
          {...baseProps}
          assignee={mockUser}
          assignmentHistory={assignmentHistory}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      // Check if assignment history section is rendered
      expect(screen.getByText('Assignment History')).toBeInTheDocument();
      
      // Check if both assignment records are displayed
      expect(screen.getByText('Manager User')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Previous User')).toBeInTheDocument();
    });

    it('shows assignment dates in relative format', () => {
      const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const assignmentHistory = [
        {
          id: '1',
          assignedBy: { id: '2', name: 'Manager User' },
          assignedTo: mockUser,
          assignedAt: recentDate
        }
      ];

      render(
        <TaskCard
          {...baseProps}
          assignee={mockUser}
          assignmentHistory={assignmentHistory}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      expect(screen.getByText(/2 hours ago/)).toBeInTheDocument();
    });

    it('displays reassignment information correctly', () => {
      const assignmentHistory = [
        {
          id: '1',
          assignedBy: { id: '2', name: 'Manager User' },
          assignedTo: mockUser,
          assignedAt: new Date('2024-01-10T10:00:00Z'),
          previousAssignee: { id: '3', name: 'Previous User' }
        }
      ];

      render(
        <TaskCard
          {...baseProps}
          assignee={mockUser}
          assignmentHistory={assignmentHistory}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      expect(screen.getByText(/reassigned from Previous User/)).toBeInTheDocument();
    });

    it('does not render assignment history when empty', () => {
      render(
        <TaskCard
          {...baseProps}
          assignee={mockUser}
          assignmentHistory={[]}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      expect(screen.queryByText('Assignment History')).not.toBeInTheDocument();
    });

    it('does not render assignment history when not provided', () => {
      render(
        <TaskCard
          {...baseProps}
          assignee={mockUser}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      expect(screen.queryByText('Assignment History')).not.toBeInTheDocument();
    });
  });

  describe('Task Card Interaction', () => {
    it('calls onClick when card is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TaskCard
          {...baseProps}
          assignee={mockUser}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      const card = screen.getByRole('article');
      await user.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when assignee area is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TaskCard
          {...baseProps}
          assignee={mockUser}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      const avatarContainer = screen.getByRole('button', { name: /assignee/i });
      await user.click(avatarContainer);

      expect(mockOnClick).not.toHaveBeenCalled();
      expect(mockOnAssigneeClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Task Display Elements', () => {
    it('renders task title and description', () => {
      render(
        <TaskCard
          {...baseProps}
          assignee={mockUser}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('renders priority indicator with correct styling', () => {
      render(
        <TaskCard
          {...baseProps}
          priority="high"
          assignee={mockUser}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      const priorityElement = screen.getByText('High');
      expect(priorityElement).toBeInTheDocument();
      expect(priorityElement).toHaveClass('text-red-600');
    });

    it('renders due date when provided', () => {
      render(
        <TaskCard
          {...baseProps}
          assignee={mockUser}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });

    it('renders tags when provided', () => {
      render(
        <TaskCard
          {...baseProps}
          assignee={mockUser}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    it('handles missing optional props gracefully', () => {
      render(
        <TaskCard
          id="1"
          title="Minimal Task"
          status="todo"
          priority="low"
        />
      );

      expect(screen.getByText('Minimal Task')).toBeInTheDocument();
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
      expect(screen.queryByText('Test description')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for assignee button', () => {
      render(
        <TaskCard
          {...baseProps}
          assignee={mockUser}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      const avatarButton = screen.getByRole('button', { name: /assignee/i });
      expect(avatarButton).toHaveAttribute('aria-label', expect.stringContaining('John Doe'));
    });

    it('has proper ARIA labels for unassigned state', () => {
      render(
        <TaskCard
          {...baseProps}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      const assignButton = screen.getByRole('button', { name: /assign task/i });
      expect(assignButton).toHaveAttribute('aria-label', 'Assign task');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TaskCard
          {...baseProps}
          assignee={mockUser}
          onClick={mockOnClick}
          onAssigneeClick={mockOnAssigneeClick}
        />
      );

      const avatarButton = screen.getByRole('button', { name: /assignee/i });
      
      await user.tab();
      expect(avatarButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockOnAssigneeClick).toHaveBeenCalledTimes(1);
    });
  });
});