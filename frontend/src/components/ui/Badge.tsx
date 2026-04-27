import React, { HTMLAttributes } from 'react';
import { cn } from './Button';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded px-2 py-1 text-[10px] font-bold tracking-wider uppercase transition-colors",
        {
          'bg-[#7C5CFF]/10 text-[#7C5CFF]': variant === 'default',
          'bg-green-500/10 text-green-400': variant === 'success',
          'bg-yellow-500/10 text-yellow-400': variant === 'warning',
          'bg-red-500/10 text-red-400': variant === 'destructive',
          'border border-[#272C33] text-slate-400': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
}
