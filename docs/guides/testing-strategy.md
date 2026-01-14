# Testing Strategy
## Red Clay Tennis Booking Platform

**Purpose:** Comprehensive testing approach for the platform
**Target Audience:** Development team implementing tests
**Coverage Goal:** 80%+ code coverage for critical paths

---

## Table of Contents

1. [Testing Pyramid](#testing-pyramid)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [End-to-End Tests](#end-to-end-tests)
5. [Testing Tools](#testing-tools)
6. [Running Tests](#running-tests)

---

## Testing Pyramid

Our testing strategy follows the testing pyramid approach:

```
         /\
        /  \  E2E Tests (10%)
       /____\
      /      \
     / Integ. \ Integration Tests (30%)
    /__________\
   /            \
  /  Unit Tests  \ Unit Tests (60%)
 /________________\
```

- **Unit Tests (60%):** Test individual functions and business logic
- **Integration Tests (30%):** Test API endpoints and database interactions
- **E2E Tests (10%):** Test complete user workflows

---

## Unit Tests

Test critical business logic in isolation.

### Package Application Logic

Test the package application algorithm:

```typescript
// __tests__/lib/packages.test.ts
import { applyPackageToBooking } from '@/lib/packages'
import { createTestBooking, createTestPackage, mockClient } from '../helpers'

describe('Package Application', () => {
  test('applies package to eligible booking', async () => {
    const booking = createTestBooking({
      user_id: 'user-1',
      court_id: 'court-1',
      trainer_id: null,
      is_peak_time: false
    })

    const result = await applyPackageToBooking(mockClient, booking)

    expect(result.applied).toBe(true)
    expect(result.package_id).toBeDefined()
    expect(result.session_type).toBe('court_only')
  })

  test('rejects package for peak time when off-peak only', async () => {
    const booking = createTestBooking({
      is_peak_time: true,
      user_id: 'user-with-offpeak-package'
    })

    const result = await applyPackageToBooking(mockClient, booking)

    expect(result.applied).toBe(false)
  })

  test('deducts trainer session when trainer included', async () => {
    const booking = createTestBooking({
      trainer_id: 'trainer-1'
    })

    const result = await applyPackageToBooking(mockClient, booking)

    expect(result.applied).toBe(true)
    expect(result.session_type).toBe('trainer_included')

    // Verify session deducted
    const pkg = await mockClient.query(
      'SELECT remaining_trainer_sessions FROM user_packages WHERE id = $1',
      [result.package_id]
    )
    expect(pkg.rows[0].remaining_trainer_sessions).toBe(7) // Was 8
  })

  test('marks package as depleted when sessions exhausted', async () => {
    const booking = createTestBooking({
      user_id: 'user-with-last-session'
    })

    await applyPackageToBooking(mockClient, booking)

    const pkg = await mockClient.query(
      'SELECT status FROM user_packages WHERE user_id = $1',
      ['user-with-last-session']
    )
    expect(pkg.rows[0].status).toBe('depleted')
  })
})
```

### Authentication & Authorization

```typescript
// __tests__/lib/auth.test.ts
import { verifyToken, generateToken } from '@/lib/auth'

describe('Authentication', () => {
  test('generates valid JWT token', () => {
    const token = generateToken({
      userId: 'user-1',
      email: 'test@example.com',
      role: 'member'
    })

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
  })

  test('verifies valid token', async () => {
    const token = generateToken({ userId: 'user-1' })
    const decoded = await verifyToken(token)

    expect(decoded.userId).toBe('user-1')
  })

  test('rejects expired token', async () => {
    // Create token that expired 1 hour ago
    const token = generateToken(
      { userId: 'user-1' },
      { expiresIn: '-1h' }
    )

    await expect(verifyToken(token)).rejects.toThrow('Token expired')
  })
})
```

### Booking Status Logic

```typescript
// __tests__/lib/booking-status.test.ts
import { determineBookingStatus } from '@/lib/booking-status'

describe('Booking Status', () => {
  test('premium users get instant confirmation', () => {
    const status = determineBookingStatus({
      userType: 'premium',
      role: 'member'
    })

    expect(status).toBe('confirmed')
  })

  test('new users require approval', () => {
    const status = determineBookingStatus({
      userType: 'new',
      role: 'member'
    })

    expect(status).toBe('pending')
  })

  test('admins get instant confirmation', () => {
    const status = determineBookingStatus({
      userType: 'new',
      role: 'admin'
    })

    expect(status).toBe('confirmed')
  })
})
```

---

## Integration Tests

Test API endpoints with database interactions.

### Booking Creation API

```typescript
// __tests__/api/bookings/create.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/bookings/create'
import { setupTestDatabase, teardownTestDatabase } from '../../helpers/db'

beforeAll(async () => {
  await setupTestDatabase()
})

afterAll(async () => {
  await teardownTestDatabase()
})

describe('POST /api/bookings/create', () => {
  test('creates booking for premium user', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        court_id: 'test-court-id',
        booking_date: '2026-01-20',
        start_time: '10:00:00',
        end_time: '11:00:00'
      },
      headers: {
        authorization: 'Bearer ' + generateTestToken({ userType: 'premium' })
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data.booking.status).toBe('confirmed')
    expect(data.booking.court_fee).toBeGreaterThan(0)
  })

  test('rejects booking for conflicting time slot', async () => {
    // Create first booking
    await createTestBooking({
      court_id: 'court-1',
      booking_date: '2026-01-20',
      start_time: '10:00:00'
    })

    // Try to create conflicting booking
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        court_id: 'court-1',
        booking_date: '2026-01-20',
        start_time: '10:00:00',
        end_time: '11:00:00'
      },
      headers: {
        authorization: 'Bearer ' + generateTestToken()
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(409)
    const data = JSON.parse(res._getData())
    expect(data.error).toContain('already booked')
  })

  test('applies package to eligible booking', async () => {
    // Create user with active package
    const userId = await createTestUser({
      type: 'regular',
      packages: [createTestPackage({ remaining: 8 })]
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        court_id: 'court-1',
        booking_date: '2026-01-20',
        start_time: '14:00:00',
        end_time: '15:00:00'
      },
      headers: {
        authorization: 'Bearer ' + generateTestToken({ userId })
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data.package.applied).toBe(true)
    expect(data.booking.court_fee).toBe(0) // Package applied
  })
})
```

### Admin Approval API

```typescript
// __tests__/api/admin/bookings/approve.test.ts
describe('POST /api/admin/bookings/[id]/approve', () => {
  test('admin can approve pending booking', async () => {
    const booking = await createTestBooking({ status: 'pending' })

    const { req, res } = createMocks({
      method: 'POST',
      query: { id: booking.id },
      body: { admin_notes: 'Approved by test' },
      headers: {
        authorization: 'Bearer ' + generateTestToken({ role: 'admin' })
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.booking.status).toBe('confirmed')
  })

  test('non-admin cannot approve booking', async () => {
    const booking = await createTestBooking({ status: 'pending' })

    const { req, res } = createMocks({
      method: 'POST',
      query: { id: booking.id },
      headers: {
        authorization: 'Bearer ' + generateTestToken({ role: 'member' })
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(403)
  })
})
```

---

## End-to-End Tests

Test complete user workflows using Playwright or Cypress.

### Complete Booking Flow

```typescript
// e2e/booking-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login')
    await page.fill('[name=email]', 'test@example.com')
    await page.fill('[name=password]', 'password123')
    await page.click('button[type=submit]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('complete booking flow for premium user', async ({ page }) => {
    // Navigate to booking page
    await page.click('text=Book a Court')
    await expect(page).toHaveURL('/bookings/new')

    // Select sport
    await page.click('button:has-text("Tennis")')

    // Select date (tomorrow)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await page.fill('[name=date]', tomorrow.toISOString().split('T')[0])

    // Select time slot
    await page.click('button:has-text("10:00 AM")')

    // Select court
    await page.click('text=Court 1')

    // Confirm booking
    await page.click('button:has-text("Confirm Booking")')

    // Verify success
    await expect(page.locator('text=Booking confirmed')).toBeVisible()
    await expect(page.locator('text=Court 1')).toBeVisible()

    // Verify on bookings list
    await page.goto('/bookings')
    await expect(page.locator('text=Court 1')).toBeVisible()
  })

  test('waitlist flow when court unavailable', async ({ page }) => {
    // Navigate to booking
    await page.goto('/bookings/new')

    // Select already booked slot
    await page.click('button:has-text("Tennis")')
    await page.fill('[name=date]', '2026-01-20')
    await page.click('button:has-text("10:00 AM")') // Already booked

    // Should see "Join Waitlist" instead of "Book"
    await expect(page.locator('button:has-text("Join Waitlist")')).toBeVisible()

    // Join waitlist
    await page.click('button:has-text("Join Waitlist")')

    // Verify success
    await expect(page.locator('text=Added to waitlist')).toBeVisible()
  })
})
```

### Admin Dashboard Flow

```typescript
// e2e/admin-dashboard.spec.ts
test.describe('Admin Dashboard', () => {
  test('admin can approve pending bookings', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('[name=email]', 'admin@example.com')
    await page.fill('[name=password]', 'admin123')
    await page.click('button[type=submit]')

    // Go to pending bookings
    await page.goto('/admin/bookings/pending')

    // Should see pending bookings
    const pendingCount = await page.locator('.booking-card').count()
    expect(pendingCount).toBeGreaterThan(0)

    // Approve first booking
    await page.locator('.booking-card').first().click('button:has-text("Approve")')

    // Add admin notes
    await page.fill('[name=admin_notes]', 'Approved via E2E test')
    await page.click('button:has-text("Confirm Approval")')

    // Verify success
    await expect(page.locator('text=Booking approved')).toBeVisible()

    // Verify booking moved from pending
    const newPendingCount = await page.locator('.booking-card').count()
    expect(newPendingCount).toBe(pendingCount - 1)
  })
})
```

---

## Testing Tools

### Recommended Stack

```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "node-mocks-http": "^1.13.0",
    "@playwright/test": "^1.40.0"
  }
}
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

---

## Running Tests

### Run All Tests

```bash
# Run all unit and integration tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Run Specific Test Suites

```bash
# Run only unit tests
npm test -- __tests__/lib/

# Run only API tests
npm test -- __tests__/api/

# Run specific test file
npm test -- __tests__/lib/packages.test.ts
```

### Run E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run in UI mode
npm run test:e2e -- --ui

# Run specific test
npm run test:e2e -- booking-flow.spec.ts
```

### Continuous Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage

      - name: Run E2E tests
        run: |
          npx playwright install --with-deps
          npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Next Steps

- **Review Implementation Plans:** [Phase 1 MVP](../implementation/phase-1-mvp.md)
- **Set Up Deployment:** [Deployment Guide](deployment-guide.md)
- **Understand Architecture:** [Platform Overview](../architecture/platform-overview.md)

---

**Document Version:** 2.0
**Last Updated:** January 14, 2026
**Coverage Goal:** 80%+
