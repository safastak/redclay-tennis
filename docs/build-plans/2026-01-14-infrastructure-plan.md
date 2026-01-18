# Infrastructure Implementation Plan
## Red Clay Tennis Platform - Phase 1

> **For Claude:** Execute phases sequentially. For each phase:
> 1. Check git log to understand current state
> 2. Create/update detailed plan if needed (no commit instructions in plans)
> 3. Execute the phase implementation
> 4. Validate with `npm run build` and `npm run db:test`
> 5. Implement test coverage
> 6. Run all tests: `npm test`
> 7. Code quality review - check for duplication, ensure patterns
> 8. Review docs - update if needed
> 9. Commit the completed phase after validation passes
> 10. Proceed to next phase

**Goal:** Set up complete infrastructure foundation (database, authentication, core utilities)

**Current State:** Phase 1 backend foundation is complete, ready for database connection

---

## On Each Iteration

1. **Check git log** - run `git log --oneline | grep "feat(infra): phase"` to see completed phases
2. **Determine current phase** - first phase (0, 1, 2, 3, 4) not yet in commit history
3. **Check git status** - if uncommitted work exists for current phase, continue it
4. **If phase code is done but tests aren't** - implement tests first
5. **If phase + tests pass** - commit with `feat(infra): phase X - [description]`
6. **When all 5 phases are committed** - proceed to Final Verification

## Final Verification

After all phases are committed, verify success criteria before completing:

1. **Run full validation:**
   ```bash
   npm run typecheck && npm run build && npm test
   npm run db:test && npm run db:setup
   ```

2. **Code quality audit:**
   - No code duplication across files
   - Shared logic extracted to reusable utils
   - Consistent error handling patterns
   - Proper TypeScript types throughout

3. **Check Success Criteria** - review each item in the Success Criteria section below

4. **If any criteria not met:**
   - Identify what's missing
   - Create a fix (no new phase needed, just patch)
   - Commit as `fix(infra): [description]`
   - Re-run verification

5. **When ALL success criteria are met** - output: `<promise>INFRASTRUCTURE COMPLETE</promise>`

---

## Commit Strategy

- **Do NOT commit during plan creation or execution**
- **Do NOT include commit instructions in phase sub-plans**
- **Commit checkpoint:** After each phase AND its test coverage are complete and passing:
  1. Run `npm run typecheck && npm run build && npm test`
  2. For Phase 0 also run: `npm run db:test`
  3. If all pass, create a single commit for the phase
  4. Commit message format: `feat(infra): phase X - [brief description]`
- **Never commit partial work** - each commit should be a complete, working phase

---

## Phase Overview

| Phase | Focus | Dependencies |
|-------|-------|--------------|
| 0 | Database Setup & Connection | Neon credentials |
| 1 | Authentication System | Phase 0 |
| 2 | Core Services Layer | Phase 1 |
| 3 | Error Handling & Logging | Phase 2 |
| 4 | Testing Infrastructure | Phase 3 |

---

## Phase 0: Database Setup & Connection

**Scope:** Connect to Neon PostgreSQL, run migrations, verify tables

### 0.1 Environment Configuration

**File:** `.env.local` (create from `.env.example`)

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_OT7PxRmo9SEq@ep-late-bird-a-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Authentication
JWT_SECRET=your-super-secret-key-change-in-production-min-32-characters
JWT_EXPIRATION=7d
BCRYPT_ROUNDS=12

# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Email (optional for now)
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=
EMAIL_FROM=noreply@redclay.com

# Environment
NODE_ENV=development
```

### 0.2 Update Database Connection Pool

**File:** `lib/db/index.ts` (already exists, verify configuration)

Verify the pool configuration matches Neon requirements:
- SSL mode enabled
- Proper timeout settings
- Error handling for connection failures

### 0.3 Run Database Migrations

**File:** `scripts/setup-db.ts` (already exists, verify it works)

Execute migrations:
```bash
npm run db:setup
```

Expected output:
- ✅ Connected to database
- ✅ Migrations completed
- ✅ Tables created: 14 tables

### 0.4 Create Database Test Script

**File:** `scripts/test-db.ts` (already exists, verify it works)

Test connection:
```bash
npm run db:test
```

Expected output:
- ✅ Database connection successful
- ✅ Server time: [timestamp]
- ✅ Tables count: 14

### 0.5 Create Seed Script

**File:** `scripts/seed-db.ts`

```typescript
import { pool } from '../lib/db'
import { hashPassword } from '../lib/auth/password'

async function seedDatabase() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Seed Courts
    const courts = [
      { name: 'Court 1 - Clay', sport_type: 'tennis', surface: 'Clay', hourly_rate: 40.00, peak_hour_rate: 50.00 },
      { name: 'Court 2 - Hard', sport_type: 'tennis', surface: 'Hard court', hourly_rate: 30.00, peak_hour_rate: 40.00 },
      { name: 'Court 3 - Grass', sport_type: 'tennis', surface: 'Grass', hourly_rate: 45.00, peak_hour_rate: 55.00 },
      { name: 'Court 4 - Indoor', sport_type: 'tennis', surface: 'Hard court (Indoor)', hourly_rate: 35.00, peak_hour_rate: 45.00 },
    ]

    for (const court of courts) {
      await client.query(
        `INSERT INTO courts (name, sport_type, surface, hourly_rate, peak_hour_rate, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT DO NOTHING`,
        [court.name, court.sport_type, court.surface, court.hourly_rate, court.peak_hour_rate]
      )
    }

    // Seed Test Users
    const passwordHash = await hashPassword('Test123!')
    const adminPasswordHash = await hashPassword('Admin123!')

    const testUserResult = await client.query(
      `INSERT INTO users (email, full_name, phone_number, user_type, app_role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['test@redclay.com', 'Test User', '+1234567890', 'premium', 'user']
    )

    if (testUserResult.rows.length > 0) {
      await client.query(
        'INSERT INTO user_auth (user_id, password_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [testUserResult.rows[0].id, passwordHash]
      )
    }

    const adminUserResult = await client.query(
      `INSERT INTO users (email, full_name, phone_number, user_type, app_role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['admin@redclay.com', 'Admin User', '+1234567891', 'premium', 'admin']
    )

    if (adminUserResult.rows.length > 0) {
      await client.query(
        'INSERT INTO user_auth (user_id, password_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [adminUserResult.rows[0].id, adminPasswordHash]
      )
    }

    await client.query('COMMIT')

    console.log('✅ Database seeded successfully')
    console.log('   - 4 courts created')
    console.log('   - 2 test users created:')
    console.log('     • test@redclay.com (password: Test123!)')
    console.log('     • admin@redclay.com (password: Admin123!)')

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Seed failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

seedDatabase()
```

Add npm script to `package.json`:
```json
{
  "scripts": {
    "db:seed": "tsx scripts/seed-db.ts",
    "db:seed:clear": "tsx scripts/seed-db.ts --clear"
  }
}
```

**Validation:**
- Run `npm run db:seed`
- Verify courts and users are created in database
- Test login with test credentials

---

## Phase 1: Authentication System

**Scope:** JWT authentication, password hashing, auth middleware

### 1.1 Password Utilities

**File:** `lib/auth/password.ts` (already exists, verify)

Ensure it uses bcrypt with proper rounds (12).

### 1.2 JWT Utilities

**File:** `lib/auth/jwt.ts` (already exists, verify)

Ensure JWT secret is at least 32 characters.
Add refresh token support (optional for Phase 1).

### 1.3 Auth Middleware

**File:** `lib/auth/middleware.ts` (already exists, verify)

Add admin role check:
```typescript
export function requireAdmin(user: JWTPayload) {
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    )
  }
  return null
}

