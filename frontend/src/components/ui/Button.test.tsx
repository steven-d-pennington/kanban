import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';
import { calculateContrastRatio, isWCAGCompliant, WCAG_AA_NORMAL, WCAG_AA_LARGE } from '../../utils/accessibility';

// Mock the accessibility utils
vi.mock('../../utils/accessibility', () => ({
  calculateContrastRatio: vi.fn(),
  isWCAGCompliant: vi.fn(),
  WCAG_AA_NORMAL: 4.5,
  WCAG_AA_LARGE: 3.0,
  WCAG_AAA_NORMAL: 7.0,
  WCAG_AAA_LARGE: 4.5
}));

// Mock getComputedStyle for color extraction
const mockGetComputedStyle = vi.fn();
Object.defineProperty(window, 'getComputedStyle', {
  value: mockGetComputedStyle
});

// Helper function to extract RGB values from computed style
const extractRGBFromComputedStyle = (element: HTMLElement, property: 'backgroundColor' | 'color') => {
  const computedStyle = window.getComputedStyle(element);
  const value = computedStyle.getPropertyValue(property);
  // Convert CSS color to RGB format that accessibility utils expect
  if (value.startsWith('rgb(')) {
    const matches = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (matches) {
      return {
        r: parseInt(matches[1], 10) / 255,
        g: parseInt(matches[2], 10) / 255,
        b: parseInt(matches[3], 10) / 255
      };
    }
  }
  return { r: 0, g: 0, b: 0 }; // fallback
};

