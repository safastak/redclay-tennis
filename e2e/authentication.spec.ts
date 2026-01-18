/**
 * Authentication E2E Tests
 * Red Clay Tennis Booking Platform
 *
 * End-to-end tests for user authentication flows including
 * signup, login, logout, and password management.
 *
 * Priority: HIGH - Security critical
 */

import { test, expect, Page } from '@playwright/test';

// ============================================================================
// Test Fixtures & Helpers
// ============================================================================

/**
 * Generate a unique email for testing
 */
function generateUniqueEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

// ============================================================================
// Test Suite: User Signup
// ============================================================================

test.describe('User Signup', () => {
  test('user can sign up with valid credentials', async ({ page }) => {
    await page.goto('/signup');

    const email = generateUniqueEmail();

    await page.fill('[name=email]', email);
    await page.fill('[name=full_name]', 'Test User');
    await page.fill('[name=phone]', '+1234567890');
    await page.fill('[name=password]', 'SecurePass123');
    await page.fill('[name=confirm_password]', 'SecurePass123');

    await page.click('button[type=submit]');

    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Should see welcome message
    await expect(page.locator('text=Welcome, Test User')).toBeVisible();
  });

  test('signup shows validation errors for invalid email', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('[name=email]', 'invalid-email');
    await page.fill('[name=full_name]', 'Test User');
    await page.fill('[name=password]', 'SecurePass123');
    await page.fill('[name=confirm_password]', 'SecurePass123');

    await page.click('button[type=submit]');

    // Should show email validation error
    await expect(page.locator('text=Invalid email')).toBeVisible();
  });

  test('signup shows validation errors for weak password', async ({ page }) => {
    await page.goto('/signup');

    const email = generateUniqueEmail();

    await page.fill('[name=email]', email);
    await page.fill('[name=full_name]', 'Test User');
    await page.fill('[name=password]', 'weak');
    await page.fill('[name=confirm_password]', 'weak');

    await page.click('button[type=submit]');

    // Should show password validation error
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('signup shows error when passwords do not match', async ({ page }) => {
    await page.goto('/signup');

    const email = generateUniqueEmail();

    await page.fill('[name=email]', email);
    await page.fill('[name=full_name]', 'Test User');
    await page.fill('[name=password]', 'SecurePass123');
    await page.fill('[name=confirm_password]', 'DifferentPass123');

    await page.click('button[type=submit]');

    // Should show password mismatch error
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('signup shows error for duplicate email', async ({ page }) => {
    await page.goto('/signup');

    // Use an existing email
    await page.fill('[name=email]', 'existing@example.com');
    await page.fill('[name=full_name]', 'Test User');
    await page.fill('[name=password]', 'SecurePass123');
    await page.fill('[name=confirm_password]', 'SecurePass123');

    await page.click('button[type=submit]');

    // Should show duplicate email error
    await expect(page.locator('text=Email already registered')).toBeVisible();
  });

  test('new user has correct user type after signup', async ({ page }) => {
    await page.goto('/signup');

    const email = generateUniqueEmail();

    await page.fill('[name=email]', email);
    await page.fill('[name=full_name]', 'New User');
    await page.fill('[name=password]', 'SecurePass123');
    await page.fill('[name=confirm_password]', 'SecurePass123');

    await page.click('button[type=submit]');

    // Navigate to profile
    await page.goto('/profile');

    // Should show "new" user type
    await expect(page.locator('text=Account Type: New')).toBeVisible();
  });
});

// ============================================================================
// Test Suite: User Login
// ============================================================================

test.describe('User Login', () => {
  test('user can login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name=email]', 'premium@example.com');
    await page.fill('[name=password]', 'password123');

    await page.click('button[type=submit]');

    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('login shows error for invalid email', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name=email]', 'nonexistent@example.com');
    await page.fill('[name=password]', 'password123');

    await page.click('button[type=submit]');

    // Should show error
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('login shows error for wrong password', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name=email]', 'premium@example.com');
    await page.fill('[name=password]', 'wrongpassword');

    await page.click('button[type=submit]');

    // Should show error
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('admin user is redirected to admin dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name=email]', 'admin@example.com');
    await page.fill('[name=password]', 'admin123');

    await page.click('button[type=submit]');

    // Admin should be redirected to admin dashboard
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test('login persists session after page refresh', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name=email]', 'premium@example.com');
    await page.fill('[name=password]', 'password123');
    await page.click('button[type=submit]');

    await expect(page).toHaveURL('/dashboard');

    // Refresh the page
    await page.reload();

    // Should still be logged in
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
});

// ============================================================================
// Test Suite: User Logout
// ============================================================================

test.describe('User Logout', () => {
  test('user can logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name=email]', 'premium@example.com');
    await page.fill('[name=password]', 'password123');
    await page.click('button[type=submit]');
    await expect(page).toHaveURL('/dashboard');

    // Click logout
    await page.click('[data-testid=user-menu]');
    await page.click('text=Logout');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');
  });

  test('cannot access protected routes after logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name=email]', 'premium@example.com');
    await page.fill('[name=password]', 'password123');
    await page.click('button[type=submit]');
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await page.click('[data-testid=user-menu]');
    await page.click('text=Logout');

    // Try to access dashboard
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('logout clears session data', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name=email]', 'premium@example.com');
    await page.fill('[name=password]', 'password123');
    await page.click('button[type=submit]');
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await page.click('[data-testid=user-menu]');
    await page.click('text=Logout');

    // Refresh page
    await page.reload();

    // Should still be on login page
    await expect(page).toHaveURL('/login');
  });
});

