'use client';

import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[#C75B39] text-white
    hover:bg-[#B54E2F]
    focus:ring-[#C75B39]/50
    disabled:bg-[#C75B39]/50
  `,
  secondary: `
    bg-[#8B4513] text-white
    hover:bg-[#6B3410]
    focus:ring-[#8B4513]/50
    disabled:bg-[#8B4513]/50
  `,
  outline: `
    bg-transparent text-[#C75B39] border-2 border-[#C75B39]
    hover:bg-[#C75B39]/10
    focus:ring-[#C75B39]/50
    disabled:border-[#C75B39]/50 disabled:text-[#C75B39]/50
  `,
  danger: `
    bg-red-600 text-white
    hover:bg-red-700
    focus:ring-red-500/50
    disabled:bg-red-600/50
  `,
  ghost: `
    bg-transparent text-[#C75B39]
    hover:bg-[#C75B39]/10
    focus:ring-[#C75B39]/50
    disabled:text-[#C75B39]/50
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-6 py-3 text-lg gap-2.5',
};

const iconSizes: Record<ButtonSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center
          font-medium rounded-lg
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        {loading ? (
          <Spinner size={size === 'lg' ? 'md' : 'sm'} className="mr-2" />
        ) : leftIcon ? (
          <span className={iconSizes[size]}>{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon && (
          <span className={iconSizes[size]}>{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
