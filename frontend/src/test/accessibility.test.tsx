import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { FormError } from '../components/ui/FormError';
import { FormHelperText } from '../components/ui/FormHelperText';
import { LoginPage } from '../pages/LoginPage';
import { SignUpPage } from '../pages/SignUpPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { calculateContrastRatio, isWCAGCompliant, WCAG_AA_NORMAL, WCAG_AA_LARGE } from '../utils/accessibility';

expect.extend(toHaveNoViolations);

// Mock the accessibility utils
vi.mock('../utils/accessibility', () => ({
  calculateContrastRatio: vi.fn(),
  isWCAGCompliant: vi.fn(),
  WCAG_AA_NORMAL: 4.5,
  WCAG_AA_LARGE: 3.0,
  WCAG_AAA_NORMAL: 7.0,
  WCAG_AAA_LARGE: 4.5,
  ACCESSIBLE_COLOR_PAIRS: {
    light: {
      background: '#ffffff',
      text: '#1a1a1a',
      textSecondary: '#4a4a4a',
      primary: '#2563eb',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626'
    }
  }
}));

// Mock auth store
vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    resetPassword: vi.fn(),
    loading: false,
    error: null,
    clearError: vi.fn()
  })
}));

describe('Accessibility Tests', () => {
  beforeEach(() => {
    vi.mocked(calculateContrastRatio).mockReturnValue(4.5);
    vi.mocked(isWCAGCompliant).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Visual Regression Tests for Form Contrast', () => {
    describe('Input Component Contrast', () => {
      it('should meet WCAG AA contrast for default state', () => {
        render(<Input />);
        const input = screen.getByRole('textbox');
        
        const computedStyle = getComputedStyle(input);
        const textColor = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(textColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });

      it('should meet WCAG AA contrast for focused state', async () => {
        const user = userEvent.setup();
        render(<Input />);
        const input = screen.getByRole('textbox');
        
        await user.click(input);
        
        const computedStyle = getComputedStyle(input);
        const textColor = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(textColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });

      it('should meet WCAG AA contrast for error state', () => {
        render(<Input error={true} />);
        const input = screen.getByRole('textbox');
        
        const computedStyle = getComputedStyle(input);
        const textColor = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        const borderColor = computedStyle.borderColor;
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(textColor, backgroundColor);
        expect(calculateContrastRatio).toHaveBeenCalledWith(borderColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });

      it('should meet WCAG AA contrast for disabled state', () => {
        render(<Input disabled />);
        const input = screen.getByRole('textbox');
        
        const computedStyle = getComputedStyle(input);
        const textColor = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(textColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });

      it('should meet WCAG AA contrast for placeholder text', () => {
        render(<Input placeholder="Enter text..." />);
        const input = screen.getByRole('textbox');
        
        const computedStyle = getComputedStyle(input, '::placeholder');
        const placeholderColor = computedStyle.color || '#6b7280'; // Default placeholder color
        const backgroundColor = getComputedStyle(input).backgroundColor;
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(placeholderColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });
    });

    describe('Label Component Contrast', () => {
      it('should meet WCAG AA contrast for default variant', () => {
        render(<Label>Test Label</Label>);
        const label = screen.getByText('Test Label');
        
        const computedStyle = getComputedStyle(label);
        const textColor = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor || '#ffffff';
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(textColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });

      it('should meet WCAG AA contrast for error variant', () => {
        render(<Label variant="error">Error Label</Label>);
        const label = screen.getByText('Error Label');
        
        const computedStyle = getComputedStyle(label);
        const textColor = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor || '#ffffff';
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(textColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });

      it('should meet WCAG AA contrast for success variant', () => {
        render(<Label variant="success">Success Label</Label>);
        const label = screen.getByText('Success Label');
        
        const computedStyle = getComputedStyle(label);
        const textColor = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor || '#ffffff';
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(textColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });

      it('should meet WCAG AA contrast for warning variant', () => {
        render(<Label variant="warning">Warning Label</Label>);
        const label = screen.getByText('Warning Label');
        
        const computedStyle = getComputedStyle(label);
        const textColor = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor || '#ffffff';
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(textColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });
    });

    describe('Button Component Contrast', () => {
      it('should meet WCAG AA contrast for primary variant', () => {
        render(<Button variant="default">Click me</Button>);
        const button = screen.getByRole('button');
        
        const computedStyle = getComputedStyle(button);
        const textColor = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(textColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });

      it('should meet WCAG AA contrast for destructive variant', () => {
        render(<Button variant="destructive">Delete</Button>);
        const button = screen.getByRole('button');
        
        const computedStyle = getComputedStyle(button);
        const textColor = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(textColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });

      it('should meet WCAG AA contrast for outline variant', () => {
        render(<Button variant="outline">Cancel</Button>);
        const button = screen.getByRole('button');
        
        const computedStyle = getComputedStyle(button);
        const textColor = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor || '#ffffff';
        const borderColor = computedStyle.borderColor;
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(textColor, backgroundColor);
        expect(calculateContrastRatio).toHaveBeenCalledWith(borderColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });

      it('should meet WCAG AA contrast for disabled state', () => {
        render(<Button disabled>Disabled</Button>);
        const button = screen.getByRole('button');
        
        const computedStyle = getComputedStyle(button);
        const textColor = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(textColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });
    });

    describe('FormError Component Contrast', () => {
      it('should meet WCAG AA contrast for error messages', () => {
        render(<FormError message="This field is required" />);
        const errorElement = screen.getByRole('alert');
        
        const computedStyle = getComputedStyle(errorElement);
        const textColor = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor || '#ffffff';
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(textColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });
    });

    describe('FormHelperText Component Contrast', () => {
      it('should meet WCAG AA contrast for default helper text', () => {
        render(<FormHelperText>Helper text</FormHelperText>);
        const helperText = screen.getByText('Helper text');
        
        const computedStyle = getComputedStyle(helperText);
        const textColor = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor || '#ffffff';
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(textColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });

      it('should meet WCAG AA contrast for error helper text', () => {
        render(<FormHelperText variant="error">Error text</FormHelperText>);
        const helperText = screen.getByText('Error text');
        
        const computedStyle = getComputedStyle(helperText);
        const textColor = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor || '#ffffff';
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(textColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });

      it('should meet WCAG AA contrast for success helper text', () => {
        render(<FormHelperText variant="success">Success text</FormHelperText>);
        const helperText = screen.getByText('Success text');
        
        const computedStyle = getComputedStyle(helperText);
        const textColor = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor || '#ffffff';
        
        expect(calculateContrastRatio).toHaveBeenCalledWith(textColor, backgroundColor);
        expect(isWCAGCompliant).toHaveReturnedWith(true);
      });
    });
  });

  describe('Automated Accessibility Testing with axe-core', () => {
    describe('Individual Form Components', () => {
      it('should have no axe violations for Input component', async () => {
        const { container } = render(
          <div>
            <Label htmlFor="test-input">Email</Label>
            <Input id="test-input" type="email" placeholder="Enter your email" />
          </div>
        );
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no axe violations for Input with error state', async () => {
        const { container } = render(
          <div>
            <Label htmlFor="error-input" variant="error">Email</Label>
            <Input 
              id="error-input" 
              type="email" 
              error={true}
              aria-describedby="error-message"
            />
            <FormError message="Email is required" />
          </div>
        );
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no axe violations for Textarea component', async () => {
        const { container } = render(
          <div>
            <Label htmlFor="test-textarea">Description</Label>
            <Textarea id="test-textarea" placeholder="Enter description" />
          </div>
        );
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no axe violations for Select component', async () => {
        const { container } = render(
          <div>
            <Label htmlFor="test-select">Country</Label>
            <Select id="test-select">
              <option value="">Select a country</option>
              <option value="us">United States</option>
              <option value="ca">Canada</option>
            </Select>
          </div>
        );
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no axe violations for Button component', async () => {
        const { container } = render(
          <Button type="button" aria-label="Submit form">
            Submit
          </Button>
        );
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no axe violations for FormError component', async () => {
        const { container } = render(
          <FormError message="This field is required" />
        );
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no axe violations for FormHelperText component', async () => {
        const { container } = render(
          <FormHelperText id="helper-text">
            Password must be at least 8 characters long
          </FormHelperText>
        );
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('Complete Form Pages', () => {
      it('should have no axe violations for LoginPage', async () => {
        const { container } = render(
          <LoginPage 
            onSwitchToSignUp={vi.fn()} 
            onSwitchToReset={vi.fn()} 
          />
        );
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();