import React, { forwardRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    variant = 'default', 
    size = 'md',
    children,
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'h-8 text-sm px-2 pr-8',
      md: 'h-10 text-sm px-3 pr-8',
      lg: 'h-12 text-base px-4 pr-10',
    };

    const variantClasses = {
      default: cn(
        'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600',
        'text-gray-900 dark:text-white',
        'focus:border-blue-600 dark:focus:border-blue-400',
        'focus:ring-blue-500/20 dark:focus:ring-blue-400/20',
      ),
      outline: cn(
        'bg-transparent border-gray-300 dark:border-gray-600',
        'text-gray-900 dark:text-white',
        'focus:border-blue-600 dark:focus:border-blue-400',
        'focus:ring-blue-500/20 dark:focus:ring-blue-400/20',
      ),
    };

    const baseClasses = cn(
      'w-full rounded-md border transition-colors duration-200',
      'focus:outline-none focus:ring-2',
      'appearance-none cursor-pointer',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'placeholder:text-gray-500 dark:placeholder:text-gray-400',
      sizeClasses[size],
      variantClasses[variant],
      error && 'border-red-600 dark:border-red-400 focus:border-red-600 focus:ring-red-500/20',
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={baseClasses}
            {...props}
          >
            {children}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{helperText}</p>
        )}
        <style jsx global>{`
          select option {
            background-color: white;
            color: #111827;
          }
          
          @media (prefers-color-scheme: dark) {
            select option {
              background-color: #111827;
              color: #ffffff;
            }
          }
          
          [data-theme="dark"] select option {
            background-color: #111827;
            color: #ffffff;
          }
          
          [data-theme="light"] select option {
            background-color: white;
            color: #111827;
          }
        `}</style>
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };