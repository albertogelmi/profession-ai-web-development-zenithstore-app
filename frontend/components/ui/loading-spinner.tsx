import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

/**
 * LoadingSpinner displays a spinning loader icon, optionally with a label.
 *
 * @example
 *   <LoadingSpinner size="sm" text="Loading..." />
 *
 * @param {"sm"|"md"|"lg"} [size="md"] - Size of the spinner.
 * @param {string} [className] - Additional CSS classes for custom styling.
 * @param {string} [text] - Optional label below the spinner.
 * @returns A styled loading spinner with optional text.
 */
export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

/**
 * PageLoader centers a large loading spinner and label on the page.
 *
 * @example
 *   <PageLoader />
 *
 * @returns A full-page loading indicator.
 */
export function PageLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );
}
