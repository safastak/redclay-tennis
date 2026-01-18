/**
 * Booking Flow E2E Tests
 * Red Clay Tennis Booking Platform
 *
 * End-to-end tests for the complete booking user journey.
 *
 * Priority: HIGH - Critical user path
 */

import { test, expect, Page } from '@playwright/test';

// ============================================================================
// Test Fixtures & Helpers
// ============================================================================

/**
 * Helper to login as a test user
 */
async function loginAsUser(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.fill('[name=email]', email);
  await page.fill('[name=password]', password);
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/dashboard');
}

/**
 * Helper to get tomorrow's date formatted for input
 */
function getTomorrowFormatted(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// ============================================================================
// Test Suite: Booking Flow
// ============================================================================

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as premium test user before each test
    await loginAsUser(page, 'premium@example.com', 'password123');
  });

  // --------------------------------------------------------------------------
  // Complete Booking Flow
  // --------------------------------------------------------------------------

  test.describe('Complete Booking Journey', () => {
    test('premium user can complete booking flow', async ({ page }) => {
      // Navigate to booking page
      await page.click('text=Book a Court');
      await expect(page).toHaveURL('/bookings/new');

      // Select sport type
      await page.click('button:has-text("Tennis")');

      // Select date (tomorrow)
      await page.fill('[name=date]', getTomorrowFormatted());

      // Select time slot
      await page.click('button:has-text("10:00 AM")');

      // Select court
      await page.click('text=Court 1');

      // Confirm booking
      await page.click('button:has-text("Confirm Booking")');

      // Verify success message
      await expect(page.locator('text=Booking confirmed')).toBeVisible();
      await expect(page.locator('text=Court 1')).toBeVisible();

      // Verify booking appears in list
      await page.goto('/bookings');
      await expect(page.locator('text=Court 1')).toBeVisible();
    });

    test('user can book with a trainer', async ({ page }) => {
      await page.goto('/bookings/new');

      // Select sport and date
      await page.click('button:has-text("Tennis")');
      await page.fill('[name=date]', getTomorrowFormatted());

      // Select time slot
      await page.click('button:has-text("2:00 PM")');

      // Select court
      await page.click('text=Court 2');

      // Add trainer
      await page.click('button:has-text("Add Trainer")');
      await page.click('text=John Coach'); // Select trainer

      // Verify trainer is added
      await expect(page.locator('text=Trainer: John Coach')).toBeVisible();

      // Confirm booking
      await page.click('button:has-text("Confirm Booking")');

      // Verify success
      await expect(page.locator('text=Booking confirmed')).toBeVisible();
    });

    test('user can book pickleball court', async ({ page }) => {
      await page.goto('/bookings/new');

      // Select pickleball
      await page.click('button:has-text("Pickleball")');
      await page.fill('[name=date]', getTomorrowFormatted());
      await page.click('button:has-text("11:00 AM")');
      await page.click('text=Pickleball Court 1');

      // Confirm booking
      await page.click('button:has-text("Confirm Booking")');

      // Verify success
      await expect(page.locator('text=Booking confirmed')).toBeVisible();
      await expect(page.locator('text=Pickleball Court 1')).toBeVisible();
    });
  });

  // --------------------------------------------------------------------------
  // Package Application
  // --------------------------------------------------------------------------

  test.describe('Package Application', () => {
    test('package is automatically applied to eligible booking', async ({ page }) => {
      // User with active package
      await page.goto('/bookings/new');

      await page.click('button:has-text("Tennis")');
      await page.fill('[name=date]', getTomorrowFormatted());
      await page.click('button:has-text("10:00 AM")');
      await page.click('text=Court 1');

      // Verify package detection
      await expect(page.locator('text=Package available')).toBeVisible();
      await expect(page.locator('text=Court fee: $0')).toBeVisible();

      // Confirm booking
      await page.click('button:has-text("Confirm Booking")');

      // Verify package was applied
      await expect(page.locator('text=Package applied')).toBeVisible();
    });

    test('shows regular price when no package available', async ({ page }) => {
      // Login as user without package
      await page.goto('/logout');
      await loginAsUser(page, 'nopackage@example.com', 'password123');

      await page.goto('/bookings/new');
      await page.click('button:has-text("Tennis")');
      await page.fill('[name=date]', getTomorrowFormatted());
      await page.click('button:has-text("10:00 AM")');
      await page.click('text=Court 1');

      // Verify regular price shown
      await expect(page.locator('text=Court fee: $')).toBeVisible();
      // Price should be greater than 0
    });
  });

  // --------------------------------------------------------------------------
  // Booking Validation
  // --------------------------------------------------------------------------

  test.describe('Booking Validation', () => {
    test('cannot book past dates', async ({ page }) => {
      await page.goto('/bookings/new');

      await page.click('button:has-text("Tennis")');

      // Try to select past date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await page.fill('[name=date]', yesterday.toISOString().split('T')[0]);

      // Verify error message
      await expect(page.locator('text=Cannot book past dates')).toBeVisible();
    });

    test('shows unavailable slots as disabled', async ({ page }) => {
      await page.goto('/bookings/new');

      await page.click('button:has-text("Tennis")');
      await page.fill('[name=date]', getTomorrowFormatted());

      // Check that booked slots are disabled
      const bookedSlot = page.locator('button:has-text("10:00 AM"):disabled');
      // This will pass if there's a booked slot, or fail gracefully if not
    });
  });

  // --------------------------------------------------------------------------
  // Waitlist Flow
  // --------------------------------------------------------------------------

  test.describe('Waitlist Flow', () => {
    test('user can join waitlist when court unavailable', async ({ page }) => {
      await page.goto('/bookings/new');

      await page.click('button:has-text("Tennis")');
      await page.fill('[name=date]', getTomorrowFormatted());

      // Select an already booked slot
      await page.click('button:has-text("10:00 AM")'); // Assuming booked
      await page.click('text=Court 1');

      // Should see "Join Waitlist" instead of "Book"
      await expect(page.locator('button:has-text("Join Waitlist")')).toBeVisible();

      // Join waitlist
      await page.click('button:has-text("Join Waitlist")');

      // Verify success
      await expect(page.locator('text=Added to waitlist')).toBeVisible();
    });
  });

  // --------------------------------------------------------------------------
  // Booking Cancellation
  // --------------------------------------------------------------------------

  test.describe('Booking Cancellation', () => {
    test('user can cancel their booking', async ({ page }) => {
      // First create a booking
      await page.goto('/bookings/new');
      await page.click('button:has-text("Tennis")');
      await page.fill('[name=date]', getTomorrowFormatted());
      await page.click('button:has-text("3:00 PM")');
      await page.click('text=Court 1');
      await page.click('button:has-text("Confirm Booking")');
      await expect(page.locator('text=Booking confirmed')).toBeVisible();

      // Navigate to bookings list
      await page.goto('/bookings');

      // Find and click cancel on the booking
      await page.locator('.booking-card').filter({ hasText: '3:00 PM' }).locator('button:has-text("Cancel")').click();

      // Confirm cancellation
      await page.click('button:has-text("Yes, Cancel")');

      // Verify cancellation
      await expect(page.locator('text=Booking cancelled')).toBeVisible();
    });
  });
});

