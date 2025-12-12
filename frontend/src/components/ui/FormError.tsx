import React from 'react';

interface FormErrorProps {
  message?: string;
  className?: string;
}

/**
 * FormError component for displaying validation error messages
 * Uses text-red-600 for proper contrast and accessibility
 */
export const FormError: React.FC<FormErrorProps> = ({ 
  message, 
  className = '' 
}) => {
  if (!message) return null;

  return (
    <div 
      className={`text-red-600 text-sm mt-1 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
};

interface FormHelperTextProps {
  text?: string;
  className?: string;
}

/**
 * FormHelperText component for displaying helpful information
 * Uses text-gray-600 for proper contrast
 */
export const FormHelperText: React.FC<FormHelperTextProps> = ({ 
  text, 
  className = '' 
}) => {
  if (!text) return null;

  return (
    <div className={`text-gray-600 text-sm mt-1 ${className}`}>
      {text}
    </div>
  );
};

export default FormError;