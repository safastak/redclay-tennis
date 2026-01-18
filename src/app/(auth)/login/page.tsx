'use client';

import { AuthLayout } from '@/components/layout';
import { LoginForm } from '@/components/auth';

/**
 * Login Page
 * Allows users to sign in to their account
 */
export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm
        title="Welcome Back"
        subtitle="Sign in to your account"
        showSignupLink={true}
      />
    </AuthLayout>
  );
}
