import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from './Button';
import { calculateContrastRatio, isWCAGCompliant, WCAG_AA_NORMAL, WCAG_AA_LARGE } from '../../utils/accessibility';

// Mock the accessibility utils
vi.mock('../../utils/accessibility', () => ({
  calculateContrastRatio: vi.fn(),
  isWCAGCompliant: vi.fn(),
  WCAG_AA_NORMAL: 4.5,
  WCAG_AA_LARGE: 3
}));

// Add jest-axe matcher
expect.extend(toHaveNoViolations);

describe('Button Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(calculateContrastRatio).mockReturnValue(5.0);
    vi.mocked(isWCAGCompliant).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders button with default props', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toBeDisabled();
    });

    it('renders button with custom text', () => {
      render(<Button>Custom Text</Button>);
      
      expect(screen.getByText('Custom Text')).toBeInTheDocument();
    });

    it('renders button with children elements', () => {
      render(
        <Button>
          <span data-testid="icon">🚀</span>
          Submit
        </Button>
      );
      
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });
  });

  describe('Button Types', () => {
    it('renders as button type by default', () => {
      render(<Button>Default</Button>);
      
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('renders as submit type when specified', () => {
      render(<Button type="submit">Submit</Button>);
      
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('renders as reset type when specified', () => {
      render(<Button type="reset">Reset</Button>);
      
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });
  });

  describe('Variants', () => {
    it('applies default variant styling', () => {
      render(<Button>Default</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('applies destructive variant styling', () => {
      render(<Button variant="destructive">Delete</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });

    it('applies outline variant styling', () => {
      render(<Button variant="outline">Outline</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'border-input', 'bg-background');
    });

    it('applies secondary variant styling', () => {
      render(<Button variant="secondary">Secondary</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('applies ghost variant styling', () => {
      render(<Button variant="ghost">Ghost</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
    });

    it('applies link variant styling', () => {
      render(<Button variant="link">Link</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary', 'underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('applies default size styling', () => {
      render(<Button>Default Size</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'px-4', 'py-2');
    });

    it('applies small size styling', () => {
      render(<Button size="sm">Small</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'px-3');
    });

    it('applies large size styling', () => {
      render(<Button size="lg">Large</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'px-8');
    });

    it('applies icon size styling', () => {
      render(<Button size="icon">🚀</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  describe('Disabled State', () => {
    it('renders disabled button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('does not trigger click handler when disabled', async () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick handler with event object', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('handles multiple clicks correctly', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      await userEvent.click(button);
      await userEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('handles keyboard events (Enter)', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Press Enter</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard events (Space)', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Press Space</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Props', () => {
    it('forwards ref to button element', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>With Ref</Button>);
      
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('merges custom className with default classes', () => {
      render(<Button className="custom-class">Custom</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });

    it('applies custom data attributes', () => {
      render(<Button data-testid="custom-button" data-custom="value">Custom</Button>);
      
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('data-custom', 'value');
    });

    it('applies ARIA attributes', () => {
      render(
        <Button 
          aria-label="Close dialog" 
          aria-describedby="tooltip"
          aria-pressed="false"
        >
          ×
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Close dialog');
      expect(button).toHaveAttribute('aria-describedby', 'tooltip');
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Form Integration', () => {
    it('submits form when type is submit', async () => {
      const handleSubmit = vi.fn();
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit Form</Button>
        </form>
      );
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('resets form when type is reset', async () => {
      render(
        <form>
          <input defaultValue="test" data-testid="input" />
          <Button type="reset">Reset Form</Button>
        </form>
      );
      
      const input = screen.getByTestId('input') as HTMLInputElement;
      const button = screen.getByRole('button');
      
      // Change input value
      await userEvent.clear(input);
      await userEvent.type(input, 'changed');
      expect(input.value).toBe('changed');
      
      // Reset form
      await userEvent.click(button);
      await waitFor(() => {
        expect(input.value).toBe('test');
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading state when asChild is false and loading is true', () => {
      render(<Button loading>Loading</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('displays loading spinner in loading state', () => {
      render(<Button loading>Loading</Button>);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Button>Accessible Button</Button>);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper focus management', async () => {
      render(<Button>Focus me</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.tab();
      
      expect(button).toHaveFocus();
    });

    it('has visible focus indicator', async () => {
      render(<Button>Focus me</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-ring');
    });

    it('validates color contrast for different variants', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
      
      variants.forEach(variant => {
        render(<Button variant={variant}>Test</Button>);
        expect(calculateContrastRatio).toHaveBeenCalled();
      });
    });

    it('provides proper ARIA attributes for interactive states', () => {
      render(<Button aria-expanded="false" aria-haspopup="true">Menu</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
    });

    it('maintains accessibility when disabled', async () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined children gracefully', () => {
      render(<Button>{undefined}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe('');
    });

    it('handles null children gracefully', () => {
      render(<Button>{null}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe('');
    });

    it('handles empty string children', () => {
      render(<Button>{''}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe('');
    });

    it('handles complex nested children', () => {
      render(
        <Button>
          <div>
            <span>Nested</span>
            <em>Content</em>
          </div>
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Nested')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('handles rapid successive clicks', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Rapid Click</Button>);
      
      const button = screen.getByRole('button');
      
      // Simulate rapid clicks
      await userEvent.click(button);
      await userEvent.click(button);
      await userEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Component Variants Combination', () => {
    it('applies correct classes for destructive outline button', () => {
      render(<Button variant="destructive" size="sm">Small Destructive</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');
      expect(button).toHaveClass('h-9', 'px-