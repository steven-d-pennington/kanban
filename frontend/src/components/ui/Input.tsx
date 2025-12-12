import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'destructive';
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', variant = 'default', error = false, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          'flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-gray-600 dark:placeholder:text-gray-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Light mode styles
          'bg-white text-gray-900 border-gray-300',
          'focus-visible:ring-blue-500 focus-visible:ring-offset-white',
          // Dark mode styles
          'dark:bg-gray-800 dark:text-white dark:border-gray-600',
          'dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-gray-900',
          // Variant styles
          {
            'border-red-300 focus-visible:ring-red-500 dark:border-red-600 dark:focus-visible:ring-red-400':
              variant === 'destructive' || error,
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };