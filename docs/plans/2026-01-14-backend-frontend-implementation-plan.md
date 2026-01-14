# Backend & Frontend Implementation Plan
## Red Clay Tennis Booking Platform

**Created:** January 14, 2026
**Status:** Ready for Implementation
**Timeline:** 9 weeks (3 phases)

---

## Current State Analysis

### What Exists
- ✅ Complete database schema design (14 tables)
- ✅ Comprehensive documentation (30+ files)
- ✅ Architecture decisions (Neon + Vercel stack)
- ✅ Feature specifications (11 features across 3 phases)
- ✅ API endpoint specifications
- ✅ Automation rules and business logic documentation

### What's Missing
- ❌ No actual code written
- ❌ No project scaffolding
- ❌ No package.json or dependencies
- ❌ No database migrations run
- ❌ No API routes implemented
- ❌ No frontend components created
- ❌ No authentication system implemented

---

## Technology Stack Selection

### Backend Framework Options

**Option 1: Next.js 14+ (App Router) - RECOMMENDED**
```
Pros:
- Unified frontend + backend codebase
- API routes built-in (Vercel serverless functions)
- TypeScript native support
- Edge runtime support
- Built-in middleware for auth
- Best Vercel integration
- Server components for optimal performance

Cons:
- Couples frontend and backend
- Learning curve for App Router

Use when: Single codebase preferred, team comfortable with React
```

**Option 2: Standalone Backend (Express.js/Fastify) + Separate Frontend**
```
Pros:
- Clear separation of concerns
- Independent deployment
- Framework flexibility
- API-first design

Cons:
- More complex deployment
- Separate repos or monorepo needed
- More configuration overhead

Use when: Need true microservices or separate teams
```

**Recommendation: Use Next.js 14+ App Router**
- Aligns with Vercel deployment strategy
- Simplifies development workflow
- Single codebase = easier maintenance
- Mobile-first React frontend built-in

---

## Phase 1: Project Setup & Foundation (Week 1)

### 1.1 Initialize Next.js Project

```bash
# Create Next.js project with TypeScript
npx create-next-app@latest red-clay-tennis \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd red-clay-tennis
```

### 1.2 Install Core Dependencies

```bash
# Database & Authentication
npm install pg @types/pg
npm install bcrypt @types/bcrypt
npm install jsonwebtoken @types/jsonwebtoken
npm install jose  # For edge-compatible JWT

# Validation
npm install zod

# Date handling
npm install date-fns

# Email
npm install @sendgrid/mail

# Environment variables
npm install dotenv

# Development tools
npm install -D @types/node
npm install -D tsx  # TypeScript execution
npm install -D nodemon

# Testing
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event
npm install -D @types/jest
```

### 1.3 Project Structure

