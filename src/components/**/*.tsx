import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Accessible input component with proper contrast ratios and ARIA support
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      size = 'md',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperTextId = helperText ? `${inputId}-helper` : undefined;

    const baseClasses = cn(
      'flex w-full border border-input bg-background text-form-text',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
      'placeholder:text-form-placeholder',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground',
      'transition-colors duration-200',
      {
        // Size variants
        'h-8 px-2 text-xs': size === 'sm',
        'h-10 px-3 text-sm': size === 'md',
        'h-12 px-4 text-base': size === 'lg',
        // Style variants
        'rounded-md': variant === 'default',
        'rounded-md bg-muted border-0': variant === 'filled',
        'rounded-lg border-2': variant === 'outlined',
        // Error state
        'border-destructive focus-visible:ring-destructive': error,
        // With icons
        'pl-8': leftIcon && size === 'sm',
        'pl-10': leftIcon && size === 'md',
        'pl-12': leftIcon && size === 'lg',
        'pr-8': rightIcon && size === 'sm',
        'pr-10': rightIcon && size === 'md',
        'pr-12': rightIcon && size === 'lg',
      }
    );

    const iconClasses = cn(
      'absolute top-1/2 -translate-y-1/2 text-form-text',
      'disabled:text-muted-foreground',
      {
        'w-3 h-3': size === 'sm',
        'w-4 h-4': size === 'md',
        'w-5 h-5': size === 'lg',
      }
    );

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium leading-none text-form-text',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            )}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div
              className={cn(iconClasses, {
                'left-2': size === 'sm',
                'left-3': size === 'md',
                'left-4': size === 'lg',
              })}
            >
              {leftIcon}
            </div>
          )}
          
          <input
            type={type}
            className={cn(baseClasses, className)}
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              errorId && error,
              helperTextId && helperText
            )}
            {...props}
          />
          
          {rightIcon && (
            <div
              className={cn(iconClasses, {
                'right-2': size === 'sm',
                'right-3': size === 'md',
                'right-4': size === 'lg',
              })}
            >
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p
            id={errorId}
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p
            id={helperTextId}
            className="text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

/**
 * Accessible textarea component with proper contrast ratios
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      resize = 'vertical',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const helperTextId = helperText ? `${textareaId}-helper` : undefined;

    const baseClasses = cn(
      'flex min-h-[80px] w-full border border-input bg-background px-3 py-2',
      'text-sm text-form-text',
      'placeholder:text-form-placeholder',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground',
      'transition-colors duration-200',
      'rounded-md',
      {
        'resize-none': resize === 'none',
        'resize-y': resize === 'vertical',
        'resize-x': resize === 'horizontal',
        resize: resize === 'both',
        'border-destructive focus-visible:ring-destructive': error,
      }
    );

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'text-sm font-medium leading-none text-form-text',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            )}
          >
            {label}
          </label>
        )}
        
        <textarea
          className={cn(baseClasses, className)}
          ref={ref}
          id={textareaId}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(
            errorId && error,
            helperTextId && helperText
          )}
          {...props}
        />
        
        {error && (
          <p
            id={errorId}
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p
            id={helperTextId}
            className="text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

/**
 * Accessible select component with proper contrast ratios
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      placeholder,
      options,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperTextId = helperText ? `${selectId}-helper` : undefined;

    const baseClasses = cn(
      'flex h-10 w-full items-center justify-between border border-input bg-background px-3 py-2',
      'text-sm text-form-text',
      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground',
      'transition-colors duration-200',
      'rounded-md',
      {
        'border-destructive focus:ring-destructive': error,
      }
    );

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              'text-sm font-medium leading-none text-form-text',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            )}
          >
            {label}
          </label>
        )}
        
        <select
          className={cn(baseClasses, className)}
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(
            errorId && error,
            helperTextId && helperText
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-form-placeholder">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="text-form-text bg-background"
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {error && (
          <p
            id={errorId}
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p
            id={helperTextId}
            className="text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Input, Textarea, Select };
export type { InputProps, TextareaProps, SelectProps };