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
  full_name?: string;
  email?: string;
  password?: string;
  phone_number?: string;
  general?: string;
}

/**
 * SignupForm props interface
 */
interface SignupFormProps {
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  showLoginLink?: boolean;
  redirectTo?: string;
}

/**
 * SignupForm component
 * Handles user registration with validation
 */
export function SignupForm({
  title = 'Create Account',
  subtitle = 'Join Red Clay Tennis today',
  showHeader = true,
  showLoginLink = true,
  redirectTo = '/dashboard',
}: SignupFormProps) {
  const router = useRouter();
  const { signup, isLoading } = useAuth();

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Full name validation
    if (!fullName.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    } else if (fullName.trim().length > 255) {
      newErrors.full_name = 'Full name is too long';
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Phone number validation (optional)
    if (phoneNumber && phoneNumber.length > 20) {
      newErrors.phone_number = 'Phone number is too long';
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
      const result = await signup({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone_number: phoneNumber.trim() || undefined,
      });

      if (result.success) {
        setSuccessMessage('Account created successfully! Redirecting...');

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push(redirectTo);
        }, 1500);
      } else {
        setErrors({ general: result.error || 'Failed to create account' });
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

        {/* Full name field */}
        <Input
          type="text"
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
          error={errors.full_name}
          disabled={isFormLoading}
          autoComplete="name"
          required
        />

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
          placeholder="Create a password"
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          error={errors.password}
          hint="Must be at least 8 characters"
          disabled={isFormLoading}
          autoComplete="new-password"
          required
        />

        {/* Phone number field (optional) */}
        <Input
          type="tel"
          label="Phone Number"
          placeholder="Enter your phone number (optional)"
          value={phoneNumber}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
          error={errors.phone_number}
          disabled={isFormLoading}
          autoComplete="tel"
        />

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isFormLoading}
          disabled={isFormLoading}
        >
          {isFormLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      {/* Login link */}
      {showLoginLink && (
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-[#C75B39] hover:text-[#B54E2F] transition-colors"
          >
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}
