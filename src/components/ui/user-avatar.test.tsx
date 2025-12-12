import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserAvatar } from './user-avatar';

// Mock the utils function
vi.mock('../../lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}));

describe('UserAvatar', () => {
  const mockUser = {
    name: 'John Doe',
    email: 'john.doe@example.com'
  };

  const mockUserWithAvatar = {
    ...mockUser,
    avatar: 'https://example.com/avatar.jpg'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('displays user initials when no avatar', () => {
    it('should display initials from first and last name', () => {
      render(<UserAvatar user={mockUser} />);
      
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should display single initial for single name', () => {
      const singleNameUser = { ...mockUser, name: 'John' };
      render(<UserAvatar user={singleNameUser} />);
      
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should display first two letters if name has no spaces', () => {
      const noSpaceUser = { ...mockUser, name: 'Johnny' };
      render(<UserAvatar user={noSpaceUser} />);
      
      expect(screen.getByText('Jo')).toBeInTheDocument();
    });

    it('should display initials from multiple names', () => {
      const multipleNameUser = { ...mockUser, name: 'John Michael Doe' };
      render(<UserAvatar user={multipleNameUser} />);
      
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should handle empty name gracefully', () => {
      const emptyNameUser = { ...mockUser, name: '' };
      render(<UserAvatar user={emptyNameUser} />);
      
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('should handle name with only spaces', () => {
      const spacesUser = { ...mockUser, name: '   ' };
      render(<UserAvatar user={spacesUser} />);
      
      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  describe('shows avatar image when provided', () => {
    it('should render avatar image when avatar URL is provided', () => {
      render(<UserAvatar user={mockUserWithAvatar} />);
      
      const avatarImage = screen.getByRole('img', { name: /john doe/i });
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should have correct alt text for avatar image', () => {
      render(<UserAvatar user={mockUserWithAvatar} />);
      
      const avatarImage = screen.getByRole('img', { name: /john doe/i });
      expect(avatarImage).toHaveAttribute('alt', 'John Doe');
    });

    it('should fallback to initials when avatar fails to load', async () => {
      render(<UserAvatar user={mockUserWithAvatar} />);
      
      const avatarImage = screen.getByRole('img', { name: /john doe/i });
      
      // Simulate image load error
      Object.defineProperty(avatarImage, 'complete', { value: true });
      Object.defineProperty(avatarImage, 'naturalHeight', { value: 0 });
      
      // Fire error event
      avatarImage.dispatchEvent(new Event('error'));
      
      expect(screen.getByText('JD')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should not display initials when avatar loads successfully', () => {
      render(<UserAvatar user={mockUserWithAvatar} />);
      
      expect(screen.queryByText('JD')).not.toBeInTheDocument();
    });
  });

  describe('generates consistent background colors', () => {
    it('should generate same background color for same name', () => {
      const { rerender } = render(<UserAvatar user={mockUser} />);
      const firstRender = screen.getByText('JD').parentElement;
      const firstStyle = window.getComputedStyle(firstRender!);
      
      rerender(<UserAvatar user={mockUser} />);
      const secondRender = screen.getByText('JD').parentElement;
      const secondStyle = window.getComputedStyle(secondRender!);
      
      expect(firstStyle.backgroundColor).toBe(secondStyle.backgroundColor);
    });

    it('should generate different colors for different names', () => {
      const user1 = { ...mockUser, name: 'Alice Smith' };
      const user2 = { ...mockUser, name: 'Bob Johnson' };
      
      const { rerender } = render(<UserAvatar user={user1} />);
      const aliceElement = screen.getByText('AS').parentElement;
      const aliceColor = window.getComputedStyle(aliceElement!).backgroundColor;
      
      rerender(<UserAvatar user={user2} />);
      const bobElement = screen.getByText('BJ').parentElement;
      const bobColor = window.getComputedStyle(bobElement!).backgroundColor;
      
      expect(aliceColor).not.toBe(bobColor);
    });

    it('should use predefined color palette', () => {
      render(<UserAvatar user={mockUser} />);
      
      const avatarElement = screen.getByText('JD').parentElement;
      const backgroundColor = window.getComputedStyle(avatarElement!).backgroundColor;
      
      // Test that it uses one of the predefined colors
      const expectedColors = [
        'rgb(239, 68, 68)', // red-500
        'rgb(245, 101, 101)', // red-400  
        'rgb(59, 130, 246)', // blue-500
        'rgb(99, 102, 241)', // indigo-500
        'rgb(139, 92, 246)', // violet-500
        'rgb(168, 85, 247)', // purple-500
        'rgb(236, 72, 153)', // pink-500
        'rgb(34, 197, 94)', // green-500
        'rgb(251, 146, 60)', // orange-400
        'rgb(245, 158, 11)' // amber-500
      ];
      
      expect(expectedColors).toContain(backgroundColor);
    });
  });

  describe('handles different sizes correctly', () => {
    it('should apply small size classes', () => {
      render(<UserAvatar user={mockUser} size="sm" />);
      
      const avatarContainer = screen.getByText('JD').closest('div');
      expect(avatarContainer).toHaveClass('w-8', 'h-8', 'text-sm');
    });

    it('should apply medium size classes by default', () => {
      render(<UserAvatar user={mockUser} />);
      
      const avatarContainer = screen.getByText('JD').closest('div');
      expect(avatarContainer).toHaveClass('w-12', 'h-12', 'text-base');
    });

    it('should apply medium size classes when explicitly set', () => {
      render(<UserAvatar user={mockUser} size="md" />);
      
      const avatarContainer = screen.getByText('JD').closest('div');
      expect(avatarContainer).toHaveClass('w-12', 'h-12', 'text-base');
    });

    it('should apply large size classes', () => {
      render(<UserAvatar user={mockUser} size="lg" />);
      
      const avatarContainer = screen.getByText('JD').closest('div');
      expect(avatarContainer).toHaveClass('w-16', 'h-16', 'text-lg');
    });

    it('should apply size classes to avatar image as well', () => {
      render(<UserAvatar user={mockUserWithAvatar} size="lg" />);
      
      const avatarImage = screen.getByRole('img', { name: /john doe/i });
      expect(avatarImage).toHaveClass('w-16', 'h-16');
    });
  });

  describe('additional props handling', () => {
    it('should apply custom className', () => {
      render(<UserAvatar user={mockUser} className="custom-class" />);
      
      const avatarContainer = screen.getByText('JD').closest('div');
      expect(avatarContainer).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      render(<UserAvatar user={mockUser} className="border-2" />);
      
      const avatarContainer = screen.getByText('JD').closest('div');
      expect(avatarContainer).toHaveClass('border-2', 'rounded-full', 'flex', 'items-center', 'justify-center');
    });

    it('should have proper accessibility attributes', () => {
      render(<UserAvatar user={mockUser} />);
      
      const avatarContainer = screen.getByText('JD').closest('div');
      expect(avatarContainer).toHaveAttribute('role', 'img');
      expect(avatarContainer).toHaveAttribute('aria-label', 'John Doe');
    });

    it('should have proper accessibility attributes for avatar image', () => {
      render(<UserAvatar user={mockUserWithAvatar} />);
      
      const avatarImage = screen.getByRole('img', { name: /john doe/i });
      expect(avatarImage).toHaveAttribute('alt', 'John Doe');
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in name', () => {
      const specialCharUser = { ...mockUser, name: 'José María' };
      render(<UserAvatar user={specialCharUser} />);
      
      expect(screen.getByText('JM')).toBeInTheDocument();
    });

    it('should handle numeric characters in name', () => {
      const numericUser = { ...mockUser, name: 'User123 Test456' };
      render(<UserAvatar user={numericUser} />);
      
      expect(screen.getByText('UT')).toBeInTheDocument();
    });

    it('should handle very long names', () => {
      const longNameUser = { ...mockUser, name: 'VeryLongFirstName VeryLongLastName' };
      render(<UserAvatar user={longNameUser} />);
      
      expect(screen.getByText('VV')).toBeInTheDocument();
    });

    it('should be case insensitive for initials', () => {
      const lowerCaseUser = { ...mockUser, name: 'john doe' };
      render(<UserAvatar user={lowerCaseUser} />);
      
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });
});