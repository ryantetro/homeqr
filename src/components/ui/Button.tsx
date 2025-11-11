import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';
    
    const variants = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95',
      secondary:
        'bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0 active:scale-95',
      outline:
        'border-2 border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0 active:scale-95',
    };

    const sizes = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-10 px-5 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;