```
red-clay-tennis/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   │   ├── auth/
│   │   │   │   ├── signup/route.ts
│   │   │   │   ├── login/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   ├── bookings/
│   │   │   │   ├── route.ts      # GET (list), POST (create)
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts  # GET, PATCH, DELETE
│   │   │   ├── courts/
│   │   │   │   └── route.ts
│   │   │   ├── packages/
│   │   │   │   └── route.ts
│   │   │   ├── admin/
│   │   │   │   ├── bookings/
│   │   │   │   ├── users/
│   │   │   │   └── packages/
│   │   │   └── waitlist/
│   │   │       └── route.ts
│   │   ├── (auth)/               # Auth pages group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/          # Protected routes group
│   │   │   ├── layout.tsx        # Auth check wrapper
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── bookings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── packages/
│   │   │       └── page.tsx
│   │   ├── (admin)/              # Admin routes group
│   │   │   ├── layout.tsx        # Admin check wrapper
│   │   │   └── admin/
│   │   │       ├── page.tsx
│   │   │       ├── bookings/
│   │   │       ├── users/
│   │   │       └── packages/
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Landing page
│   │
│   ├── components/               # React components
│   │   ├── auth/
│   │   │   ├── SignupForm.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── AuthProvider.tsx
│   │   ├── bookings/
│   │   │   ├── BookingCard.tsx
│   │   │   ├── BookingForm.tsx
│   │   │   ├── CourtSelector.tsx
│   │   │   └── TimeSlotPicker.tsx
│   │   ├── admin/
│   │   │   ├── BookingApprovalQueue.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   └── PackageManagement.tsx
│   │   ├── ui/                   # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Badge.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── Sidebar.tsx
│   │
│   ├── lib/                      # Utilities & shared logic
│   │   ├── db/
│   │   │   ├── index.ts          # DB connection pool
│   │   │   ├── queries.ts        # Reusable queries
│   │   │   └── migrations.ts     # Migration runner
│   │   ├── auth/
│   │   │   ├── jwt.ts            # JWT utilities
│   │   │   ├── password.ts       # Password hashing
│   │   │   ├── middleware.ts     # Auth middleware
│   │   │   └── permissions.ts    # Permission checks
│   │   ├── validation/
│   │   │   ├── schemas.ts        # Zod schemas
│   │   │   └── validators.ts     # Custom validators
│   │   ├── services/
│   │   │   ├── booking.service.ts
│   │   │   ├── package.service.ts
│   │   │   ├── user.service.ts
│   │   │   └── notification.service.ts
│   │   ├── utils/
│   │   │   ├── date.ts           # Date utilities
│   │   │   ├── pricing.ts        # Pricing calculations
│   │   │   └── format.ts         # Formatting helpers
│   │   └── constants.ts          # App constants
│   │
│   ├── types/                    # TypeScript types
│   │   ├── database.ts           # DB types
│   │   ├── api.ts                # API request/response types
│   │   └── models.ts             # Domain models
│   │
│   └── middleware.ts             # Next.js middleware (auth checks)
│
├── scripts/                      # Utility scripts
│   ├── setup-db.ts              # Initialize database
│   ├── seed-dev-data.ts         # Seed development data
│   ├── test-db.ts               # Test DB connection
│   └── migrate.ts               # Run migrations
│
├── tests/                        # Test files
│   ├── unit/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validation/
│   ├── integration/
│   │   └── api/
│   └── e2e/
│       └── flows/
│
├── docs/                         # Existing documentation
├── .env.local                    # Local environment variables
├── .env.example                  # Example env file
├── .gitignore
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

### 1.4 Environment Configuration

Create `.env.example`:
```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Authentication
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRATION=7d
BCRYPT_ROUNDS=12

# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Email
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=SG.xxxxxxxxxxxxx
EMAIL_FROM=noreply@redclay.com
EMAIL_FROM_NAME=Red Clay Tennis

# SMS (optional)
SMS_PROVIDER=twilio
SMS_API_KEY=xxxxx
SMS_FROM=+1234567890

# Feature Flags
ENABLE_AI_RECOMMENDATIONS=false
ENABLE_TELEGRAM_BOT=false

# Environment
NODE_ENV=development
```

### 1.5 Database Setup Script

Create `scripts/setup-db.ts`:
```typescript
import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to database...')

    // Test connection
    const result = await pool.query('SELECT NOW()')
    console.log('✅ Connected to database')
    console.log(`   Server time: ${result.rows[0].now}`)

    // Read migration file
    const migrationPath = path.join(__dirname, '../docs/database/migrations.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('🔄 Running migrations...')
    await pool.query(migrationSQL)
    console.log('✅ Migrations completed')

    // Verify tables
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    console.log(`✅ Tables created: ${tables.rows.length}`)
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`)
    })

  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

setupDatabase()
```

### 1.6 Database Connection Pool

Create `src/lib/db/index.ts`:
```typescript
import { Pool, PoolClient } from 'pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Create connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
  max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err)
  process.exit(-1)
})

// Query helper with logging
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start

    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: result.rowCount })
    }

    return result
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export default pool
```

---

## Phase 2: Backend Implementation (Weeks 1-6)

### Week 1-2: Authentication System

#### 1. Password Hashing Utilities

`src/lib/auth/password.ts`:
```typescript
import bcrypt from 'bcrypt'

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12')

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

#### 2. JWT Utilities

`src/lib/auth/jwt.ts`:
```typescript
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d'

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters')
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
  userType: string
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  })
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export function extractTokenFromHeader(
  authHeader: string | null
): string | null {
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}
```

#### 3. Auth Middleware

`src/lib/auth/middleware.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from './jwt'

export async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized - No token provided' },
      { status: 401 }
    )
  }

  try {
    const user = verifyToken(token)
    return user
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid token' },
      { status: 401 }
    )
  }
}

