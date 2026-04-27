import React, { ButtonHTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-semibold transition-all active:scale-95",
          {
            'bg-[#7C5CFF] text-[#EAEFF4] hover:brightness-110 shadow-[0_0_15px_rgba(124,92,255,0.2)]': variant === 'primary',
            'bg-[#15181C] text-[#EAEFF4] border border-[#272C33] hover:bg-[#272C33]': variant === 'secondary',
            'bg-transparent text-slate-400 hover:text-white hover:bg-[#272C33]': variant === 'ghost',
            'px-3 py-1.5 text-xs': size === 'sm',
            'px-5 py-2.5 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
