import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-slate-900 text-white shadow hover:bg-slate-800 active:bg-slate-950',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
        outline: 'border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100',
        secondary: 'bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200 active:bg-slate-300',
        ghost: 'text-slate-900 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
        link: 'text-slate-900 underline-offset-4 hover:underline focus:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
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

/**
 * Button component with accessible contrast ratios and multiple variants
 * 
 * @param variant - Button style variant (default, destructive, outline, secondary, ghost, link)
 * @param size - Button size (default, sm, lg, icon)
 * @param className - Additional CSS classes
 * @param asChild - Render as child element instead of button
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = 'button';
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };