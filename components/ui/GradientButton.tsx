'use client';

import { ButtonHTMLAttributes } from 'react';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  urgent?: boolean;
}

const sizeClasses: Record<string, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

const shadowNormal = '0 0 24px rgba(252,80,25,0.40), 0 4px 12px rgba(252,80,25,0.25)';
const shadowUrgent = '0 0 32px rgba(252,80,25,0.55), 0 0 8px rgba(252,80,25,0.30)';

export function GradientButton({
  children,
  size = 'md',
  fullWidth = false,
  urgent = false,
  disabled = false,
  className = '',
  style,
  ...rest
}: GradientButtonProps) {
  return (
    <button
      disabled={disabled}
      className={[
        'relative inline-flex items-center justify-center rounded-full border-none font-sans font-semibold text-white',
        'transition-all duration-200 ease-out cursor-pointer select-none',
        'hover:brightness-110 hover:scale-[1.02]',
        'active:scale-[0.97]',
        'disabled:opacity-40 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed',
        'group',
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      style={{
        background: 'linear-gradient(135deg, #FC5019 0%, #E8470F 60%, #D93D0A 100%)',
        borderRadius: 999,
        fontFamily: '"DM Sans", system-ui, sans-serif',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        boxShadow: disabled ? 'none' : urgent ? shadowUrgent : shadowNormal,
        ...style,
      }}
      {...rest}
    >
      {/* Shimmer overlay */}
      <span
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)',
        }}
      />
      <span className="relative z-10">{children}</span>
    </button>
  );
}