describe('Button Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (calculateContrastRatio as any).mockReturnValue(4.6);
    (isWCAGCompliant as any).mockReturnValue(true);
    
    // Mock getComputedStyle with default values
    mockGetComputedStyle.mockImplementation((element) => ({
      getPropertyValue: (prop: string) => {
        if (prop === 'background-color') return 'rgb(15, 23, 42)'; // slate-900
        if (prop === 'color') return 'rgb(255, 255, 255)'; // white
        return '';
      },
      backgroundColor: 'rgb(15, 23, 42)',
      color: 'rgb(255, 255, 255)'
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Button Variants Contrast Testing', () => {
    it('should have proper contrast for default variant', () => {
      // Arrange
      mockGetComputedStyle.mockImplementation(() => ({
        getPropertyValue: (prop: string) => {
          if (prop === 'background-color') return 'rgb(15, 23, 42)'; // slate-900
          if (prop === 'color') return 'rgb(255, 255, 255)'; // white
          return '';
        }
      }));
      (calculateContrastRatio as any).mockReturnValue(15.2); // High contrast
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button variant="default">Default Button</Button>);
      const button = screen.getByRole('button');

      // Assert
      expect(calculateContrastRatio).toHaveBeenCalledWith(
        { r: 1, g: 1, b: 1 }, // white text
        { r: 15/255, g: 23/255, b: 42/255 } // slate-900 background
      );
      expect(isWCAGCompliant).toHaveBeenCalledWith(15.2, WCAG_AA_NORMAL);
      expect(button).toBeInTheDocument();
    });

    it('should have proper contrast for destructive variant', () => {
      // Arrange
      mockGetComputedStyle.mockImplementation(() => ({
        getPropertyValue: (prop: string) => {
          if (prop === 'background-color') return 'rgb(239, 68, 68)'; // red-500
          if (prop === 'color') return 'rgb(255, 255, 255)'; // white
          return '';
        }
      }));
      (calculateContrastRatio as any).mockReturnValue(5.8);
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');

      // Assert
      expect(calculateContrastRatio).toHaveBeenCalledWith(
        { r: 1, g: 1, b: 1 }, // white text
        { r: 239/255, g: 68/255, b: 68/255 } // red-500 background
      );
      expect(isWCAGCompliant).toHaveBeenCalledWith(5.8, WCAG_AA_NORMAL);
    });

    it('should have proper contrast for outline variant', () => {
      // Arrange
      mockGetComputedStyle.mockImplementation(() => ({
        getPropertyValue: (prop: string) => {
          if (prop === 'background-color') return 'rgb(255, 255, 255)'; // white background
          if (prop === 'color') return 'rgb(15, 23, 42)'; // slate-900 text
          return '';
        }
      }));
      (calculateContrastRatio as any).mockReturnValue(15.2);
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button variant="outline">Outline Button</Button>);
      const button = screen.getByRole('button');

      // Assert
      expect(calculateContrastRatio).toHaveBeenCalledWith(
        { r: 15/255, g: 23/255, b: 42/255 }, // slate-900 text
        { r: 1, g: 1, b: 1 } // white background
      );
    });

    it('should have proper contrast for secondary variant', () => {
      // Arrange
      mockGetComputedStyle.mockImplementation(() => ({
        getPropertyValue: (prop: string) => {
          if (prop === 'background-color') return 'rgb(241, 245, 249)'; // slate-100
          if (prop === 'color') return 'rgb(15, 23, 42)'; // slate-900
          return '';
        }
      }));
      (calculateContrastRatio as any).mockReturnValue(12.6);
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');

      // Assert
      expect(calculateContrastRatio).toHaveBeenCalledWith(
        { r: 15/255, g: 23/255, b: 42/255 }, // slate-900 text
        { r: 241/255, g: 245/255, b: 249/255 } // slate-100 background
      );
    });

    it('should have proper contrast for ghost variant', () => {
      // Arrange
      mockGetComputedStyle.mockImplementation(() => ({
        getPropertyValue: (prop: string) => {
          if (prop === 'background-color') return 'rgba(0, 0, 0, 0)'; // transparent
          if (prop === 'color') return 'rgb(15, 23, 42)'; // slate-900
          return '';
        }
      }));
      (calculateContrastRatio as any).mockReturnValue(15.2);
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button variant="ghost">Ghost Button</Button>);
      const button = screen.getByRole('button');

      // Assert
      expect(calculateContrastRatio).toHaveBeenCalledWith(
        { r: 15/255, g: 23/255, b: 42/255 }, // slate-900 text
        { r: 1, g: 1, b: 1 } // assuming white background for transparent
      );
    });

    it('should have proper contrast for link variant', () => {
      // Arrange
      mockGetComputedStyle.mockImplementation(() => ({
        getPropertyValue: (prop: string) => {
          if (prop === 'background-color') return 'rgba(0, 0, 0, 0)'; // transparent
          if (prop === 'color') return 'rgb(15, 23, 42)'; // slate-900
          return '';
        }
      }));
      (calculateContrastRatio as any).mockReturnValue(15.2);
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button variant="link">Link Button</Button>);
      const button = screen.getByRole('button');

      // Assert
      expect(calculateContrastRatio).toHaveBeenCalledWith(
        { r: 15/255, g: 23/255, b: 42/255 }, // slate-900 text
        { r: 1, g: 1, b: 1 } // assuming white background for transparent
      );
    });

    it('should fail accessibility test when contrast is insufficient', () => {
      // Arrange
      mockGetComputedStyle.mockImplementation(() => ({
        getPropertyValue: (prop: string) => {
          if (prop === 'background-color') return 'rgb(200, 200, 200)'; // light gray
          if (prop === 'color') return 'rgb(220, 220, 220)'; // lighter gray
          return '';
        }
      }));
      (calculateContrastRatio as any).mockReturnValue(1.8); // Poor contrast
      (isWCAGCompliant as any).mockReturnValue(false);

      // Act
      render(<Button variant="default">Low Contrast</Button>);
      
      // Assert
      expect(calculateContrastRatio).toHaveBeenCalledWith(
        { r: 220/255, g: 220/255, b: 220/255 }, // light text
        { r: 200/255, g: 200/255, b: 200/255 } // light background
      );
      expect(isWCAGCompliant).toHaveBeenCalledWith(1.8, WCAG_AA_NORMAL);
      expect(isWCAGCompliant).toHaveReturnedWith(false);
    });
  });

  describe('Button Size Variants Contrast Testing', () => {
    it('should use WCAG AA large text standards for large buttons', () => {
      // Arrange
      mockGetComputedStyle.mockImplementation(() => ({
        getPropertyValue: (prop: string) => {
          if (prop === 'background-color') return 'rgb(15, 23, 42)';
          if (prop === 'color') return 'rgb(255, 255, 255)';
          return '';
        }
      }));
      (calculateContrastRatio as any).mockReturnValue(3.2);
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button size="lg">Large Button</Button>);

      // Assert
      expect(isWCAGCompliant).toHaveBeenCalledWith(3.2, WCAG_AA_LARGE);
    });

    it('should use normal text standards for default and small buttons', () => {
      // Arrange
      (calculateContrastRatio as any).mockReturnValue(4.6);
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button size="sm">Small Button</Button>);

      // Assert
      expect(isWCAGCompliant).toHaveBeenCalledWith(4.6, WCAG_AA_NORMAL);
    });
  });

  describe('Hover and Active States Contrast Testing', () => {
    it('should maintain proper contrast on hover for default variant', async () => {
      // Arrange
      const user = userEvent.setup();
      let callCount = 0;
      mockGetComputedStyle.mockImplementation(() => ({
        getPropertyValue: (prop: string) => {
          callCount++;
          if (prop === 'background-color') {
            // Return darker color on hover (slate-800)
            return callCount > 2 ? 'rgb(30, 41, 59)' : 'rgb(15, 23, 42)';
          }
          if (prop === 'color') return 'rgb(255, 255, 255)';
          return '';
        }
      }));
      (calculateContrastRatio as any).mockReturnValue(12.8); // Good hover contrast
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button variant="default">Hover Test</Button>);
      const button = screen.getByRole('button');
      
      await user.hover(button);

      // Assert
      expect(calculateContrastRatio).toHaveBeenCalledWith(
        { r: 1, g: 1, b: 1 }, // white text
        { r: 30/255, g: 41/255, b: 59/255 } // slate-800 hover background
      );
      expect(isWCAGCompliant).toHaveBeenCalledWith(12.8, WCAG_AA_NORMAL);
    });

    it('should maintain proper contrast on active state for destructive variant', async () => {
      // Arrange
      const user = userEvent.setup();
      let callCount = 0;
      mockGetComputedStyle.mockImplementation(() => ({
        getPropertyValue: (prop: string) => {
          callCount++;
          if (prop === 'background-color') {
            // Return darker red on active (red-700)
            return callCount > 2 ? 'rgb(185, 28, 28)' : 'rgb(239, 68, 68)';
          }
          if (prop === 'color') return 'rgb(255, 255, 255)';
          return '';
        }
      }));
      (calculateContrastRatio as any).mockReturnValue(7.2); // Good active contrast
      (isWCAGCompliant as any).mockReturnValue(true);

      // Act
      render(<Button variant="destructive">Active Test</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.mouseDown(button);

      // Assert
      expect(calculateContrastRatio).toHaveBeenCalledWith(
        { r: 1, g: 1, b: 1 }, // white text
        { r: 185/255, g: 28/255, b: 28/255 } // red-700 active background
      );
      expect(isWCAGCompliant).toHaveBeenCalledWith(7.2, WCAG_AA_NORMAL);
    });

    it('should maintain proper contrast on hover for outline variant', async () => {
      // Arrange
      const user = userEvent.setup();
      let callCount = 0;
      mockGetComputedStyle.mockImplementation(() => ({
        getPropertyValue: (prop: string) => {
          callCount++;
          if (callCount > 2) {
            // Hover state: filled background with white text
            if (prop === 'background-color') return 'rgb(15, 23, 42)'; // slate-900
            if (prop === 'color') return 'rgb(255, 255, 255)'; // white
          } else {
            // Default state: white background with dark text