export function requireAdmin(user: any) {
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    )
  }
  return null
}
```

#### 4. Signup API Route

`src/app/api/auth/signup/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'
import { signToken } from '@/lib/auth/jwt'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  phone_number: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    // Hash password
    const passwordHash = await hashPassword(validatedData.password)

    // Start transaction
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Insert user
      const userResult = await client.query(
        `INSERT INTO users (email, full_name, phone_number)
         VALUES ($1, $2, $3)
         RETURNING id, email, full_name, user_type, app_role, created_at`,
        [validatedData.email, validatedData.full_name, validatedData.phone_number]
      )

      const user = userResult.rows[0]

      // Store password hash (assuming separate auth table)
      await client.query(
        'INSERT INTO user_auth (user_id, password_hash) VALUES ($1, $2)',
        [user.id, passwordHash]
      )

      await client.query('COMMIT')

      // Generate JWT token
      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.app_role,
        userType: user.user_type,
      })

      // TODO: Send welcome email

      return NextResponse.json(
        {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            user_type: user.user_type,
            app_role: user.app_role,
          },
          token,
        },
        { status: 201 }
      )

    } catch (error: any) {
      await client.query('ROLLBACK')

      // Handle duplicate email
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        )
      }
      throw error

    } finally {
      client.release()
    }

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### 5. Login API Route

`src/app/api/auth/login/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { comparePassword } from '@/lib/auth/password'
import { signToken } from '@/lib/auth/jwt'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Get user
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.user_type, u.app_role, u.is_active,
              ua.password_hash
       FROM users u
       JOIN user_auth ua ON u.id = ua.user_id
       WHERE u.email = $1`,
      [email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = userResult.rows[0]

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 403 }
      )
    }

    // Verify password
    const isValid = await comparePassword(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.app_role,
      userType: user.user_type,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
        app_role: user.app_role,
      },
      token,
    })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Week 2-3: Booking System APIs

#### 1. Booking Service

`src/lib/services/booking.service.ts`:
```typescript
import { PoolClient } from 'pg'
import { query, transaction } from '@/lib/db'

export interface CreateBookingInput {
  userId: string
  courtId: string
  trainerId?: string
  bookingDate: string
  startTime: string
  endTime: string
  notes?: string
}

export async function createBooking(input: CreateBookingInput) {
  return transaction(async (client: PoolClient) => {
    // Check court availability
    const conflicts = await client.query(
      `SELECT id FROM bookings
       WHERE court_id = $1 AND booking_date = $2 AND start_time = $3
         AND status IN ('confirmed', 'pending')`,
      [input.courtId, input.bookingDate, input.startTime]
    )

    if (conflicts.rows.length > 0) {
      throw new Error('Court already booked at this time')
    }

    // Get user info to determine status
    const userResult = await client.query(
      'SELECT user_type, app_role FROM users WHERE id = $1',
      [input.userId]
    )
    const user = userResult.rows[0]

    // Determine booking status
    const status = user.user_type === 'premium' || user.app_role === 'admin'
      ? 'confirmed'
      : 'pending'

    // Get court pricing
    const courtResult = await client.query(
      'SELECT hourly_rate, peak_hour_rate FROM courts WHERE id = $1',
      [input.courtId]
    )
    const court = courtResult.rows[0]

    // Check if peak time
    const isPeakResult = await client.query(
      'SELECT is_peak_time($1, $2) as is_peak',
      [input.bookingDate, input.startTime]
    )
    const isPeak = isPeakResult.rows[0].is_peak

    let courtFee = isPeak && court.peak_hour_rate
      ? court.peak_hour_rate
      : court.hourly_rate

    let trainerFee = 0
    if (input.trainerId) {
      const trainerResult = await client.query(
        'SELECT hourly_rate FROM trainers WHERE id = $1',
        [input.trainerId]
      )
      trainerFee = trainerResult.rows[0].hourly_rate
    }

    // Create booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (
        user_id, court_id, trainer_id,
        booking_date, start_time, end_time,
        status, court_fee, trainer_fee, is_peak_time, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        input.userId,
        input.courtId,
        input.trainerId,
        input.bookingDate,
        input.startTime,
        input.endTime,
        status,
        courtFee,
        trainerFee,
        isPeak,
        input.notes,
      ]
    )

    const booking = bookingResult.rows[0]

    // Try to apply package (Phase 2 feature)
    // TODO: Implement package application logic

    return booking
  })
}

export async function getBookingsByUser(userId: string) {
  const result = await query(
    `SELECT b.*, c.name as court_name, c.sport_type,
            t.name as trainer_name
     FROM bookings b
     JOIN courts c ON b.court_id = c.id
     LEFT JOIN trainers t ON b.trainer_id = t.id
     WHERE b.user_id = $1
     ORDER BY b.booking_date DESC, b.start_time DESC`,
    [userId]
  )
  return result.rows
}

export async function getBookingById(bookingId: string, userId: string) {
  const result = await query(
    `SELECT b.*, c.name as court_name, c.sport_type,
            t.name as trainer_name
     FROM bookings b
     JOIN courts c ON b.court_id = c.id
     LEFT JOIN trainers t ON b.trainer_id = t.id
     WHERE b.id = $1 AND b.user_id = $2`,
    [bookingId, userId]
  )
  return result.rows[0]
}

export async function cancelBooking(bookingId: string, userId: string) {
  return transaction(async (client: PoolClient) => {
    // Get booking
    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, userId]
    )

    if (bookingResult.rows.length === 0) {
      throw new Error('Booking not found')
    }

    const booking = bookingResult.rows[0]

    if (booking.status === 'cancelled') {
      throw new Error('Booking already cancelled')
    }

    // Update booking
    await client.query(
      `UPDATE bookings
       SET status = 'cancelled',
           cancelled_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [bookingId]
    )

    // Refund package session if applicable
    if (booking.package_id) {
      const sessionType = booking.package_session_type
      const column = sessionType === 'court_only'
        ? 'remaining_court_only_sessions'
        : 'remaining_trainer_sessions'

      await client.query(
        `UPDATE user_packages
         SET ${column} = ${column} + 1
         WHERE id = $1`,
        [booking.package_id]
      )
    }

    return true
  })
}
```

#### 2. Bookings API Route

`src/app/api/bookings/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { createBooking, getBookingsByUser } from '@/lib/services/booking.service'
import { z } from 'zod'

