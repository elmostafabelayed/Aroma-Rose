import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'sage';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-sans font-medium uppercase transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-burgundy/25 disabled:cursor-not-allowed disabled:opacity-50 rounded';

    const variantClasses = {
      primary:
        'bg-burgundy text-white hover:bg-burgundy-hover active:bg-burgundy-deep shadow-subtle border border-burgundy',
      secondary:
        'bg-rose text-white hover:bg-rose/90 active:bg-burgundy shadow-subtle border border-rose',
      outline:
        'border border-sand-border text-burgundy bg-transparent hover:border-burgundy hover:bg-rose-soft/40 active:bg-rose-soft',
      ghost:
        'text-charcoal hover:text-burgundy hover:bg-rose-soft/50 active:bg-rose-soft border border-transparent',
      danger:
        'bg-red-800 text-white hover:bg-red-900 border border-red-800 shadow-subtle',
      sage:
        'bg-sage text-white hover:bg-sage-dark active:bg-sage-dark border border-sage shadow-subtle',
    };

    const sizeClasses = {
      sm: 'text-[0.68rem] tracking-editorial px-3 py-1.5 gap-1.5 min-h-[32px]',
      md: 'text-xs tracking-editorial px-5 py-2.5 gap-2 min-h-[42px]',
      lg: 'text-xs tracking-wide px-7 py-3.5 gap-2.5 min-h-[50px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <span
              className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            <span>Chargement...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
