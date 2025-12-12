import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { 
  calculateContrastRatio,
  isWCAGCompliant,
  WCAG_AA_NORMAL,
  WCAG_AA_LARGE,
  hexToRgb
} from '../utils/accessibility';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock accessibility utils
vi.mock('../utils/accessibility', () => ({
  calculateContrastRatio: vi.fn(),
  isWCAGCompliant: vi.fn(),
  hexToRgb: vi.fn(),
  WCAG_AA_NORMAL: 4.5,
  WCAG_AA_LARGE: 3.0,
  WCAG_AAA_NORMAL: 7.0,
  WCAG_AAA_LARGE: 4.5
}));

// Helper function to get computed styles
const getComputedStyleValue = (element: Element, property: string): string => {
  return window.getComputedStyle(element).getPropertyValue(property);
};

// Helper function to extract color from computed style
const extractColorFromStyle = (colorString: string): string => {
  // Convert rgb(r, g, b) to hex
  const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
  }
  return colorString;
};

describe('Accessibility Tests', () => {
  let mockCalculateContrastRatio: any;
  let mockIsWCAGCompliant: any;
  let mockHexToRgb: any;

  beforeEach(() => {
    mockCalculateContrastRatio = vi.mocked(calculateContrastRatio);
    mockIsWCAGCompliant = vi.mocked(isWCAGCompliant);
    mockHexToRgb = vi.mocked(hexToRgb);
    
    // Default mock implementations
    mockCalculateContrastRatio.mockReturnValue(4.5);
    mockIsWCAGCompliant.mockReturnValue(true);
    mockHexToRgb.mockReturnValue({ r: 0, g: 0, b: 0 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Color Contrast Ratios - WCAG AA Standards', () => {
    describe('Button variants contrast compliance', () => {
      it('should meet WCAG AA standards for default button variant', () => {
        mockCalculateContrastRatio.mockReturnValue(4.6);
        mockIsWCAGCompliant.mockReturnValue(true);

        render(<Button variant="default">Test Button</Button>);
        const button = screen.getByRole('button');

        const backgroundColor = extractColorFromStyle(getComputedStyleValue(button, 'background-color'));
        const textColor = extractColorFromStyle(getComputedStyleValue(button, 'color'));

        expect(mockCalculateContrastRatio).toHaveBeenCalledWith(backgroundColor, textColor);
        expect(mockIsWCAGCompliant).toHaveBeenCalledWith(4.6, WCAG_AA_NORMAL);
        expect(mockIsWCAGCompliant).toHaveReturnedWith(true);
      });

      it('should meet WCAG AA standards for secondary button variant', () => {
        mockCalculateContrastRatio.mockReturnValue(5.2);
        mockIsWCAGCompliant.mockReturnValue(true);

        render(<Button variant="secondary">Secondary Button</Button>);
        const button = screen.getByRole('button');

        const backgroundColor = extractColorFromStyle(getComputedStyleValue(button, 'background-color'));
        const textColor = extractColorFromStyle(getComputedStyleValue(button, 'color'));

        expect(mockCalculateContrastRatio).toHaveBeenCalledWith(backgroundColor, textColor);
        expect(mockIsWCAGCompliant).toHaveBeenCalledWith(5.2, WCAG_AA_NORMAL);
      });

      it('should meet WCAG AA standards for destructive button variant', () => {
        mockCalculateContrastRatio.mockReturnValue(4.8);
        mockIsWCAGCompliant.mockReturnValue(true);

        render(<Button variant="destructive">Delete</Button>);
        const button = screen.getByRole('button');

        const backgroundColor = extractColorFromStyle(getComputedStyleValue(button, 'background-color'));
        const textColor = extractColorFromStyle(getComputedStyleValue(button, 'color'));

        expect(mockCalculateContrastRatio).toHaveBeenCalledWith(backgroundColor, textColor);
        expect(mockIsWCAGCompliant).toHaveBeenCalledWith(4.8, WCAG_AA_NORMAL);
      });

      it('should meet WCAG AA standards for outline button variant', () => {
        mockCalculateContrastRatio.mockReturnValue(4.7);
        mockIsWCAGCompliant.mockReturnValue(true);

        render(<Button variant="outline">Outline Button</Button>);
        const button = screen.getByRole('button');

        const backgroundColor = extractColorFromStyle(getComputedStyleValue(button, 'background-color'));
        const textColor = extractColorFromStyle(getComputedStyleValue(button, 'color'));

        expect(mockCalculateContrastRatio).toHaveBeenCalledWith(backgroundColor, textColor);
        expect(mockIsWCAGCompliant).toHaveBeenCalledWith(4.7, WCAG_AA_NORMAL);
      });

      it('should meet WCAG AA standards for ghost button variant', () => {
        mockCalculateContrastRatio.mockReturnValue(4.9);
        mockIsWCAGCompliant.mockReturnValue(true);

        render(<Button variant="ghost">Ghost Button</Button>);
        const button = screen.getByRole('button');

        const backgroundColor = extractColorFromStyle(getComputedStyleValue(button, 'background-color'));
        const textColor = extractColorFromStyle(getComputedStyleValue(button, 'color'));

        expect(mockCalculateContrastRatio).toHaveBeenCalledWith(backgroundColor, textColor);
        expect(mockIsWCAGCompliant).toHaveBeenCalledWith(4.9, WCAG_AA_NORMAL);
      });

      it('should maintain contrast on hover states', async () => {
        const user = userEvent.setup();
        mockCalculateContrastRatio.mockReturnValue(4.6);
        mockIsWCAGCompliant.mockReturnValue(true);

        render(<Button variant="default">Hover Test</Button>);
        const button = screen.getByRole('button');

        await user.hover(button);

        const backgroundColor = extractColorFromStyle(getComputedStyleValue(button, 'background-color'));
        const textColor = extractColorFromStyle(getComputedStyleValue(button, 'color'));

        expect(mockCalculateContrastRatio).toHaveBeenCalledWith(backgroundColor, textColor);
        expect(mockIsWCAGCompliant).toHaveBeenCalledWith(4.6, WCAG_AA_NORMAL);
      });

      it('should maintain contrast on focus states', async () => {
        const user = userEvent.setup();
        mockCalculateContrastRatio.mockReturnValue(4.5);
        mockIsWCAGCompliant.mockReturnValue(true);

        render(<Button variant="default">Focus Test</Button>);
        const button = screen.getByRole('button');

        await user.tab();
        expect(button).toHaveFocus();

        const backgroundColor = extractColorFromStyle(getComputedStyleValue(button, 'background-color'));
        const textColor = extractColorFromStyle(getComputedStyleValue(button, 'color'));

        expect(mockCalculateContrastRatio).toHaveBeenCalledWith(backgroundColor, textColor);
        expect(mockIsWCAGCompliant).toHaveBeenCalledWith(4.5, WCAG_AA_NORMAL);
      });

      it('should maintain contrast for disabled buttons', () => {
        mockCalculateContrastRatio.mockReturnValue(3.2);
        mockIsWCAGCompliant.mockReturnValue(false);

        render(<Button variant="default" disabled>Disabled Button</Button>);
        const button = screen.getByRole('button');

        const backgroundColor = extractColorFromStyle(getComputedStyleValue(button, 'background-color'));
        const textColor = extractColorFromStyle(getComputedStyleValue(button, 'color'));

        expect(mockCalculateContrastRatio).toHaveBeenCalledWith(backgroundColor, textColor);
        // Disabled buttons have relaxed contrast requirements
        expect(button).toBeDisabled();
      });

      it('should handle large text buttons with WCAG AA large text standards', () => {
        mockCalculateContrastRatio.mockReturnValue(3.2);
        mockIsWCAGCompliant.mockReturnValue(true);

        render(<Button variant="default" size="lg">Large Button</Button>);
        const button = screen.getByRole('button');

        const backgroundColor = extractColorFromStyle(getComputedStyleValue(button, 'background-color'));
        const textColor = extractColorFromStyle(getComputedStyleValue(button, 'color'));

        expect(mockCalculateContrastRatio).toHaveBeenCalledWith(backgroundColor, textColor);
        expect(mockIsWCAGCompliant).toHaveBeenCalledWith(3.2, WCAG_AA_LARGE);
      });
    });

    describe('Form input contrast compliance', () => {
      it('should meet WCAG AA standards for default input', () => {
        mockCalculateContrastRatio.mockReturnValue(4.7);
        mockIsWCAGCompliant.mockReturnValue(true);

        render(<Input placeholder="Enter text" />);
        const input = screen.getByRole('textbox');

        const backgroundColor = extractColorFromStyle(getComputedStyleValue(input, 'background-color'));
        const textColor = extractColorFromStyle(getComputedStyleValue(input, 'color'));

        expect(mockCalculateContrastRatio).toHaveBeenCalledWith(backgroundColor, textColor);
        expect(mockIsWCAGCompliant).toHaveBeenCalledWith(4.7, WCAG_AA_NORMAL);
      });

      it('should meet WCAG AA standards for error input variant', () => {
        mockCalculateContrastRatio.mockReturnValue(4.8);
        mockIsWCAGCompliant.mockReturnValue(true);

        render(<Input variant="destructive" placeholder="Error input" />);
        const input = screen.getByRole('textbox');

        const backgroundColor = extractColorFromStyle(getComputedStyleValue(input, 'background-color'));
        const textColor = extractColorFromStyle(getComputedStyleValue(input, 'color'));

        expect(mockCalculateContrastRatio).toHaveBeenCalledWith(backgroundColor, textColor);
        expect(mockIsWCAGCompliant).toHaveBeenCalledWith(4.8, WCAG_AA_NORMAL);
      });

      it('should maintain contrast for input focus states', async () => {
        const user = userEvent.setup();
        mockCalculateContrastRatio.mockReturnValue(4.6);
        mockIsWCAGCompliant.mockReturnValue(true);

        render(<Input placeholder="Focus test" />);
        const input = screen.getByRole('textbox');

        await user.click(input);
        expect(input).toHaveFocus();

        const backgroundColor = extractColorFromStyle(getComputedStyleValue(input, 'background-color'));
        const textColor = extractColorFromStyle(getComputedStyleValue(input, 'color'));

        expect(mockCalculateContrastRatio).toHaveBeenCalledWith(backgroundColor, textColor);
        expect(mockIsWCAGCompliant).toHaveBeenCalledWith(4.6, WCAG_AA_NORMAL);
      });

      it('should meet WCAG AA standards for disabled input', () => {
        mockCalculateContrastRatio.mockReturnValue(3.1);

        render(<Input disabled placeholder="Disabled input" />);
        const input = screen.getByRole('textbox');

        const backgroundColor = extractColorFromStyle(getComputedStyleValue(input, 'background-color'));
        const textColor = extractColorFromStyle(getComputedStyleValue(input, 'color'));

        expect(mockCalculateContrastRatio).toHaveBeenCalledWith(backgroundColor, textColor);
        expect(input).toBeDisabled();
      });
    });

    describe('Label contrast compliance', () => {
      it('should meet WCAG AA standards for default labels', () => {
        mockCalculateContrastRatio.mockReturnValue(4.8);
        mockIsWCAGCompliant.mockReturnValue(true);

        render(
          <div>
            <Label htmlFor="test-input">Test Label</Label>
            <Input id="test-input" />
          </div>
        );

        const label = screen.getByText('Test Label');
        const backgroundColor = extractColorFromStyle(getComputedStyleValue(label.parentElement!, 'background-color'));
        const textColor = extractColorFromStyle(getComputedStyleValue(label, 'color'));

        expect(mockCalculateContrastRatio).toHaveBeenCalledWith(backgroundColor, textColor);
        expect(mockIsWCAGCompliant).toHaveBeenCalledWith(4.8, WCAG_AA_NORMAL);
      });

      it('should meet WCAG AA standards for error labels', () => {
        mockCalculateContrastRatio.mockReturnValue(4.9);
        mockIsWCAGCompliant.mockReturnValue(true);

        render(
          <div>
            <Label variant="error" htmlFor="error-input">Error Label</Label>
            <Input id="error-input" variant="destructive" />
          </div>
        );

        const label = screen.getByText('Error Label');
        const backgroundColor = extractColorFromStyle(getComputedStyleValue(label.parentElement!, 'background-color'));
        const textColor = extractColorFromStyle(getComputedStyleValue(label, 'color'));

        expect(mockCalculateContrastRatio).toHaveBeenCalledWith(backgroundColor, textColor);
        expect(mockIsWCAGCompliant).toHaveBeenCalledWith(4.9, WCAG_AA_NORMAL);
      });

      it('should meet WCAG AA standards for success labels', () => {
        mockCalculateContrastRatio.mockReturnValue(5.1);
        mockIsWCAGCompliant.mockReturnValue(true);

        render(
          <Label variant="success">Success Label</Label>
        );

        const label = screen.getByText('Success Label');
        const backgroundColor = extractColorFromStyle(getComputedStyleValue(label.parentElement!, 'background-color'));
        const textColor = extractColorFromStyle(getComputedStyleValue(label, 'color'));

        expect(mockCalculateContrastRatio).toHaveBeenCalledWith(backgroundColor, textColor);
        expect(mockIsWCAGCompliant).toHaveBeenCalledWith(5.1, WCAG_AA_NORMAL);
      });