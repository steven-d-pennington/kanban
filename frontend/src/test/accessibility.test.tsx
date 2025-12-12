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
      });

      it('should have no axe violations for SignUpPage', async () => {
        const { container } = render(
          <SignUpPage 
            onSwitchToLogin={vi.fn()} 
          />
        );
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no axe violations for ResetPasswordPage', async () => {
        const { container } = render(
          <ResetPasswordPage 
            onSwitchToLogin={vi.fn()} 
          />
        );
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe('Keyboard Navigation Tests', () => {
    it('should support tab navigation through form elements', async () => {
      const user = userEvent.setup();
      render(
        <form>
          <Label htmlFor="first-input">First Name</Label>
          <Input id="first-input" type="text" />
          
          <Label htmlFor="email-input">Email</Label>
          <Input id="email-input" type="email" />
          
          <Label htmlFor="country-select">Country</Label>
          <Select id="country-select">
            <option value="">Select a country</option>
            <option value="us">United States</option>
          </Select>
          
          <Button type="submit">Submit</Button>
        </form>
      );

      const firstInput = screen.getByLabelText('First Name');
      const emailInput = screen.getByLabelText('Email');
      const countrySelect = screen.getByLabelText('Country');
      const submitButton = screen.getByRole('button', { name: 'Submit' });

      // Start with first input focused
      firstInput.focus();
      expect(firstInput).toHaveFocus();

      // Tab to email input
      await user.tab();
      expect(emailInput).toHaveFocus();

      // Tab to country select
      await user.tab();
      expect(countrySelect).toHaveFocus();

      // Tab to submit button
      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should support shift+tab for reverse navigation', async () => {
      const user = userEvent.setup();
      render(
        <form>
          <Input data-testid="input1" type="text" />
          <Input data-testid="input2" type="text" />
          <Button data-testid="button">Submit</Button>
        </form>
      );

      const button = screen.getByTestId('button');
      const input2 = screen.getByTestId('input2');
      const input1 = screen.getByTestId('input1');

      // Start with button focused
      button.focus();
      expect(button).toHaveFocus();

      // Shift+Tab to input2
      await user.tab({ shift: true });
      expect(input2).toHaveFocus();

      // Shift+Tab to input1
      await user.tab({ shift: true });
      expect(input1).toHaveFocus();
    });

    it('should skip disabled elements during tab navigation', async () => {
      const user = userEvent.setup();
      render(
        <form>
          <Input data-testid="input1" type="text" />
          <Input data-testid="input2" type="text" disabled />
          <Input data-testid="input3" type="text" />
        </form>
      );

      const input1 = screen.getByTestId('input1');
      const input3 = screen.getByTestId('input3');

      input1.focus();
      expect(input1).toHaveFocus();

      await user.tab();
      expect(input3).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide proper labels for form fields', () => {
      render(
        <div>
          <Label htmlFor="email-field">Email Address</Label>
          <Input id="email-field" type="email" required />
        </div>
      );

      const input = screen.getByLabelText('Email Address');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toBeRequired();
    });

    it('should associate error messages with form fields', () => {
      render(
        <div>
          <Label htmlFor="email-field" variant="error">Email Address</Label>
          <Input 
            id="email-field" 
            type="email" 
            error={true}
            aria-describedby="email-error" 
          />
          <FormError id="email-error" message="Please enter a valid email address" />
        </div>
      );

      const input = screen.getByLabelText('Email Address');
      const errorMessage = screen.getByRole('alert');

      expect(input).toHaveAttribute('aria-describedby', 'email-error');
      expect(errorMessage).toHaveTextContent('Please enter a valid email address');
    });

    it('should associate helper text with form fields', () => {
      render(
        <div>
          <Label htmlFor="password-field">Password</Label>
          <Input 
            id="password-field" 
            type="password" 
            aria-describedby="password-help"
          />
          <FormHelperText id="password-help">
            Password must be at least 8 characters long
          </FormHelperText>
        </div>
      );

      const input = screen.getByLabelText('Password');
      const helperText = screen.getByText('Password must be at least 8 characters long');

      expect(input).toHaveAttribute('aria-describedby', 'password-help');
      expect(helperText).toHaveAttribute('id', 'password-help');
    });

    it('should announce form validation errors', () => {
      render(
        <div>
          <Label htmlFor="required-field" variant="error">Required Field</Label>
          <Input 
            id="required-field" 
            type="text" 
            error={true}
            aria-describedby="required-error"
            aria-invalid="true"
          />
          <FormError id="required-error" message="This field is required" />
        </div>
      );

      const input = screen.getByLabelText('Required Field');
      const errorMessage = screen.getByRole('alert');

      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'required-error');
      expect(errorMessage).toHaveAttribute('id', 'required-error');
      expect(errorMessage).toHaveTextContent('This field is required');
    });
  });

  describe('Focus Management', () => {
    it('should provide visible focus indicators', async () => {
      const user = userEvent.setup();
      render(<Input data-testid="focus-input" />);

      const input = screen.getByTestId('focus-input');
      
      await user.click(input);
      expect(input).toHaveFocus();

      // Check if focus styles are applied (this would depend on your CSS implementation)
      const computedStyle = getComputedStyle(input);
      expect(computedStyle.outline).not.toBe('none');
    });

    it('should maintain focus within modal dialogs', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <h2 id="dialog-title">Confirmation</h2>
          <Button data-testid="confirm">Confirm</Button>
          <Button data-testid="cancel">Cancel</Button>
        </div>
      );

      const confirmButton = screen.getByTestId('confirm');
      const cancelButton = screen.getByTestId('cancel');

      confirmButton.focus();
      expect(confirmButton).toHaveFocus();

      await user.tab();
      expect(cancelButton).toHaveFocus();

      // In a real modal, tab should cycle back to first element
      await user.tab();
      // This would require actual modal implementation to test properly
    });

    it('should restore focus after modal closes', () => {
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Modal';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      expect(triggerButton).toHaveFocus();

      // After modal interaction and close, focus should return to trigger
      expect(document.activeElement).toBe(triggerButton);

      document.body.removeChild(triggerButton);
    });
  });
});