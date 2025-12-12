import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

// Mock the accessibility utils
vi.mock('../../utils/accessibility', () => ({
  calculateContrastRatio: vi.fn(),
  isWCAGCompliant: vi.fn(),
  WCAG_AA_NORMAL: 4.5,
  ACCESSIBLE_COLOR_PAIRS: {
    light: {
      background: '#ffffff',
      text: '#1a1a1a',
      textSecondary: '#4a4a4a',
      primary: '#2563eb',
      error: '#dc2626'
    },
    dark: {
      background: '#1a1a1a',
      text: '#ffffff',
      textSecondary: '#d1d5db',
      primary: '#3b82f6',
      error: '#ef4444'
    }
  }
}));

// Mock the cn utility
vi.mock('../../lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}));

describe('Input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('contrast classes', () => {
    it('renders with proper contrast classes in default variant', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass('text-gray-900');
      expect(input).toHaveClass('bg-white');
      expect(input).toHaveClass('border-gray-300');
    });

    it('renders with proper contrast classes in destructive variant', () => {
      render(<Input variant="destructive" data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass('border-red-500');
      expect(input).toHaveClass('focus:border-red-600');
      expect(input).toHaveClass('focus:ring-red-600');
    });

    it('renders with error state contrast classes', () => {
      render(<Input error={true} data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass('border-red-500');
      expect(input).toHaveClass('focus:border-red-600');
      expect(input).toHaveClass('focus:ring-red-600');
    });

    it('renders with disabled state maintaining sufficient contrast', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:opacity-50');
      expect(input).toHaveClass('bg-white');
    });

    it('applies placeholder text with sufficient contrast', () => {
      render(
        <Input 
          placeholder="Enter your text" 
          data-testid="input"
        />
      );
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass('placeholder:text-muted-foreground');
      expect(input).toHaveAttribute('placeholder', 'Enter your text');
    });

    it('maintains text contrast in different input types', () => {
      const types = ['text', 'email', 'password', 'number', 'tel', 'url'];
      
      types.forEach(type => {
        render(<Input type={type} data-testid={`input-${type}`} />);
        const input = screen.getByTestId(`input-${type}`);
        
        expect(input).toHaveClass('text-gray-900');
        expect(input).toHaveClass('bg-white');
      });
    });
  });

  describe('focus states contrast', () => {
    it('has sufficient contrast in focus state', async () => {
      const user = userEvent.setup();
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      
      await user.click(input);
      
      expect(input).toHaveClass('focus:border-blue-500');
      expect(input).toHaveClass('focus:ring-blue-500');
      expect(input).toHaveClass('focus:ring-2');
      expect(input).toHaveClass('focus:ring-offset-2');
    });

    it('maintains focus contrast in destructive variant', async () => {
      const user = userEvent.setup();
      render(<Input variant="destructive" data-testid="input" />);
      const input = screen.getByTestId('input');
      
      await user.click(input);
      
      expect(input).toHaveClass('focus:border-red-600');
      expect(input).toHaveClass('focus:ring-red-600');
      expect(input).toHaveClass('focus:ring-2');
    });

    it('maintains focus contrast in error state', async () => {
      const user = userEvent.setup();
      render(<Input error={true} data-testid="input" />);
      const input = screen.getByTestId('input');
      
      await user.click(input);
      
      expect(input).toHaveClass('focus:border-red-600');
      expect(input).toHaveClass('focus:ring-red-600');
    });

    it('shows focus outline for keyboard navigation', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      
      fireEvent.focus(input);
      
      expect(input).toHaveClass('focus-visible:outline-none');
      expect(input).toHaveClass('focus:ring-2');
    });

    it('maintains focus visibility when tabbing', () => {
      render(
        <div>
          <Input data-testid="input1" />
          <Input data-testid="input2" />
        </div>
      );
      
      const input1 = screen.getByTestId('input1');
      const input2 = screen.getByTestId('input2');
      
      fireEvent.focus(input1);
      expect(input1).toHaveFocus();
      
      fireEvent.keyDown(input1, { key: 'Tab' });
      fireEvent.blur(input1);
      fireEvent.focus(input2);
      expect(input2).toHaveFocus();
    });

    it('removes focus styles when losing focus', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Input data-testid="input" />
          <button data-testid="button">Button</button>
        </div>
      );
      
      const input = screen.getByTestId('input');
      const button = screen.getByTestId('button');
      
      await user.click(input);
      expect(input).toHaveFocus();
      
      await user.click(button);
      expect(input).not.toHaveFocus();
    });
  });

  describe('dark mode contrast', () => {
    beforeEach(() => {
      // Mock dark mode by adding dark class to document
      document.documentElement.classList.add('dark');
    });

    afterEach(() => {
      document.documentElement.classList.remove('dark');
    });

    it('renders with proper dark mode contrast classes', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass('dark:text-white');
      expect(input).toHaveClass('dark:bg-gray-950');
      expect(input).toHaveClass('dark:border-gray-800');
    });

    it('maintains dark mode focus contrast', async () => {
      const user = userEvent.setup();
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      
      await user.click(input);
      
      expect(input).toHaveClass('dark:focus:border-blue-400');
      expect(input).toHaveClass('dark:focus:ring-blue-400');
    });

    it('shows proper dark mode error states', () => {
      render(<Input error={true} data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass('dark:border-red-400');
      expect(input).toHaveClass('dark:focus:border-red-300');
      expect(input).toHaveClass('dark:focus:ring-red-300');
    });

    it('maintains dark mode destructive variant contrast', () => {
      render(<Input variant="destructive" data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass('dark:border-red-400');
      expect(input).toHaveClass('dark:focus:border-red-300');
    });

    it('shows proper dark mode placeholder contrast', () => {
      render(
        <Input 
          placeholder="Dark mode placeholder" 
          data-testid="input"
        />
      );
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass('dark:placeholder:text-gray-400');
    });

    it('maintains dark mode disabled state contrast', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass('dark:bg-gray-950');
      expect(input).toHaveClass('disabled:opacity-50');
      expect(input).toBeDisabled();
    });

    it('handles dark mode ring offset properly', async () => {
      const user = userEvent.setup();
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      
      await user.click(input);
      
      expect(input).toHaveClass('ring-offset-background');
      expect(input).toHaveClass('focus:ring-offset-2');
    });
  });

  describe('accessibility integration', () => {
    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<Input ref={ref} data-testid="input" />);
      
      expect(ref).toHaveBeenCalled();
    });

    it('accepts all standard input props', () => {
      render(
        <Input
          data-testid="input"
          id="test-input"
          name="testInput"
          value="test value"
          onChange={vi.fn()}
          required
          aria-label="Test input"
          aria-describedby="help-text"
        />
      );
      
      const input = screen.getByTestId('input');
      
      expect(input).toHaveAttribute('id', 'test-input');
      expect(input).toHaveAttribute('name', 'testInput');
      expect(input).toHaveValue('test value');
      expect(input).toBeRequired();
      expect(input).toHaveAttribute('aria-label', 'Test input');
      expect(input).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('supports custom className while preserving contrast classes', () => {
      render(<Input className="custom-class" data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass('custom-class');
      expect(input).toHaveClass('text-gray-900');
      expect(input).toHaveClass('bg-white');
    });

    it('handles type prop correctly', () => {
      render(<Input type="email" data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveAttribute('type', 'email');
    });

    it('applies proper ARIA attributes for error state', () => {
      render(<Input error={true} aria-invalid="true" data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveClass('border-red-500');
    });
  });

  describe('contrast validation edge cases', () => {
    it('maintains contrast when combining multiple variants', () => {
      render(
        <Input 
          variant="destructive" 
          error={true} 
          data-testid="input" 
        />
      );
      const input = screen.getByTestId('input');
      
      // Error state should take precedence
      expect(input).toHaveClass('border-red-500');
      expect(input).toHaveClass('focus:border-red-600');
    });

    it('maintains contrast with custom styling', () => {
      render(
        <Input 
          className="border-2" 
          style={{ borderWidth: '2px' }}
          data-testid="input"
        />
      );
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass('border-2');
      expect(input).toHaveClass('text-gray-900');
      expect(input).toHaveStyle({ borderWidth: '2px' });
    });

    it('handles system preference changes for dark mode', () => {
      // Simulate system dark mode preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      
      // Should have both light and dark mode classes
      expect(input).toHaveClass('text-gray-900');
      expect(input).toHaveClass('dark:text-white');
    });
  });
});