export function requireTrainer(user: JWTPayload) {
  if (user.role !== 'trainer' && user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Trainer access required' },
      { status: 403 }
    )
  }
  return null
}
```

### 1.4 User Auth Table Migration

**File:** `docs/database/migrations.sql` (update if needed)

Ensure `user_auth` table exists:
```sql
CREATE TABLE IF NOT EXISTS user_auth (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  password_reset_token TEXT,
  password_reset_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.5 Signup & Login Routes

**Files:**
- `app/api/auth/signup/route.ts` (already exists, verify)
- `app/api/auth/login/route.ts` (already exists, verify)

Ensure both routes:
- Validate input with Zod
- Handle database transactions properly
- Return proper error messages
- Generate JWT tokens correctly

**Validation:**
- Test signup with Postman/curl
- Test login with Postman/curl
- Verify JWT token is valid
- Test with invalid credentials

---

## Phase 2: Core Services Layer

**Scope:** Business logic services for bookings, courts, packages

### 2.1 Booking Service

**File:** `lib/services/booking.service.ts` (already exists, verify completeness)

Required functions:
- `createBooking(input)` - Create booking with validation
- `getBookingsByUser(userId)` - List user's bookings
- `getBookingById(id, userId)` - Get single booking
- `cancelBooking(id, userId)` - Cancel booking with refund logic
- `checkAvailability(courtId, date, time)` - Check court availability

### 2.2 Court Service

**File:** `lib/services/court.service.ts`

```typescript
import { query } from '@/lib/db'

export async function getAllCourts(sportType?: string) {
  const sql = sportType
    ? 'SELECT * FROM courts WHERE is_active = true AND sport_type = $1 ORDER BY name'
    : 'SELECT * FROM courts WHERE is_active = true ORDER BY name'

  const params = sportType ? [sportType] : []
  const result = await query(sql, params)
  return result.rows
}

export async function getCourtById(courtId: string) {
  const result = await query(
    'SELECT * FROM courts WHERE id = $1',
    [courtId]
  )
  return result.rows[0]
}

export async function getCourtAvailability(courtId: string, date: string) {
  // Get all bookings for this court on this date
  const result = await query(
    `SELECT start_time, end_time FROM bookings
     WHERE court_id = $1 AND booking_date = $2
       AND status IN ('confirmed', 'pending')
     ORDER BY start_time`,
    [courtId, date]
  )

  return result.rows
}
```

### 2.3 Package Service

**File:** `lib/services/package.service.ts`

```typescript
import { query, transaction } from '@/lib/db'
import { PoolClient } from 'pg'

export async function getAllPackages() {
  const result = await query(
    `SELECT * FROM packages WHERE is_active = true ORDER BY price`
  )
  return result.rows
}

export async function purchasePackage(userId: string, packageId: string) {
  return transaction(async (client: PoolClient) => {
    // Get package details
    const packageResult = await client.query(
      'SELECT * FROM packages WHERE id = $1 AND is_active = true',
      [packageId]
    )

    if (packageResult.rows.length === 0) {
      throw new Error('Package not found')
    }

    const pkg = packageResult.rows[0]

    // Create user package
    const result = await client.query(
      `INSERT INTO user_packages (
        user_id, package_id,
        remaining_court_only_sessions,
        remaining_trainer_sessions,
        expires_at
      ) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '${pkg.validity_days} days')
      RETURNING *`,
      [
        userId,
        packageId,
        pkg.court_only_sessions,
        pkg.trainer_sessions
      ]
    )

    // TODO: Process payment

    return result.rows[0]
  })
}

export async function getUserPackages(userId: string) {
  const result = await query(
    `SELECT up.*, p.name, p.court_only_sessions, p.trainer_sessions
     FROM user_packages up
     JOIN packages p ON up.package_id = p.id
     WHERE up.user_id = $1
       AND up.expires_at > NOW()
       AND (up.remaining_court_only_sessions > 0 OR up.remaining_trainer_sessions > 0)
     ORDER BY up.expires_at`,
    [userId]
  )
  return result.rows
}
```

### 2.4 User Service

**File:** `lib/services/user.service.ts`

```typescript
import { query } from '@/lib/db'

export async function getUserById(userId: string) {
  const result = await query(
    'SELECT id, email, full_name, phone_number, user_type, app_role, profile_image_url, created_at FROM users WHERE id = $1',
    [userId]
  )
  return result.rows[0]
}

export async function updateUserProfile(userId: string, updates: any) {
  const { full_name, phone_number, profile_image_url } = updates

  const result = await query(
    `UPDATE users
     SET full_name = COALESCE($2, full_name),
         phone_number = COALESCE($3, phone_number),
         profile_image_url = COALESCE($4, profile_image_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id, email, full_name, phone_number, user_type, app_role, profile_image_url`,
    [userId, full_name, phone_number, profile_image_url]
  )

  return result.rows[0]
}

export async function upgradeUserToPremium(userId: string, approvedBy: string) {
  const result = await query(
    `UPDATE users
     SET user_type = 'premium',
         approved_at = CURRENT_TIMESTAMP,
         approved_by = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [userId, approvedBy]
  )

  return result.rows[0]
}
```

**Validation:**
- Unit tests for each service function
- Test database transactions work correctly
- Test error handling

---

## Phase 3: Error Handling & Logging

**Scope:** Consistent error handling, logging utilities

### 3.1 Error Types

**File:** `types/errors.ts`

```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}
```

### 3.2 Error Handler Utility

**File:** `lib/utils/error-handler.ts`

```typescript
import { NextResponse } from 'next/server'
import { AppError } from '@/types/errors'
import { ZodError } from 'zod'

export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors
      },
      { status: 400 }
    )
  }

  // Custom app errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code
      },
      { status: error.statusCode }
    )
  }

  // Database errors
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as any

    // Unique constraint violation
    if (dbError.code === '23505') {
      return NextResponse.json(
        { error: 'Resource already exists', code: 'DUPLICATE' },
        { status: 409 }
      )
    }

    // Foreign key violation
    if (dbError.code === '23503') {
      return NextResponse.json(
        { error: 'Referenced resource not found', code: 'INVALID_REFERENCE' },
        { status: 400 }
      )
    }
  }

  // Generic error
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    },
    { status: 500 }
  )
}
```

### 3.3 Logger Utility

**File:** `lib/utils/logger.ts`

```typescript
type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
  userId?: string
  requestId?: string
  [key: string]: any
}

