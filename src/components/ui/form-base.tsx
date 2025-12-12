import React from 'react';
import { cn } from '@/lib/utils';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
  required?: boolean;
}

interface FormErrorProps {
  className?: string;
  children: React.ReactNode;
}

interface FormHelperTextProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Base form input component with consistent styling and focus states
 */
export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors',
        'text-form-text bg-form-bg border-form-border placeholder:text-form-placeholder',
        'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'hover:border-gray-400',
        className
      )}
      {...props}
    />
  )
);

FormInput.displayName = 'FormInput';

/**
 * Base form textarea component with consistent styling
 */
export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm transition-colors',
        'text-form-text bg-form-bg border-form-border placeholder:text-form-placeholder',
        'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'hover:border-gray-400',
        'resize-vertical',
        className
      )}
      {...props}
    />
  )
);

FormTextarea.displayName = 'FormTextarea';

/**
 * Base form select component with consistent styling
 */
export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors',
        'text-form-text bg-form-bg border-form-border',
        'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'hover:border-gray-400',
        'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);

FormSelect.displayName = 'FormSelect';

/**
 * Form label component with optional required indicator
 */
export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, children, required = false, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium text-form-text leading-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-red-500" aria-label="Required">
          *
        </span>
      )}
    </label>
  )
);

FormLabel.displayName = 'FormLabel';

/**
 * Form error message component
 */
export const FormError: React.FC<FormErrorProps> = ({ className, children }) => (
  <div
    className={cn(
      'text-sm text-red-600 font-medium',
      'flex items-center gap-2',
      className
    )}
    role="alert"
    aria-live="polite"
  >
    <svg
      className="w-4 h-4 flex-shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
    {children}
  </div>
);

/**
 * Form helper text component
 */
export const FormHelperText: React.FC<FormHelperTextProps> = ({ className, children }) => (
  <div
    className={cn(
      'text-sm text-form-placeholder',
      className
    )}
  >
    {children}
  </div>
);

/**
 * Form group wrapper component
 */
export const FormGroup: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => (
  <div className={cn('space-y-2', className)}>
    {children}
  </div>
);