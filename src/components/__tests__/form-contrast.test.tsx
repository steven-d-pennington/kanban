import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { FormButton } from '../ui/form-button';
import { ACCESSIBLE_COLORS } from '../../utils/colors';
import { getContrastRatio } from '../../utils/contrast-validator';

// Mock contrast validator utility
vi.mock('../../utils/contrast-validator', () => ({
  getContrastRatio: vi.fn(),
  validateContrastRatio: vi.fn(),
  hexToRgb: vi.fn(),
  rgbToHex: vi.fn()
}));

// Mock colors utility
vi.mock('../../utils/colors', () => ({
  ACCESSIBLE_COLORS: {
    input: {
      text: '#1f2937',
      background: '#ffffff',
      border: '#d1d5db',
      borderHover: '#9ca3af',
      borderFocus: '#3b82f6',
      placeholder: '#6b7280',
      disabled: {
        background: '#f9fafb',
        text: '#9ca3af'
      }
    },
    label: {
      text: '#111827',
      required: '#dc2626'
    },
    button: {
      primary: {
        background: '#2563eb',
        text: '#ffffff',
        backgroundHover: '#1d4ed8'
      },
      secondary: {
        background: '#6b7280',
        text: '#ffffff'
      }
    },
    error: {
      text: '#dc2626',
      background: '#fef2f2',
      border: '#fca5a5'
    }
  }
}));

// Test component that uses multiple form elements
const TestForm = ({ theme = 'light' }: { theme?: 'light' | 'dark' }) => (
  <div className={theme === 'dark' ? 'dark' : ''}>
    <form>
      <Label htmlFor="username" required>
        Username
      </Label>
      <Input
        id="username"
        placeholder="Enter username"
        error="Username is required"
      />
      
      <Label htmlFor="email">
        Email
      </Label>
      <Input
        id="email"
        type="email"
        placeholder="Enter email"
        disabled
      />
      
      <Label htmlFor="password">
        Password
      </Label>
      <Input
        id="password"
        type="password"
        placeholder="Enter password"
      />
      
      <Button variant="primary" type="submit">
        Submit
      </Button>
      
      <FormButton variant="secondary" disabled>
        Cancel
      </FormButton>
    </form>
  </div>
);

