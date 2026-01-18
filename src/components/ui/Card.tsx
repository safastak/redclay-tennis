'use client';

import React, { ReactNode, HTMLAttributes } from 'react';

export type CardVariant = 'default' | 'elevated' | 'bordered';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: CardVariant;
  hoverable?: boolean;
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white shadow-sm',
  elevated: 'bg-white shadow-lg',
  bordered: 'bg-white border border-gray-200',
};

const hoverStyles: Record<CardVariant, string> = {
  default: 'hover:shadow-md',
  elevated: 'hover:shadow-xl',
  bordered: 'hover:border-[#C75B39]/50',
};

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  footer,
  variant = 'default',
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`
        rounded-xl overflow-hidden
        transition-all duration-200 ease-in-out
        ${variantStyles[variant]}
        ${hoverable ? hoverStyles[variant] : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-100">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.displayName = 'Card';

// Sub-components for more flexible composition
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`px-6 py-4 border-b border-gray-100 ${className}`}
    {...props}
  >
    {children}
  </div>
);

CardHeader.displayName = 'CardHeader';

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`px-6 py-4 ${className}`} {...props}>
    {children}
  </div>
);

CardBody.displayName = 'CardBody';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`px-6 py-4 bg-gray-50 border-t border-gray-100 ${className}`}
    {...props}
  >
    {children}
  </div>
);

CardFooter.displayName = 'CardFooter';