class Logger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      level,
      message,
      ...context
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(logData, null, 2))
    } else {
      console.log(JSON.stringify(logData))
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    })
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, context)
    }
  }
}

export const logger = new Logger()
```

**Validation:**
- Test all error types
- Verify error responses are consistent
- Test logging in development and production modes

---

## Phase 4: Testing Infrastructure

**Scope:** Jest setup, test utilities, E2E test framework

### 4.1 Jest Configuration

**File:** `jest.config.js`

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'types/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

**File:** `jest.setup.js`

```javascript
import '@testing-library/jest-dom'
```

### 4.2 Install Test Dependencies

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event @types/jest
npm install -D supertest @types/supertest
```

### 4.3 Test Utilities

**File:** `tests/utils/test-helpers.ts`

```typescript
import { pool } from '@/lib/db'
import { signToken } from '@/lib/auth/jwt'

export async function createTestUser(overrides = {}) {
  const defaultUser = {
    email: `test-${Date.now()}@example.com`,
    full_name: 'Test User',
    user_type: 'premium',
    app_role: 'user',
    ...overrides
  }

  const result = await pool.query(
    `INSERT INTO users (email, full_name, user_type, app_role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [defaultUser.email, defaultUser.full_name, defaultUser.user_type, defaultUser.app_role]
  )

  return result.rows[0]
}

export function generateAuthToken(user: any) {
  return signToken({
    userId: user.id,
    email: user.email,
    role: user.app_role,
    userType: user.user_type
  })
}

export async function cleanupTestData(prefix: string) {
  await pool.query('DELETE FROM bookings WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', [`${prefix}%`])
  await pool.query('DELETE FROM user_packages WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', [`${prefix}%`])
  await pool.query('DELETE FROM user_auth WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', [`${prefix}%`])
  await pool.query('DELETE FROM users WHERE email LIKE $1', [`${prefix}%`])
}
```

### 4.4 E2E Test Example

**File:** `tests/e2e/auth.test.ts`

```typescript
import { NextRequest } from 'next/server'
import { POST as signupHandler } from '@/app/api/auth/signup/route'
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { createTestUser, cleanupTestData } from '../utils/test-helpers'

describe('Authentication E2E', () => {
  const testPrefix = 'auth-e2e'

  afterAll(async () => {
    await cleanupTestData(testPrefix)
  })

  describe('Signup', () => {
    it('should create a new user', async () => {
      const email = `${testPrefix}-${Date.now()}@example.com`

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password: 'Test123!',
          full_name: 'Test User',
          phone_number: '+1234567890'
        })
      })

      const response = await signupHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.user.email).toBe(email)
      expect(data.token).toBeDefined()
    })

    it('should reject duplicate email', async () => {
      const user = await createTestUser({ email: `${testPrefix}-duplicate@example.com` })

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: user.email,
          password: 'Test123!',
          full_name: 'Test User'
        })
      })

      const response = await signupHandler(request)
      expect(response.status).toBe(409)
    })
  })

  describe('Login', () => {
    it('should login with valid credentials', async () => {
      // Test with seeded user
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@redclay.com',
          password: 'Test123!'
        })
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.token).toBeDefined()
    })

    it('should reject invalid password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@redclay.com',
          password: 'WrongPassword'
        })
      })

      const response = await loginHandler(request)
      expect(response.status).toBe(401)
    })
  })
})
```

Add test scripts to `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Validation:**
- Run `npm test` - all tests should pass
- Check test coverage
- Verify E2E tests work with real database

---

## Testing Strategy

### Unit Tests
- All service functions
- All utility functions
- Error handling
- JWT token generation/validation

### Integration Tests
- API routes with database
- Authentication flow
- Booking creation flow
- Package purchase flow

### Test Coverage Targets

| Area | Target |
|------|--------|
| Services | 90% |
| Utilities | 85% |
| API Routes | 80% |
| Auth System | 95% |

---

## Success Criteria

### Functionality
- [ ] Database connection established to Neon
- [ ] All 14 tables created successfully
- [ ] Seed script creates test data
- [ ] User can signup and login
- [ ] JWT tokens generated correctly
- [ ] Auth middleware protects routes
- [ ] All services implement business logic
- [ ] Error handling is consistent
- [ ] Logging works in dev and prod

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] No code duplication
- [ ] Consistent error handling patterns
- [ ] Proper separation of concerns (services, utils, routes)
- [ ] All functions have proper types

### Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Test coverage meets targets
- [ ] E2E tests for critical flows work

### Documentation
- [ ] All environment variables documented
- [ ] Database schema matches implementation
- [ ] API endpoints documented
- [ ] Service functions have comments
- [ ] Updated checklists

