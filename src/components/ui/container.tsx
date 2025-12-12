import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
}

const sizeVariants = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export const Container = ({
  children,
  className,
  size = 'lg',
  centered = true,
}: ContainerProps) => {
  return (
    <div
      className={cn(
        'w-full px-4 sm:px-6 lg:px-8',
        sizeVariants[size],
        centered && 'mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
};

Container.displayName = 'Container';