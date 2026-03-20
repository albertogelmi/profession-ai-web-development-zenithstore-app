'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function RatingStars({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  className,
}: RatingStarsProps) {
  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[...Array(maxRating)].map((_, index) => {
        const value = index + 1;
        const isFilled = value <= rating;
        const isHalfFilled = value - 0.5 === rating;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(value)}
            disabled={!interactive}
            className={cn(
              'transition-all',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
            aria-label={`${value} ${value === 1 ? 'stella' : 'stelle'}`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : isHalfFilled
                  ? 'fill-yellow-400/50 text-yellow-400'
                  : 'text-gray-300',
                interactive && !isFilled && 'hover:text-yellow-400'
              )}
            />
          </button>
        );
      })}
      {!interactive && rating !== undefined && (
        <span className="ml-1 text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
