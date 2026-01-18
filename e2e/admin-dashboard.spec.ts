/**
 * Admin Dashboard E2E Tests
 * Red Clay Tennis Booking Platform
 *
 * End-to-end tests for admin functionality including booking approval,
 * user management, and dashboard features.
 *
 * Priority: HIGH - Critical admin workflows
 */

import { test, expect, Page } from '@playwright/test';

// ============================================================================
// Test Fixtures & Helpers
// ============================================================================

/**
 * Helper to login as admin
 */
async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.fill('[name=email]', 'admin@example.com');
  await page.fill('[name=password]', 'admin123');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/admin/dashboard');
}

/**
 * Helper to login as regular user
 */
async function loginAsUser(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.fill('[name=email]', email);
  await page.fill('[name=password]', password);
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/dashboard');
}

// ============================================================================
// Test Suite: Admin Dashboard
// ============================================================================

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // --------------------------------------------------------------------------
  // Dashboard Overview
  // --------------------------------------------------------------------------

  test.describe('Dashboard Overview', () => {
    test('admin sees dashboard with key metrics', async ({ page }) => {
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();

      // Check for key metrics
      await expect(page.locator('[data-testid=pending-bookings-count]')).toBeVisible();
      await expect(page.locator('[data-testid=total-bookings-today]')).toBeVisible();
      await expect(page.locator('[data-testid=active-users]')).toBeVisible();
    });

    test('admin can navigate to different sections', async ({ page }) => {
      // Pending bookings
      await page.click('text=Pending Bookings');
      await expect(page).toHaveURL('/admin/bookings/pending');

      // Users
      await page.click('text=Users');
      await expect(page).toHaveURL('/admin/users');

      // Courts
      await page.click('text=Courts');
      await expect(page).toHaveURL('/admin/courts');
    });
  });

  // --------------------------------------------------------------------------
  // Booking Approval Workflow
  // --------------------------------------------------------------------------

  test.describe('Booking Approval', () => {
    test('admin can approve pending booking', async ({ page }) => {
      await page.goto('/admin/bookings/pending');

      // Should see pending bookings
      const pendingCount = await page.locator('.booking-card').count();

      if (pendingCount > 0) {
        // Click approve on first booking
        await page.locator('.booking-card').first().locator('button:has-text("Approve")').click();

        // Add admin notes (optional)
        await page.fill('[name=admin_notes]', 'Approved via E2E test');
        await page.click('button:has-text("Confirm Approval")');

        // Verify success
        await expect(page.locator('text=Booking approved')).toBeVisible();

        // Verify booking removed from pending list
        const newPendingCount = await page.locator('.booking-card').count();
        expect(newPendingCount).toBe(pendingCount - 1);
      }
    });

    test('admin can deny pending booking with reason', async ({ page }) => {
      await page.goto('/admin/bookings/pending');

      const pendingCount = await page.locator('.booking-card').count();

      if (pendingCount > 0) {
        // Click deny on first booking
        await page.locator('.booking-card').first().locator('button:has-text("Deny")').click();

        // Add denial reason (required)
        await page.fill('[name=denial_reason]', 'User verification failed');
        await page.click('button:has-text("Confirm Denial")');

        // Verify success
        await expect(page.locator('text=Booking denied')).toBeVisible();
      }
    });

    test('denial requires a reason', async ({ page }) => {
      await page.goto('/admin/bookings/pending');

      const pendingCount = await page.locator('.booking-card').count();

      if (pendingCount > 0) {
        // Click deny on first booking
        await page.locator('.booking-card').first().locator('button:has-text("Deny")').click();

        // Try to confirm without reason
        await page.click('button:has-text("Confirm Denial")');

        // Should show validation error
        await expect(page.locator('text=Reason is required')).toBeVisible();
      }
    });

    test('admin can view booking details before approving', async ({ page }) => {
      await page.goto('/admin/bookings/pending');

      const pendingCount = await page.locator('.booking-card').count();

      if (pendingCount > 0) {
        // Click on booking to view details
        await page.locator('.booking-card').first().click();

        // Should show booking details modal or page
        await expect(page.locator('[data-testid=booking-details]')).toBeVisible();
        await expect(page.locator('text=User:')).toBeVisible();
        await expect(page.locator('text=Court:')).toBeVisible();
        await expect(page.locator('text=Date:')).toBeVisible();
        await expect(page.locator('text=Time:')).toBeVisible();
      }
    });
  });

  // --------------------------------------------------------------------------
  // User Management
  // --------------------------------------------------------------------------

  test.describe('User Management', () => {
    test('admin can view user list', async ({ page }) => {
      await page.goto('/admin/users');

      await expect(page.locator('h1:has-text("Users")')).toBeVisible();
      await expect(page.locator('.user-row').first()).toBeVisible();
    });

    test('admin can upgrade user from new to premium', async ({ page }) => {
      await page.goto('/admin/users');

      // Find a "new" user
      const newUserRow = page.locator('.user-row').filter({ hasText: 'new' }).first();

      if (await newUserRow.isVisible()) {
        await newUserRow.locator('button:has-text("Upgrade")').click();

        // Select premium
        await page.click('text=Premium');
        await page.click('button:has-text("Confirm Upgrade")');

        // Verify success
        await expect(page.locator('text=User upgraded')).toBeVisible();
      }
    });

    test('admin can search users', async ({ page }) => {
      await page.goto('/admin/users');

      // Search for specific user
      await page.fill('[name=search]', 'test@example.com');
      await page.press('[name=search]', 'Enter');

      // Should filter results
      await expect(page.locator('.user-row')).toHaveCount(1);
    });

    test('admin can filter users by type', async ({ page }) => {
      await page.goto('/admin/users');

      // Filter by new users
      await page.selectOption('[name=user_type_filter]', 'new');

      // All visible users should be "new" type
      const userRows = page.locator('.user-row');
      const count = await userRows.count();

      for (let i = 0; i < count; i++) {
        await expect(userRows.nth(i).locator('.user-type')).toHaveText('new');
      }
    });
  });

  // --------------------------------------------------------------------------
  // Court Management
  // --------------------------------------------------------------------------

  test.describe('Court Management', () => {
    test('admin can view court list', async ({ page }) => {
      await page.goto('/admin/courts');

      await expect(page.locator('h1:has-text("Courts")')).toBeVisible();
      await expect(page.locator('.court-card').first()).toBeVisible();
    });

    test('admin can disable a court', async ({ page }) => {
      await page.goto('/admin/courts');

      // Find an active court
      const activeCourt = page.locator('.court-card').filter({ hasText: 'Active' }).first();

      if (await activeCourt.isVisible()) {
        await activeCourt.locator('button:has-text("Disable")').click();
        await page.click('button:has-text("Confirm")');

        // Verify court is disabled
        await expect(page.locator('text=Court disabled')).toBeVisible();
      }
    });

    test('admin can update court pricing', async ({ page }) => {
      await page.goto('/admin/courts');

      // Click edit on first court
      await page.locator('.court-card').first().locator('button:has-text("Edit")').click();

      // Update peak rate
      await page.fill('[name=hourly_rate_peak]', '75');
      await page.fill('[name=hourly_rate_offpeak]', '50');
      await page.click('button:has-text("Save Changes")');

      // Verify success
      await expect(page.locator('text=Court updated')).toBeVisible();
    });
  });

  // --------------------------------------------------------------------------
  // Reports
  // --------------------------------------------------------------------------

  test.describe('Reports', () => {
    test('admin can view booking reports', async ({ page }) => {
      await page.goto('/admin/reports/bookings');

      await expect(page.locator('h1:has-text("Booking Reports")')).toBeVisible();
      await expect(page.locator('[data-testid=bookings-chart]')).toBeVisible();
    });

    test('admin can filter reports by date range', async ({ page }) => {
      await page.goto('/admin/reports/bookings');

      // Set date range
      await page.fill('[name=start_date]', '2026-01-01');
      await page.fill('[name=end_date]', '2026-01-31');
      await page.click('button:has-text("Apply Filter")');

      // Chart should update
      await expect(page.locator('[data-testid=bookings-chart]')).toBeVisible();
    });

    test('admin can export report as CSV', async ({ page }) => {
      await page.goto('/admin/reports/bookings');

      // Start download
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export CSV")');
      const download = await downloadPromise;

      // Verify file name
      expect(download.suggestedFilename()).toContain('bookings');
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });
});

