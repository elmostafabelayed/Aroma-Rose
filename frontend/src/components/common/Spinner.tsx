import React from 'react';
import { cn } from '../../utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className, message }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-[3px]',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={cn(
          'rounded-full animate-spin border-sand-border border-t-burgundy',
          sizeClasses[size],
          className
        )}
        role="status"
        aria-label="Chargement en cours"
      />
      {message && (
        <span className="text-xs uppercase tracking-editorial text-charcoal/70 font-sans">
          {message}
        </span>
      )}
    </div>
  );
};

