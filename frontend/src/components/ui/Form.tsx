import React, { forwardRef, createContext, useContext } from 'react';
import { cn } from '../../lib/utils';

interface FormContextValue {
  disabled?: boolean;
}

const FormContext = createContext<FormContextValue>({});

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  disabled?: boolean;
}

const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ className, disabled, children, ...props }, ref) => {
    return (
      <FormContext.Provider value={{ disabled }}>
        <form
          ref={ref}
          className={cn('space-y-6', className)}
          {...props}
        >
          {children}
        </form>
      </FormContext.Provider>
    );
  }
);

Form.displayName = 'Form';

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-2', className)}
        {...props}
      />
    );
  }
);

FormField.displayName = 'FormField';

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, children, ...props }, ref) => {
    const { disabled } = useContext(FormContext);
    
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none',
          disabled ? 'text-gray-400' : 'text-gray-900',
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="ml-1 text-red-500" aria-label="required">
            *
          </span>
        )}
      </label>
    );
  }
);

FormLabel.displayName = 'FormLabel';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, error, type, ...props }, ref) => {
    const { disabled: formDisabled } = useContext(FormContext);
    const disabled = props.disabled || formDisabled;
    
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-gray-500',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-red-500 bg-red-50 text-red-900 focus-visible:ring-red-500'
            : disabled
            ? 'border-gray-200 bg-gray-50 text-gray-500'
            : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400',
          className
        )}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    );
  }
);

FormInput.displayName = 'FormInput';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, error, ...props }, ref) => {
    const { disabled: formDisabled } = useContext(FormContext);
    const disabled = props.disabled || formDisabled;
    
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm transition-colors',
          'placeholder:text-gray-500',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-red-500 bg-red-50 text-red-900 focus-visible:ring-red-500'
            : disabled
            ? 'border-gray-200 bg-gray-50 text-gray-500'
            : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400',
          className
        )}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  placeholder?: string;
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, error, placeholder, children, ...props }, ref) => {
    const { disabled: formDisabled } = useContext(FormContext);
    const disabled = props.disabled || formDisabled;
    
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-red-500 bg-red-50 text-red-900 focus-visible:ring-red-500'
            : disabled
            ? 'border-gray-200 bg-gray-50 text-gray-500'
            : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400',
          className
        )}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
    );
  }
);

FormSelect.displayName = 'FormSelect';

interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormError = forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ className, children, ...props }, ref) => {
    if (!children) return null;
    
    return (
      <p
        ref={ref}
        className={cn('text-sm text-red-600', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

FormError.displayName = 'FormError';

interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormDescription = forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-gray-600', className)}
        {...props}
      />
    );
  }
);

FormDescription.displayName = 'FormDescription';

interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const FormButton = forwardRef<HTMLButtonElement, FormButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const { disabled: formDisabled } = useContext(FormContext);
    const disabled = props.disabled || formDisabled;
    
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
            'bg-gray-600 text-white hover:bg-gray-700': variant === 'secondary',
            'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50': variant === 'outline',
            'hover:bg-gray-100 text-gray-900': variant === 'ghost',
          },
          {
            'h-9 px-3': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-11 px-8': size === 'lg',
          },
          className
        )}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    );
  }
);

FormButton.displayName = 'FormButton';

export {
  Form,
  FormField,
  FormLabel,
  FormInput,
  FormTextarea,
  FormSelect,
  FormError,
  FormDescription,
  FormButton,
};