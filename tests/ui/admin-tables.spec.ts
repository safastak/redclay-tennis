import { test, expect } from '@playwright/test'

test.describe('Admin Tables UI', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@redclay.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Wait for redirect after login
    await page.waitForURL(/\/admin/)
  })

  test('Users table should display user data', async ({ page }) => {
    // Navigate to users page
    await page.goto('/admin/users')

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 })

    // Check that table exists
    const table = await page.locator('table')
    await expect(table).toBeVisible()

    // Check for table headers
    await expect(page.getByText('Name')).toBeVisible()
    await expect(page.getByText('Email')).toBeVisible()
    await expect(page.getByText('Phone')).toBeVisible()
    await expect(page.getByText('Role')).toBeVisible()

    // Get the first table row (skip header)
    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow).toBeVisible()

    // Verify the row contains actual data (not empty or 'undefined')
    const rowText = await firstRow.textContent()
    console.log('First row content:', rowText)

    // Check that row doesn't contain 'undefined' text
    expect(rowText).not.toContain('undefined')

    // Check that row has actual email (contains @)
    expect(rowText).toContain('@')

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'playwright-report/users-table.png', fullPage: true })
  })

  test('Bookings table should display booking data', async ({ page }) => {
    // Navigate to bookings page
    await page.goto('/admin/bookings')

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 })

    // Check that table exists
    const table = await page.locator('table')
    await expect(table).toBeVisible()

    // Check for expected columns
    await expect(page.getByText('Date')).toBeVisible()
    await expect(page.getByText('User')).toBeVisible()
    await expect(page.getByText('Court')).toBeVisible()
    await expect(page.getByText('Status')).toBeVisible()

    // Get the first table row
    const firstRow = page.locator('tbody tr').first()

    // Check if table has data
    const rowCount = await page.locator('tbody tr').count()

    if (rowCount > 0) {
      await expect(firstRow).toBeVisible()

      // Verify the row contains actual data
      const rowText = await firstRow.textContent()
      console.log('First booking row content:', rowText)

      // Check that row doesn't contain 'undefined' text
      expect(rowText).not.toContain('undefined')
    } else {
      console.log('No bookings found in table')
    }

    // Take a screenshot
    await page.screenshot({ path: 'playwright-report/bookings-table.png', fullPage: true })
  })
})
