'use client';

import { AuthLayout } from '@/components/layout';
import { SignupForm } from '@/components/auth';

/**
 * Signup Page
 * Allows new users to create an account
 */
export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm
        title="Create Account"
        subtitle="Join Red Clay Tennis today"
        showLoginLink={true}
      />
    </AuthLayout>
  );
}
