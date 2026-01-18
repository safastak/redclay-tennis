'use client';

import React, { HTMLAttributes } from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  className?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  ...props
}) => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`
        inline-block
        rounded-full
        border-[#C75B39]/30
        border-t-[#C75B39]
        animate-spin
        ${sizeStyles[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

Spinner.displayName = 'Spinner';

// Full page loading spinner
export interface FullPageSpinnerProps {
  message?: string;
}

export const FullPageSpinner: React.FC<FullPageSpinnerProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50">
      <Spinner size="lg" />
      <p className="mt-4 text-sm text-gray-600 font-medium">{message}</p>
    </div>
  );
};

FullPageSpinner.displayName = 'FullPageSpinner';

// Inline loading state for buttons or small areas
export interface InlineSpinnerProps {
  size?: SpinnerSize;
  text?: string;
  className?: string;
}

export const InlineSpinner: React.FC<InlineSpinnerProps> = ({
  size = 'sm',
  text,
  className = '',
}) => {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Spinner size={size} />
      {text && <span className="text-gray-600">{text}</span>}
    </span>
  );
};

InlineSpinner.displayName = 'InlineSpinner';