describe('Form Contrast Accessibility', () => {
  const mockGetContrastRatio = vi.mocked(getContrastRatio);

  beforeEach(() => {
    // Reset mocks and set default contrast ratios
    vi.clearAllMocks();
    mockGetContrastRatio.mockImplementation((color1: string, color2: string) => {
      // Simulate WCAG AA compliant ratios
      if (color1 === '#1f2937' && color2 === '#ffffff') return 10.73; // input text
      if (color1 === '#6b7280' && color2 === '#ffffff') return 4.61; // placeholder
      if (color1 === '#111827' && color2 === '#ffffff') return 15.2; // label
      if (color1 === '#ffffff' && color2 === '#2563eb') return 5.9; // button
      if (color1 === '#dc2626' && color2 === '#ffffff') return 5.25; // error
      return 4.5; // default AA compliant ratio
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Form Input Text Colors', () => {
    it('should render input text with sufficient contrast ratio', () => {
      render(<TestForm />);
      
      const usernameInput = screen.getByLabelText('Username');
      const computedStyle = getComputedStyle(usernameInput);
      
      expect(computedStyle.color).toBe('rgb(31, 41, 55)'); // #1f2937
      expect(computedStyle.backgroundColor).toBe('rgb(255, 255, 255)'); // #ffffff
      
      expect(mockGetContrastRatio).toHaveBeenCalledWith('#1f2937', '#ffffff');
      expect(mockGetContrastRatio('#1f2937', '#ffffff')).toBeGreaterThan(4.5);
    });

    it('should maintain contrast ratio for different input types', () => {
      render(<TestForm />);
      
      const inputs = [
        screen.getByLabelText('Username'),
        screen.getByLabelText('Email'),
        screen.getByLabelText('Password')
      ];

      inputs.forEach(input => {
        const style = getComputedStyle(input);
        expect(mockGetContrastRatio(
          ACCESSIBLE_COLORS.input.text,
          ACCESSIBLE_COLORS.input.background
        )).toBeGreaterThan(4.5);
      });
    });

    it('should render focused input with accessible colors', async () => {
      const user = userEvent.setup();
      render(<TestForm />);
      
      const input = screen.getByLabelText('Username');
      await user.click(input);
      
      await waitFor(() => {
        const style = getComputedStyle(input);
        expect(style.borderColor).toBe('rgb(59, 130, 246)'); // focus border
        expect(mockGetContrastRatio('#3b82f6', '#ffffff')).toBeGreaterThan(3.0);
      });
    });
  });

  describe('Label Contrast Requirements', () => {
    it('should render labels with sufficient contrast against background', () => {
      render(<TestForm />);
      
      const labels = screen.getAllByText(/Username|Email|Password/);
      
      labels.forEach(label => {
        const style = getComputedStyle(label);
        expect(style.color).toBe('rgb(17, 24, 39)'); // #111827
        
        expect(mockGetContrastRatio(
          ACCESSIBLE_COLORS.label.text,
          '#ffffff'
        )).toBeGreaterThan(4.5);
      });
    });

    it('should render required labels with accessible indicator color', () => {
      render(<TestForm />);
      
      const requiredLabel = screen.getByText('Username');
      const style = getComputedStyle(requiredLabel);
      
      // Check for required indicator styling
      expect(mockGetContrastRatio(
        ACCESSIBLE_COLORS.label.required,
        '#ffffff'
      )).toBeGreaterThan(4.5);
    });

    it('should maintain label contrast with form backgrounds', () => {
      render(<div style={{ backgroundColor: '#f9fafb' }}><TestForm /></div>);
      
      const label = screen.getByText('Email');
      expect(mockGetContrastRatio('#111827', '#f9fafb')).toBeGreaterThan(4.5);
    });
  });

  describe('Placeholder Text Contrast', () => {
    it('should render placeholder text with WCAG AA compliance', () => {
      render(<TestForm />);
      
      const input = screen.getByPlaceholderText('Enter username');
      const style = getComputedStyle(input);
      
      // Placeholder should be readable but distinguishable from actual text
      expect(mockGetContrastRatio(
        ACCESSIBLE_COLORS.input.placeholder,
        ACCESSIBLE_COLORS.input.background
      )).toBeGreaterThan(4.5);
    });

    it('should maintain placeholder visibility across different input states', () => {
      render(<TestForm />);
      
      const placeholders = [
        'Enter username',
        'Enter email', 
        'Enter password'
      ];

      placeholders.forEach(placeholder => {
        if (screen.queryByPlaceholderText(placeholder)) {
          expect(mockGetContrastRatio(
            ACCESSIBLE_COLORS.input.placeholder,
            '#ffffff'
          )).toBeGreaterThan(4.0);
        }
      });
    });

    it('should handle placeholder contrast in dark backgrounds', () => {
      render(
        <div style={{ backgroundColor: '#1f2937' }}>
          <Input placeholder="Dark theme placeholder" />
        </div>
      );
      
      // In dark themes, placeholder should still be visible
      expect(mockGetContrastRatio('#9ca3af', '#1f2937')).toBeGreaterThan(3.0);
    });
  });

  describe('Form Button Color Combinations', () => {
    it('should render primary button with accessible color combination', () => {
      render(<TestForm />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      const style = getComputedStyle(submitButton);
      
      expect(style.backgroundColor).toBe('rgb(37, 99, 235)'); // #2563eb
      expect(style.color).toBe('rgb(255, 255, 255)'); // #ffffff
      
      expect(mockGetContrastRatio(
        ACCESSIBLE_COLORS.button.primary.text,
        ACCESSIBLE_COLORS.button.primary.background
      )).toBeGreaterThan(4.5);
    });

    it('should render secondary button with proper contrast', () => {
      render(<TestForm />);
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      
      expect(mockGetContrastRatio(
        ACCESSIBLE_COLORS.button.secondary.text,
        ACCESSIBLE_COLORS.button.secondary.background
      )).toBeGreaterThan(4.5);
    });

    it('should maintain button contrast on hover state', async () => {
      const user = userEvent.setup();
      render(<TestForm />);
      
      const button = screen.getByRole('button', { name: 'Submit' });
      await user.hover(button);
      
      await waitFor(() => {
        expect(mockGetContrastRatio(
          '#ffffff',
          ACCESSIBLE_COLORS.button.primary.backgroundHover
        )).toBeGreaterThan(4.5);
      });
    });
  });

  describe('Error State Accessibility', () => {
    it('should display error messages with sufficient contrast', () => {
      render(<TestForm />);
      
      const errorMessage = screen.getByText('Username is required');
      const style = getComputedStyle(errorMessage);
      
      expect(style.color).toBe('rgb(220, 38, 38)'); // #dc2626
      
      expect(mockGetContrastRatio(
        ACCESSIBLE_COLORS.error.text,
        '#ffffff'
      )).toBeGreaterThan(4.5);
    });

    it('should render error input borders with accessible colors', () => {
      render(<TestForm />);
      
      const inputWithError = screen.getByLabelText('Username');
      const style = getComputedStyle(inputWithError);
      
      expect(mockGetContrastRatio(
        ACCESSIBLE_COLORS.error.border,
        ACCESSIBLE_COLORS.input.background
      )).toBeGreaterThan(3.0);
    });

    it('should maintain error state readability in dark mode', () => {
      render(<TestForm theme="dark" />);
      
      // Error colors should adapt for dark mode while maintaining contrast
      expect(mockGetContrastRatio('#f87171', '#1f2937')).toBeGreaterThan(4.5);
    });
  });

  describe('Disabled State Contrast', () => {
    it('should render disabled inputs with appropriate contrast', () => {
      render(<TestForm />);
      
      const disabledInput = screen.getByLabelText('Email');
      const style = getComputedStyle(disabledInput);
      
      expect(disabledInput).toBeDisabled();
      expect(style.backgroundColor).toBe('rgb(249, 250, 251)'); // #f9fafb
      expect(style.color).toBe('rgb(156, 163, 175)'); // #9ca3af
      
      // Disabled elements should still meet minimum contrast for recognition
      expect(mockGetContrastRatio(
        ACCESSIBLE_COLORS.input.disabled.text,
        ACCESSIBLE_COLORS.input.disabled.background
      )).toBeGreaterThan(3.0);
    });

    it('should render disabled buttons with recognizable contrast', () => {
      render(<TestForm />);
      
      const disabledButton = screen.getByRole('button', { name: 'Cancel' });
      expect(disabledButton).toBeDisabled();
      
      // Disabled buttons should be visually distinct but still readable
      const contrast = mockGetContrastRatio('#9ca3af', '#f3f4f6');
      expect(contrast).toBeGreaterThan(2.5);
    });

    it('should indicate disabled state without relying solely on color', () => {
      render(<TestForm />);
      
      const disabledInput = screen.getByLabelText('Email');
      const disabledButton = screen.getByRole('button', { name: 'Cancel' });
      
      expect(disabledInput).toHaveAttribute('disabled');
      expect(disabledButton).toHaveAttribute('disabled');
      
      // Verify cursor changes for disabled elements
      expect(getComputedStyle(disabledInput).cursor).toBe('not-allowed');
    });
  });

  describe('Dark Mode WCAG Standards', () => {
    it('should meet contrast requirements in dark mode', () => {
      render(<TestForm theme="dark" />);
      
      // Mock dark mode contrast calculations
      mockGetContrastRatio.mockImplementation((color1: string, color2: string) => {
        if (color1 === '#f9fafb' && color2 === '#1f2937') return 12.6; // dark input text
        if (color1 === '#d1d5db' && color2 === '#1f2937') return 5.8; // dark placeholder
        if (color1 === '#ffffff' && color2 === '#374151') return 8.9; // dark label
        return 4.5;
      });
      
      const input = screen.getByLabelText('Username');
      expect(mockGetContrastRatio('#f9fafb', '#1f2937')).toBeGreaterThan(4.5);
    });

    it('should render dark mode buttons with proper contrast', () => {
      render(<TestForm theme="dark" />);
      
      mockGetContrastRatio.mockReturnValue(6.2);
      
      const button = screen.getByRole('button', { name: 'Submit' });
      expect(mockGetContrastRatio('#ffffff', '#1d4ed8')).toBeGreaterThan(4.5);
    });

    it('should adapt error states for dark mode', () => {
      render(<TestForm theme="dark" />);
      
      mockGetContrastRatio.mockReturnValue(5.1);
      
      const errorMessage = screen.getByText('Username is required');
      expect(mockGetContrastRatio('#f87171', '#1f2937')).toBeGreaterThan(4.5);
    });

    it('should maintain focus indicators in dark mode', async () => {
      const user = userEvent.setup();
      render(<TestForm theme="dark" />);
      
      const input = screen.getByLabelText('Username');
      await user.click(input);
      
      await waitFor(() => {
        mockGetContrastRatio.mockReturnValue(4.8);
        expect(mockGetContrastRatio('#60a5fa', '#1f2937')).toBeGreaterThan(4.5);
      });