'use client';

import React, { forwardRef, SelectHTMLAttributes, ReactNode } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectOptGroup {
  label: string;
  options: SelectOption[];
}

export type SelectOptions = (SelectOption | SelectOptGroup)[];

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOptions;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  containerClassName?: string;
}

// Type guard to check if an option is an optgroup
const isOptGroup = (option: SelectOption | SelectOptGroup): option is SelectOptGroup => {
  return 'options' in option;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      value,
      onChange,
      error,
      hint,
      placeholder,
      disabled = false,
      className = '',
      containerClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(event.target.value);
    };

    const baseSelectStyles = `
      block w-full rounded-lg
      border bg-white
      text-gray-900
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500
      appearance-none
      py-2.5 pl-4 pr-10
    `;

    const stateStyles = hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
      : 'border-gray-300 focus:border-[#C75B39] focus:ring-[#C75B39]/30';

    const renderOptions = (opts: SelectOptions): ReactNode[] => {
      return opts.map((option, index) => {
        if (isOptGroup(option)) {
          return (
            <optgroup key={`group-${index}`} label={option.label}>
              {option.options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          );
        }
        return (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        );
      });
    };

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className={`
              block text-sm font-medium mb-1.5
              ${hasError ? 'text-red-600' : 'text-gray-700'}
              ${disabled ? 'opacity-50' : ''}
            `.trim().replace(/\s+/g, ' ')}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={`
              ${baseSelectStyles}
              ${stateStyles}
              ${!value && placeholder ? 'text-gray-400' : ''}
              ${className}
            `.trim().replace(/\s+/g, ' ')}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {renderOptions(options)}
          </select>
          {/* Dropdown arrow */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg
              className={`w-5 h-5 ${hasError ? 'text-red-500' : 'text-gray-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-sm text-red-600">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="mt-1.5 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