const createBookingSchema = z.object({
  court_id: z.string().uuid(),
  trainer_id: z.string().uuid().optional(),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  notes: z.string().optional(),
})

// GET /api/bookings - List user's bookings
export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  try {
    const bookings = await getBookingsByUser(user.userId)
    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Get bookings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  try {
    const body = await request.json()
    const validatedData = createBookingSchema.parse(body)

    const booking = await createBooking({
      userId: user.userId,
      courtId: validatedData.court_id,
      trainerId: validatedData.trainer_id,
      bookingDate: validatedData.booking_date,
      startTime: validatedData.start_time,
      endTime: validatedData.end_time,
      notes: validatedData.notes,
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.message === 'Court already booked at this time') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    console.error('Create booking error:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
```

### Week 3-4: Admin Dashboard APIs

Continue with admin routes, package system, and other features...

---

## Phase 3: Frontend Implementation (Weeks 1-6)

### Frontend Architecture

#### Component Structure
```
components/
├── ui/              # Reusable primitives
├── auth/            # Auth-related components
├── bookings/        # Booking features
├── admin/           # Admin features
└── layout/          # Layout components
```

#### State Management Options

**Option 1: React Context + Hooks (Recommended for MVP)**
- Built-in, no extra dependencies
- Good for simple global state
- Easy to understand

**Option 2: Zustand**
- Minimal boilerplate
- Good TypeScript support
- Better for complex state

**Option 3: Redux Toolkit**
- Industry standard
- Most powerful
- Overkill for this project

**Recommendation: Start with Context, migrate to Zustand if needed**

### Week 1-2: Auth UI & Layout

#### 1. Signup Form Component

`src/components/auth/SignupForm.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SignupForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Signup failed')
      }

      const { user, token } = await response.json()

      // Store token
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium mb-1">
          Full Name
        </label>
        <input
          id="full_name"
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          minLength={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="phone_number" className="block text-sm font-medium mb-1">
          Phone Number (optional)
        </label>
        <input
          id="phone_number"
          type="tel"
          value={formData.phone_number}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  )
}
```

### Week 2-3: Booking UI

Continue with booking components, court selection, time pickers...

### Week 4-5: Admin Dashboard UI

Build admin interfaces for approvals, user management...

### Week 6: Testing & Polish

---

## Deployment Plan

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Environment Variables in Vercel

Add all `.env.local` variables in Vercel project settings.

---

## Testing Strategy

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

---

## Next Immediate Steps

1. ✅ Initialize Next.js project
2. ✅ Install dependencies
3. ✅ Set up database connection
4. ✅ Run migrations
5. ✅ Create environment configuration
6. ✅ Implement authentication APIs
7. ✅ Build signup/login UI
8. ✅ Test authentication flow
9. Continue with booking system...

---

## Success Criteria

### Phase 1 Complete When:
- [ ] User can sign up and log in
- [ ] User can view available courts
- [ ] User can create bookings
- [ ] Admin can approve bookings
- [ ] All tests passing
- [ ] Mobile-responsive UI working

---

**Total Estimated Timeline:** 9 weeks
**Team Size:** 2-3 developers
**Risk Level:** Low (well-documented requirements)

<promise>PHASES READY</promise>
