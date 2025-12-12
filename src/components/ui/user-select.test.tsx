import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserSelect, User } from '../user-select';

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://example.com/avatar1.jpg'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatar: 'https://example.com/avatar2.jpg'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com'
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice.brown@example.com',
    avatar: 'https://example.com/avatar4.jpg'
  }
];

describe('UserSelect', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renders user list correctly', () => {
    it('should display placeholder when no user is selected', () => {
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
          placeholder="Select a user"
        />
      );

      expect(screen.getByText('Select a user')).toBeInTheDocument();
    });

    it('should display selected user name when value is provided', () => {
      render(
        <UserSelect
          users={mockUsers}
          value={mockUsers[0]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should show user list when combobox is opened', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
        expect(screen.getByText('Alice Brown')).toBeInTheDocument();
      });
    });

    it('should display user emails in the dropdown', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
      });
    });

    it('should show check icon for selected user', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={mockUsers[0]}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      await waitFor(() => {
        const checkIcon = screen.getByTestId('check-icon');
        expect(checkIcon).toBeInTheDocument();
      });
    });
  });

  describe('filters users by search term', () => {
    it('should filter users by name when typing', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'John');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      });
    });

    it('should filter users by email when typing', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'jane.smith');

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    it('should perform case-insensitive filtering', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'ALICE');

      await waitFor(() => {
        expect(screen.getByText('Alice Brown')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    it('should filter by partial matches', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'Jo');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('should show all users when search is cleared', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'John');
      await user.clear(input);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
        expect(screen.getByText('Alice Brown')).toBeInTheDocument();
      });
    });
  });

  describe('handles user selection', () => {
    it('should call onChange with selected user when user is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      await waitFor(() => {
        const johnOption = screen.getByText('John Doe');
        expect(johnOption).toBeInTheDocument();
      });

      const johnOption = screen.getByText('John Doe');
      await user.click(johnOption);

      expect(mockOnChange).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('should update display value when user is selected', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const johnOption = screen.getByText('John Doe');
      await user.click(johnOption);

      rerender(
        <UserSelect
          users={mockUsers}
          value={mockUsers[0]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    it('should close dropdown after selection', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const johnOption = screen.getByText('John Doe');
      await user.click(johnOption);

      await waitFor(() => {
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('should allow selecting null value', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={mockUsers[0]}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const clearOption = screen.getByText('Clear selection');
      await user.click(clearOption);

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it('should not trigger onChange when disabled', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
          disabled
        />
      );

      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeDisabled();

      await user.click(combobox);
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('shows empty state when no users', () => {
    it('should display "No users available" when users array is empty', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={[]}
          value={null}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText('No users available')).toBeInTheDocument();
      });
    });

    it('should display "No users found" when search returns no results', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'NonExistentUser');

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });

    it('should not show empty state when users are available', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.queryByText('No users available')).not.toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('supports keyboard navigation', () => {
    it('should navigate down with ArrowDown key', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        const activeOption = screen.getByRole('option', { name: /john doe/i });
        expect(activeOption).toHaveAttribute('data-headlessui-state', 'active');
      });
    });

    it('should navigate up with ArrowUp key', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');

      await waitFor(() => {
        const activeOption = screen.getByRole('option', { name: /john doe/i });
        expect(activeOption).toHaveAttribute('data-headlessui-state', 'active');
      });
    });

    it('should select user with Enter key', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(mockOnChange).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('should close dropdown with Escape key', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('should cycle through options with Tab key', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      for (let i = 0; i < mockUsers.length; i++) {
        await user.keyboard('{ArrowDown}');
      }

      // Should cycle back to first option
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        const activeOption = screen.getByRole('option', { name: /john doe/i });
        expect(activeOption).toHaveAttribute('data-headlessui-state', 'active');
      });
    });

    it('should maintain focus on combobox when navigating', async () => {
      const user = userEvent.setup();
      
      render(
        <UserSelect
          users={mockUsers}
          value={null}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      await user.keyboard('{ArrowDown}');

      expect(combobox).toH