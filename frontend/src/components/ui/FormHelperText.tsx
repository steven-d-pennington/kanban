import React from 'react';
import { cn } from '@/lib/utils';

export interface FormHelperTextProps {
  children: React.ReactNode;
  variant?: 'default' | 'error' | 'success';
  className?: string;
  id?: string;
}

/**
 * FormHelperText component for displaying helper text, error messages, and success messages
 * with proper contrast ratios and accessible styling.
 */
export const FormHelperText: React.FC<FormHelperTextProps> = ({
  children,
  variant = 'default',
  className,
  id,
}) => {
  const baseStyles = 'text-sm mt-1 block';
  
  const variantStyles = {
    default: 'text-gray-600',
    error: 'text-red-600',
    success: 'text-green-600',
  };

  return (
    <div
      id={id}
      className={cn(
        baseStyles,
        variantStyles[variant],
        className
      )}
      role={variant === 'error' ? 'alert' : undefined}
      aria-live={variant === 'error' ? 'polite' : undefined}
    >
      {children}
    </div>
  );
};

FormHelperText.displayName = 'FormHelperText';

export default FormHelperText;