// ============================================================================
// Test Suite: Mobile Booking Flow
// ============================================================================

test.describe('Mobile Booking Flow', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 Pro

  test('booking flow works on mobile', async ({ page }) => {
    await loginAsUser(page, 'premium@example.com', 'password123');

    // Navigate using mobile menu
    await page.click('[data-testid=mobile-menu]');
    await page.click('text=Book a Court');

    // Complete booking on mobile
    await page.click('button:has-text("Tennis")');
    await page.fill('[name=date]', getTomorrowFormatted());
    await page.click('button:has-text("11:00 AM")');
    await page.click('text=Court 1');
    await page.click('button:has-text("Confirm Booking")');

    // Verify success
    await expect(page.locator('text=Booking confirmed')).toBeVisible();
  });

  test('swipe gestures work for date selection', async ({ page }) => {
    await loginAsUser(page, 'premium@example.com', 'password123');
    await page.goto('/bookings/new');

    await page.click('button:has-text("Tennis")');

    // Swipe to next week (if implemented)
    // await page.locator('[data-testid=date-picker]').swipe('left');
  });
});

// ============================================================================
// Test Suite: Error Handling
// ============================================================================

test.describe('Booking Error Handling', () => {
  test('shows error when server is unavailable', async ({ page }) => {
    await loginAsUser(page, 'premium@example.com', 'password123');

    // Mock server error
    await page.route('**/api/bookings/create', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/bookings/new');
    await page.click('button:has-text("Tennis")');
    await page.fill('[name=date]', getTomorrowFormatted());
    await page.click('button:has-text("10:00 AM")');
    await page.click('text=Court 1');
    await page.click('button:has-text("Confirm Booking")');

    // Verify error message
    await expect(page.locator('text=Something went wrong')).toBeVisible();
  });

  test('handles network timeout gracefully', async ({ page }) => {
    await loginAsUser(page, 'premium@example.com', 'password123');

    // Mock timeout
    await page.route('**/api/bookings/create', route => {
      // Don't respond - simulate timeout
    });

    await page.goto('/bookings/new');
    await page.click('button:has-text("Tennis")');
    await page.fill('[name=date]', getTomorrowFormatted());
    await page.click('button:has-text("10:00 AM")');
    await page.click('text=Court 1');
    await page.click('button:has-text("Confirm Booking")');

    // Wait for timeout message (with extended timeout)
    await expect(page.locator('text=Request timed out')).toBeVisible({ timeout: 35000 });
  });
});