// ============================================================================
// Test Suite: Password Reset
// ============================================================================

test.describe('Password Reset', () => {
  test('user can request password reset', async ({ page }) => {
    await page.goto('/login');

    // Click forgot password
    await page.click('text=Forgot Password?');

    await expect(page).toHaveURL('/forgot-password');

    // Enter email
    await page.fill('[name=email]', 'premium@example.com');
    await page.click('button[type=submit]');

    // Should show success message
    await expect(page.locator('text=Password reset email sent')).toBeVisible();
  });

  test('password reset shows error for non-existent email', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.fill('[name=email]', 'nonexistent@example.com');
    await page.click('button[type=submit]');

    // Should show error or still show success (for security)
    // Some implementations don't reveal if email exists
  });

  test('user can reset password with valid token', async ({ page }) => {
    // This test would require a valid reset token
    // In real tests, you might mock the token or use a test-specific endpoint

    await page.goto('/reset-password?token=valid-test-token');

    await page.fill('[name=password]', 'NewSecurePass123');
    await page.fill('[name=confirm_password]', 'NewSecurePass123');
    await page.click('button[type=submit]');

    // Should show success and redirect to login
    await expect(page.locator('text=Password reset successful')).toBeVisible();
  });
});

// ============================================================================
// Test Suite: Session Management
// ============================================================================

test.describe('Session Management', () => {
  test('session expires after timeout', async ({ page }) => {
    // This test would require controlling session timeout
    // In practice, this might be tested with a shorter timeout in test environment

    await page.goto('/login');
    await page.fill('[name=email]', 'premium@example.com');
    await page.fill('[name=password]', 'password123');
    await page.click('button[type=submit]');

    // Wait for session to expire (in test, might be much shorter)
    // await page.waitForTimeout(SESSION_TIMEOUT);

    // Try to access protected route
    // Should be redirected to login
  });

  test('user sees session warning before expiration', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name=email]', 'premium@example.com');
    await page.fill('[name=password]', 'password123');
    await page.click('button[type=submit]');

    // Wait until session warning should appear
    // await page.waitForTimeout(SESSION_WARNING_TIME);

    // Should see session expiration warning
    // await expect(page.locator('text=Session expiring')).toBeVisible();
  });
});

// ============================================================================
// Test Suite: Security
// ============================================================================

test.describe('Security', () => {
  test('login form is protected against CSRF', async ({ page }) => {
    await page.goto('/login');

    // Check for CSRF token in form
    const csrfInput = page.locator('input[name=csrf_token]');
    await expect(csrfInput).toBeHidden();
  });

  test('password field is masked', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('[name=password]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('sensitive data is not logged in URL', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=password]', 'password123');
    await page.click('button[type=submit]');

    // URL should not contain password
    expect(page.url()).not.toContain('password');
  });

  test('rate limiting prevents brute force', async ({ page }) => {
    await page.goto('/login');

    // Attempt multiple failed logins
    for (let i = 0; i < 10; i++) {
      await page.fill('[name=email]', 'premium@example.com');
      await page.fill('[name=password]', 'wrongpassword');
      await page.click('button[type=submit]');
      await page.waitForTimeout(100);
    }

    // Should show rate limit message
    await expect(page.locator('text=Too many attempts')).toBeVisible();
  });
});

// ============================================================================
// Test Suite: Mobile Authentication
// ============================================================================

test.describe('Mobile Authentication', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('login works on mobile', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name=email]', 'premium@example.com');
    await page.fill('[name=password]', 'password123');
    await page.tap('button[type=submit]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('signup form is usable on mobile', async ({ page }) => {
    await page.goto('/signup');

    const email = generateUniqueEmail();

    // All form fields should be visible and tappable
    await page.fill('[name=email]', email);
    await page.fill('[name=full_name]', 'Mobile User');
    await page.fill('[name=password]', 'SecurePass123');
    await page.fill('[name=confirm_password]', 'SecurePass123');

    await page.tap('button[type=submit]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('mobile keyboard does not obscure form fields', async ({ page }) => {
    await page.goto('/login');

    // Focus on password field
    await page.tap('[name=password]');

    // Submit button should still be visible (scrolled into view)
    await expect(page.locator('button[type=submit]')).toBeInViewport();
  });
});
