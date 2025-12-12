import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
}

/**
 * Button component with consistent styling and accessibility
 * Supports primary, secondary, outline, and ghost variants
 * Includes proper contrast ratios and disabled states
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      disabled = false,
      type = 'button',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500';

    const variantStyles = {
      primary: disabled
        ? 'text-gray-500 bg-gray-200 cursor-not-allowed'
        : 'text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
      secondary: disabled
        ? 'text-gray-500 bg-gray-200 cursor-not-allowed'
        : 'text-gray-900 bg-gray-100 hover:bg-gray-200 active:bg-gray-300',
      outline: disabled
        ? 'text-gray-500 bg-gray-200 border border-gray-300 cursor-not-allowed'
        : 'text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100',
      ghost: disabled
        ? 'text-gray-500 cursor-not-allowed'
        : 'text-gray-900 hover:bg-gray-100 active:bg-gray-200',
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled}
        type={type}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;