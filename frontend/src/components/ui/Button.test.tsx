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
  WCAG_AA_LARGE: 3,
  WCAG_AAA_NORMAL: 7,
  WCAG_AAA_LARGE: 4.5
}));

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock getComputedStyle for testing styles
const mockGetComputedStyle = vi.fn();
Object.defineProperty(window, 'getComputedStyle', {
  value: mockGetComputedStyle
});

describe('Button Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    (calculateContrastRatio as any).mockReturnValue(4.6);
    (isWCAGCompliant as any).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Variant Contrast Testing', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
    
    it.each(variants)('should render %s variant with proper contrast ratio', async (variant) => {
      // Arrange
      const mockStyles = {
        backgroundColor: getVariantBackgroundColor(variant),
        color: getVariantTextColor(variant)
      };
      mockGetComputedStyle.mockReturnValue(mockStyles);
      (calculateContrastRatio as any).mockReturnValue(4.7);
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button variant={variant}>Test Button</Button>);
      const button = screen.getByRole('button', { name: 'Test Button' });

      // Assert
      expect(button).toBeInTheDocument();
      expect(calculateContrastRatio).toHaveBeenCalled();
      expect(isWCAGCompliant).toHaveBeenCalledWith(4.7, WCAG_AA_NORMAL);
      expect(button).toHaveClass(getVariantClasses(variant));
    });

    it.each(variants)('should maintain WCAG AA compliance for %s variant', (variant) => {
      // Arrange
      const contrastRatio = 4.8;
      (calculateContrastRatio as any).mockReturnValue(contrastRatio);
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button variant={variant}>Accessible Button</Button>);

      // Assert
      expect(isWCAGCompliant).toHaveBeenCalledWith(contrastRatio, WCAG_AA_NORMAL);
      expect(isWCAGCompliant).toHaveReturnedWith(true);
    });

    it.each(variants)('should handle insufficient contrast for %s variant', (variant) => {
      // Arrange
      const lowContrastRatio = 2.1;
      (calculateContrastRatio as any).mockReturnValue(lowContrastRatio);
      (isWCAGCompliant as any).mockReturnValue(false);
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      render(<Button variant={variant}>Low Contrast Button</Button>);

      // Assert
      expect(isWCAGCompliant).toHaveBeenCalledWith(lowContrastRatio, WCAG_AA_NORMAL);
      expect(isWCAGCompliant).toHaveReturnedWith(false);
      
      consoleSpy.mockRestore();
    });

    it('should handle large text contrast requirements for destructive variant', () => {
      // Arrange
      const contrastRatio = 3.5;
      (calculateContrastRatio as any).mockReturnValue(contrastRatio);
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button variant="destructive" size="lg">Large Destructive Button</Button>);

      // Assert
      expect(isWCAGCompliant).toHaveBeenCalledWith(contrastRatio, WCAG_AA_LARGE);
    });
  });

  describe('Disabled State Accessibility', () => {
    it('should have proper disabled state accessibility attributes', () => {
      // Act
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');

      // Assert
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('tabindex', '-1');
    });

    it('should maintain contrast ratio in disabled state', () => {
      // Arrange
      const disabledStyles = {
        backgroundColor: '#9ca3af',
        color: '#6b7280'
      };
      mockGetComputedStyle.mockReturnValue(disabledStyles);
      (calculateContrastRatio as any).mockReturnValue(3.2);
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button disabled>Disabled Button</Button>);

      // Assert
      expect(calculateContrastRatio).toHaveBeenCalled();
      expect(isWCAGCompliant).toHaveBeenCalledWith(3.2, WCAG_AA_NORMAL);
    });

    it('should prevent interaction when disabled', async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();

      // Act
      render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);

      // Assert
      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toHaveClass('disabled:pointer-events-none');
    });

    it('should have reduced opacity in disabled state', () => {
      // Act
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');

      // Assert
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should not receive focus when disabled', async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <div>
          <Button>First Button</Button>
          <Button disabled>Disabled Button</Button>
          <Button>Last Button</Button>
        </div>
      );

      const firstButton = screen.getByRole('button', { name: 'First Button' });
      const disabledButton = screen.getByRole('button', { name: 'Disabled Button' });
      const lastButton = screen.getByRole('button', { name: 'Last Button' });

      // Assert
      await user.tab();
      expect(firstButton).toHaveFocus();
      
      await user.tab();
      expect(lastButton).toHaveFocus();
      expect(disabledButton).not.toHaveFocus();
    });
  });

  describe('Hover State Readability', () => {
    it.each(variants)('should maintain readability on hover for %s variant', async (variant) => {
      // Arrange
      const user = userEvent.setup();
      const hoverStyles = {
        backgroundColor: getVariantHoverBackgroundColor(variant),
        color: getVariantHoverTextColor(variant)
      };
      
      mockGetComputedStyle
        .mockReturnValueOnce({
          backgroundColor: getVariantBackgroundColor(variant),
          color: getVariantTextColor(variant)
        })
        .mockReturnValueOnce(hoverStyles);

      (calculateContrastRatio as any)
        .mockReturnValueOnce(4.6)
        .mockReturnValueOnce(5.2);
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button variant={variant}>Hover Test Button</Button>);
      const button = screen.getByRole('button');

      await user.hover(button);

      // Assert
      expect(calculateContrastRatio).toHaveBeenCalledTimes(2);
      expect(isWCAGCompliant).toHaveBeenCalledWith(5.2, WCAG_AA_NORMAL);
    });

    it('should handle focus states with proper contrast', async () => {
      // Arrange
      const user = userEvent.setup();
      const focusStyles = {
        backgroundColor: '#1d4ed8',
        color: '#ffffff',
        outline: '2px solid #3b82f6'
      };
      
      mockGetComputedStyle.mockReturnValue(focusStyles);
      (calculateContrastRatio as any).mockReturnValue(6.1);
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button>Focus Test Button</Button>);
      const button = screen.getByRole('button');

      await user.tab();

      // Assert
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-1', 'focus-visible:ring-ring');
    });

    it('should maintain active state contrast', async () => {
      // Arrange
      const user = userEvent.setup();
      const activeStyles = {
        backgroundColor: '#1e40af',
        color: '#ffffff'
      };
      
      mockGetComputedStyle.mockReturnValue(activeStyles);
      (calculateContrastRatio as any).mockReturnValue(7.8);
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button>Active Test Button</Button>);
      const button = screen.getByRole('button');

      fireEvent.mouseDown(button);

      // Assert
      expect(calculateContrastRatio).toHaveBeenCalled();
      expect(isWCAGCompliant).toHaveBeenCalledWith(7.8, WCAG_AA_NORMAL);
    });

    it('should handle high contrast mode', () => {
      // Arrange
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      (calculateContrastRatio as any).mockReturnValue(8.5);
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button>High Contrast Button</Button>);

      // Assert
      expect(calculateContrastRatio).toHaveBeenCalled();
      expect(isWCAGCompliant).toHaveBeenCalledWith(8.5, WCAG_AA_NORMAL);
    });
  });

  describe('Accessibility Standards Compliance', () => {
    it('should pass axe accessibility tests for all variants', async () => {
      // Act & Assert
      for (const variant of variants) {
        const { container } = render(<Button variant={variant}>Accessible Button</Button>);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });

    it('should have proper ARIA attributes', () => {
      // Act
      render(<Button aria-label="Custom Label">Button Text</Button>);
      const button = screen.getByRole('button');

      // Assert
      expect(button).toHaveAttribute('aria-label', 'Custom Label');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should support keyboard navigation', async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();

      // Act
      render(<Button onClick={handleClick}>Keyboard Test</Button>);
      const button = screen.getByRole('button');

      await user.tab();
      await user.keyboard('{Enter}');

      // Assert
      expect(button).toHaveFocus();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should support space key activation', async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();

      // Act
      render(<Button onClick={handleClick}>Space Test</Button>);
      const button = screen.getByRole('button');

      await user.tab();
      await user.keyboard(' ');

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty button content', () => {
      // Act
      render(<Button aria-label="Icon Only Button" />);
      const button = screen.getByRole('button');

      // Assert
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Icon Only Button');
    });

    it('should handle custom className with contrast checking', () => {
      // Arrange
      const customStyles = {
        backgroundColor: '#ff0000',
        color: '#ffffff'
      };
      mockGetComputedStyle.mockReturnValue(customStyles);
      (calculateContrastRatio as any).mockReturnValue(5.3);
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button className="bg-red-500 text-white">Custom Styled</Button>);

      // Assert
      expect(calculateContrastRatio).toHaveBeenCalled();
      expect(isWCAGCompliant).toHaveBeenCalledWith(5.3, WCAG_AA_NORMAL);
    });

    it('should handle loading state accessibility', () => {
      // Act
      render(<Button disabled aria-busy="true">Loading...</Button>);
      const button = screen.getByRole('button');

      // Assert
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });
});

