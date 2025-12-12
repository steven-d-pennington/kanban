import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
        outline:
          'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-gray-500',
        secondary:
          'bg-gray-600 text-white hover:bg-gray-700 focus-visible:ring-gray-500',
        ghost:
          'text-gray-900 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500',
        link:
          'text-blue-600 underline-offset-4 hover:underline hover:text-blue-700 focus-visible:ring-blue-500',
        success:
          'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500',
        warning:
          'bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500',
        info:
          'bg-cyan-600 text-white hover:bg-cyan-700 focus-visible:ring-cyan-500',
        light:
          'bg-gray-100 text-gray-900 hover:bg-gray-200 hover:text-gray-900 focus-visible:ring-gray-500',
        dark:
          'bg-gray-900 text-white hover:bg-gray-800 focus-visible:ring-gray-500',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
        xs: 'h-8 rounded px-2 text-xs',
        xl: 'h-12 rounded-lg px-10 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };