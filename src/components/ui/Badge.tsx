'use client';

import React, { ReactNode, HTMLAttributes } from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';
export type BadgeSize = 'sm' | 'md';

// Booking status mapping
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

// Map booking statuses to badge variants
const bookingStatusToVariant: Record<BookingStatus, BadgeVariant> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'error',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-medium rounded-full
        border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';

// Helper component for booking statuses
export interface BookingStatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: BookingStatus;
}

export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({
  status,
  children,
  ...props
}) => {
  const variant = bookingStatusToVariant[status];
  const defaultLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge variant={variant} {...props}>
      {children || defaultLabel}
    </Badge>
  );
};

BookingStatusBadge.displayName = 'BookingStatusBadge';
