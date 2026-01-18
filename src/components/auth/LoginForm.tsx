'use client';

import React, { useState, FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from './AuthProvider';

/**
 * Form field errors interface
 */
interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

/**
 * LoginForm props interface
 */
interface LoginFormProps {
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  showSignupLink?: boolean;
  redirectTo?: string;
}

/**
 * LoginForm component
 * Handles user authentication with validation
 */
export function LoginForm({
  title = 'Welcome Back',
  subtitle = 'Sign in to your account',
  showHeader = true,
  showSignupLink = true,
  redirectTo = '/dashboard',
}: LoginFormProps) {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Clear previous messages
    setErrors({});
    setSuccessMessage('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(email.trim().toLowerCase(), password);

      if (result.success) {
        setSuccessMessage('Login successful! Redirecting...');

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push(redirectTo);
        }, 1000);
      } else {
        setErrors({ general: result.error || 'Invalid email or password' });
      }
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <div className="w-full">
      {showHeader && (
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Success message */}
        {successMessage && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {/* General error message */}
        {errors.general && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{errors.general}</p>
          </div>
        )}

        {/* Email field */}
        <Input
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          error={errors.email}
          disabled={isFormLoading}
          autoComplete="email"
          required
        />

        {/* Password field */}
        <Input
          type="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          error={errors.password}
          disabled={isFormLoading}
          autoComplete="current-password"
          required
        />

        {/* Forgot password link */}
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-[#C75B39] hover:text-[#B54E2F] transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isFormLoading}
          disabled={isFormLoading}
        >
          {isFormLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {/* Signup link */}
      {showSignupLink && (
        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-[#C75B39] hover:text-[#B54E2F] transition-colors"
          >
            Create one
          </Link>
        </p>
      )}
    </div>
  );
}