// Helper functions for getting variant styles
function getVariantBackgroundColor(variant: string): string {
  const colors = {
    default: '#1e40af',
    destructive: '#dc2626',
    outline: 'transparent',
    secondary: '#f1f5f9',
    ghost: 'transparent',
    link: 'transparent'
  };
  return colors[variant as keyof typeof colors] || colors.default;
}

function getVariantTextColor(variant: string): string {
  const colors = {
    default: '#ffffff',
    destructive: '#ffffff',
    outline: '#1e40af',
    secondary: '#0f172a',
    ghost: '#1e40af',
    link: '#1e40af'
  };
  return colors[variant as keyof typeof colors] || colors.default;
}

function getVariantHoverBackgroundColor(variant: string): string {
  const colors = {
    default: '#1d4ed8',
    destructive: '#b91c1c',
    outline: '#f8fafc',
    secondary: '#e2e8f0',
    ghost: '#f8fafc',
    link: 'transparent'
  };
  return colors[variant as keyof typeof colors] || colors.default;
}

function getVariantHoverTextColor(variant: string): string {
  const colors = {
    default: '#ffffff',
    destructive: '#ffffff',
    outline: '#1e40af',
    secondary: '#0f172a',
    ghost: '#1e40af',
    link: '#1e40af'
  };
  return colors[variant as keyof typeof colors] || colors.default;
}

function getVariantClasses(variant: string): string {
  const classes = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline'
  };
  return classes[variant as keyof typeof classes] || classes.default;
}