// ============================================================================
// Test Suite: Admin Access Control
// ============================================================================

test.describe('Admin Access Control', () => {
  test('non-admin cannot access admin dashboard', async ({ page }) => {
    // Login as regular user
    await loginAsUser(page, 'regular@example.com', 'password123');

    // Try to access admin dashboard
    await page.goto('/admin/dashboard');

    // Should be redirected or show access denied
    await expect(page).not.toHaveURL('/admin/dashboard');
  });

  test('non-admin cannot access pending bookings', async ({ page }) => {
    await loginAsUser(page, 'regular@example.com', 'password123');

    await page.goto('/admin/bookings/pending');

    // Should be redirected or show access denied
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });
});

// ============================================================================
// Test Suite: Admin Mobile View
// ============================================================================

test.describe('Admin Mobile View', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('admin dashboard is responsive on mobile', async ({ page }) => {
    await loginAsAdmin(page);

    // Mobile menu should be visible
    await expect(page.locator('[data-testid=mobile-menu]')).toBeVisible();

    // Can navigate via mobile menu
    await page.click('[data-testid=mobile-menu]');
    await page.click('text=Pending Bookings');
    await expect(page).toHaveURL('/admin/bookings/pending');
  });

  test('admin can approve booking on mobile', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/bookings/pending');

    const pendingCount = await page.locator('.booking-card').count();

    if (pendingCount > 0) {
      // Swipe to reveal actions (if implemented) or tap card
      await page.locator('.booking-card').first().tap();
      await page.locator('button:has-text("Approve")').tap();
      await page.locator('button:has-text("Confirm Approval")').tap();

      await expect(page.locator('text=Booking approved')).toBeVisible();
    }
  });
});
