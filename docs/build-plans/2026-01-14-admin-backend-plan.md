# Admin Backend Implementation Plan
## Red Clay Tennis Platform - Phase 2

> **For Claude:** Execute phases sequentially. For each phase:
> 1. Check git log to understand current state
> 2. Create/update detailed plan if needed (no commit instructions in plans)
> 3. Execute the phase implementation
> 4. Validate with `npm run build` and `npm test`
> 5. Implement test coverage
> 6. Run all tests: `npm test`
> 7. Code quality review - check for duplication, ensure patterns
> 8. Review docs - update if needed
> 9. Commit the completed phase after validation passes
> 10. Proceed to next phase

**Goal:** Build complete admin backend APIs for managing bookings, users, packages, and waitlist

**Current State:** Infrastructure (Phase 1) complete, ready for admin features

**Prerequisites:** Infrastructure plan must be complete (database, auth, services)

---

## On Each Iteration

1. **Check git log** - run `git log --oneline | grep "feat(admin-be): phase"` to see completed phases
2. **Determine current phase** - first phase (0, 1, 2, 3, 4, 5) not yet in commit history
3. **Check git status** - if uncommitted work exists for current phase, continue it
4. **If phase code is done but tests aren't** - implement tests first
5. **If phase + tests pass** - commit with `feat(admin-be): phase X - [description]`
6. **When all 6 phases are committed** - proceed to Final Verification

## Final Verification

After all phases are committed, verify success criteria before completing:

1. **Run full validation:**
   ```bash
   npm run typecheck && npm run build && npm test
   ```

2. **Code quality audit:**
   - No code duplication across admin endpoints
   - Consistent permission checks (requireAdmin)
   - Proper error handling in all routes
   - Consistent response formats

3. **Check Success Criteria** - review each item in the Success Criteria section below

4. **If any criteria not met:**
   - Identify what's missing
   - Create a fix (no new phase needed, just patch)
   - Commit as `fix(admin-be): [description]`
   - Re-run verification

5. **When ALL success criteria are met** - output: `<promise>ADMIN BACKEND COMPLETE</promise>`

---

## Commit Strategy

- **Do NOT commit during plan creation or execution**
- **Do NOT include commit instructions in phase sub-plans**
- **Commit checkpoint:** After each phase AND its test coverage are complete and passing:
  1. Run `npm run typecheck && npm run build && npm test`
  2. If all pass, create a single commit for the phase
  3. Commit message format: `feat(admin-be): phase X - [brief description]`
- **Never commit partial work** - each commit should be a complete, working phase

---

## Phase Overview

| Phase | Focus | Dependencies |
|-------|-------|--------------|
| 0 | Admin Booking Management | Infrastructure |
| 1 | User Management | Phase 0 |
| 2 | Package Management | Phase 1 |
| 3 | Waitlist Management | Phase 2 |
| 4 | Dashboard & Analytics | Phase 3 |
| 5 | Notification System | Phase 4 |

---

## Phase 0: Admin Booking Management

**Scope:** Admin APIs for viewing, approving, and managing all bookings

### 0.1 Admin Booking List

**File:** `app/api/admin/bookings/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { query } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'
import { z } from 'zod'

const bookingListQuerySchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  court_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.string().default('1'),
  limit: z.string().default('20'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const { searchParams } = new URL(request.url)
    const params = bookingListQuerySchema.parse({
      status: searchParams.get('status') || undefined,
      court_id: searchParams.get('court_id') || undefined,
      user_id: searchParams.get('user_id') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    })

    const page = parseInt(params.page)
    const limit = parseInt(params.limit)
    const offset = (page - 1) * limit

    // Build dynamic query
    let whereConditions: string[] = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (params.status) {
      whereConditions.push(`b.status = $${paramIndex}`)
      queryParams.push(params.status)
      paramIndex++
    }

    if (params.court_id) {
      whereConditions.push(`b.court_id = $${paramIndex}`)
      queryParams.push(params.court_id)
      paramIndex++
    }

    if (params.user_id) {
      whereConditions.push(`b.user_id = $${paramIndex}`)
      queryParams.push(params.user_id)
      paramIndex++
    }

    if (params.date_from) {
      whereConditions.push(`b.booking_date >= $${paramIndex}`)
      queryParams.push(params.date_from)
      paramIndex++
    }

    if (params.date_to) {
      whereConditions.push(`b.booking_date <= $${paramIndex}`)
      queryParams.push(params.date_to)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : ''

    const sql = `
      SELECT
        b.*,
        c.name as court_name,
        c.sport_type,
        u.full_name as user_name,
        u.email as user_email,
        u.phone_number as user_phone,
        u.user_type,
        t.name as trainer_name
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON b.user_id = u.id
      LEFT JOIN trainers t ON b.trainer_id = t.id
      ${whereClause}
      ORDER BY b.booking_date DESC, b.start_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(limit, offset)

    const result = await query(sql, queryParams)

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM bookings b
      ${whereClause}
    `
    const countResult = await query(countSql, queryParams.slice(0, -2))
    const total = parseInt(countResult.rows[0].total)

    return NextResponse.json({
      bookings: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### 0.2 Approve/Reject Booking

**File:** `app/api/admin/bookings/[id]/status/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { transaction } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'
import { NotFoundError } from '@/types/errors'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum(['confirmed', 'cancelled']),
  notes: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const body = await request.json()
    const { status, notes } = updateStatusSchema.parse(body)

    const result = await transaction(async (client) => {
      // Get booking
      const bookingResult = await client.query(
        'SELECT * FROM bookings WHERE id = $1',
        [params.id]
      )

      if (bookingResult.rows.length === 0) {
        throw new NotFoundError('Booking')
      }

      const booking = bookingResult.rows[0]

      // Update status
      const updateResult = await client.query(
        `UPDATE bookings
         SET status = $1,
             admin_notes = COALESCE($2, admin_notes),
             ${status === 'confirmed' ? 'confirmed_at = CURRENT_TIMESTAMP,' : ''}
             ${status === 'cancelled' ? 'cancelled_at = CURRENT_TIMESTAMP,' : ''}
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [status, notes, params.id]
      )

      // TODO: Send notification to user

      return updateResult.rows[0]
    })

    return NextResponse.json({ booking: result })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### 0.3 Booking Statistics

**File:** `app/api/admin/bookings/stats/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { query } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    // Get stats for last 30 days
    const statsResult = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        SUM(court_fee + trainer_fee) FILTER (WHERE status IN ('confirmed', 'completed')) as total_revenue,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT court_id) as courts_used
      FROM bookings
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `)

    const todayResult = await query(`
      SELECT
        COUNT(*) as today_bookings,
        COUNT(*) FILTER (WHERE status = 'pending') as today_pending
      FROM bookings
      WHERE booking_date = CURRENT_DATE
    `)

    const upcomingResult = await query(`
      SELECT COUNT(*) as upcoming_count
      FROM bookings
      WHERE booking_date > CURRENT_DATE
        AND status IN ('confirmed', 'pending')
    `)

    return NextResponse.json({
      last_30_days: statsResult.rows[0],
      today: todayResult.rows[0],
      upcoming: upcomingResult.rows[0]
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Validation:**
- Test admin can list all bookings
- Test filtering and pagination work
- Test approve/reject booking
- Test statistics endpoint
- Verify non-admin users cannot access

---

## Phase 1: User Management

**Scope:** Admin APIs for managing user accounts, roles, and approvals

### 1.1 User List

**File:** `app/api/admin/users/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { query } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'
import { z } from 'zod'

const userListQuerySchema = z.object({
  user_type: z.enum(['new', 'premium']).optional(),
  app_role: z.enum(['user', 'trainer', 'admin']).optional(),
  is_active: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.string().default('1'),
  limit: z.string().default('20'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const { searchParams } = new URL(request.url)
    const params = userListQuerySchema.parse({
      user_type: searchParams.get('user_type') || undefined,
      app_role: searchParams.get('app_role') || undefined,
      is_active: searchParams.get('is_active') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    })

    const page = parseInt(params.page)
    const limit = parseInt(params.limit)
    const offset = (page - 1) * limit

    let whereConditions: string[] = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (params.user_type) {
      whereConditions.push(`user_type = $${paramIndex}`)
      queryParams.push(params.user_type)
      paramIndex++
    }

    if (params.app_role) {
      whereConditions.push(`app_role = $${paramIndex}`)
      queryParams.push(params.app_role)
      paramIndex++
    }

    if (params.is_active) {
      whereConditions.push(`is_active = $${paramIndex}`)
      queryParams.push(params.is_active === 'true')
      paramIndex++
    }

    if (params.search) {
      whereConditions.push(`(
        full_name ILIKE $${paramIndex} OR
        email ILIKE $${paramIndex} OR
        phone_number ILIKE $${paramIndex}
      )`)
      queryParams.push(`%${params.search}%`)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : ''

    const sql = `
      SELECT
        id, email, full_name, phone_number,
        user_type, app_role, is_active,
        profile_image_url, approved_at,
        created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(limit, offset)

    const result = await query(sql, queryParams)

    const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`
    const countResult = await query(countSql, queryParams.slice(0, -2))
    const total = parseInt(countResult.rows[0].total)

    return NextResponse.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### 1.2 Update User Role/Type

**File:** `app/api/admin/users/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { query } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'
import { NotFoundError } from '@/types/errors'
import { z } from 'zod'

const updateUserSchema = z.object({
  user_type: z.enum(['new', 'premium']).optional(),
  app_role: z.enum(['user', 'trainer', 'admin']).optional(),
  is_active: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const body = await request.json()
    const updates = updateUserSchema.parse(body)

    const result = await query(
      `UPDATE users
       SET user_type = COALESCE($1, user_type),
           app_role = COALESCE($2, app_role),
           is_active = COALESCE($3, is_active),
           approved_at = CASE
             WHEN $1 = 'premium' AND approved_at IS NULL THEN CURRENT_TIMESTAMP
             ELSE approved_at
           END,
           approved_by = CASE
             WHEN $1 = 'premium' AND approved_at IS NULL THEN $4
             ELSE approved_by
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, full_name, user_type, app_role, is_active, approved_at`,
      [updates.user_type, updates.app_role, updates.is_active, user.userId, params.id]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError('User')
    }

    return NextResponse.json({ user: result.rows[0] })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const result = await query(
      `SELECT
        u.id, u.email, u.full_name, u.phone_number,
        u.user_type, u.app_role, u.is_active,
        u.profile_image_url, u.preferences,
        u.approved_at, u.created_at, u.updated_at,
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'completed') as completed_bookings,
        COUNT(DISTINCT up.id) as active_packages
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      LEFT JOIN user_packages up ON u.id = up.user_id AND up.expires_at > NOW()
      WHERE u.id = $1
      GROUP BY u.id`,
      [params.id]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError('User')
    }

    return NextResponse.json({ user: result.rows[0] })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### 1.3 User Activity Log

**File:** `app/api/admin/users/[id]/activity/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { query } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    // Get user's bookings
    const bookingsResult = await query(
      `SELECT
        b.id, b.booking_date, b.start_time, b.end_time,
        b.status, b.court_fee, b.trainer_fee,
        b.created_at,
        c.name as court_name,
        t.name as trainer_name
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      LEFT JOIN trainers t ON b.trainer_id = t.id
      WHERE b.user_id = $1
      ORDER BY b.booking_date DESC, b.start_time DESC
      LIMIT 50`,
      [params.id]
    )

    // Get user's packages
    const packagesResult = await query(
      `SELECT
        up.id, up.purchased_at, up.expires_at,
        up.remaining_court_only_sessions,
        up.remaining_trainer_sessions,
        p.name as package_name,
        p.price
      FROM user_packages up
      JOIN packages p ON up.package_id = p.id
      WHERE up.user_id = $1
      ORDER BY up.purchased_at DESC`,
      [params.id]
    )

    return NextResponse.json({
      bookings: bookingsResult.rows,
      packages: packagesResult.rows
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Validation:**
- Test admin can list and filter users
- Test admin can upgrade user to premium
- Test admin can change user roles
- Test admin can view user details and activity
- Verify permission checks work

---

## Phase 2: Package Management

**Scope:** Admin APIs for creating and managing booking packages

### 2.1 Package CRUD

**File:** `app/api/admin/packages/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { query } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'
import { z } from 'zod'

const createPackageSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  court_only_sessions: z.number().min(0),
  trainer_sessions: z.number().min(0),
  price: z.number().min(0),
  validity_days: z.number().min(1),
  is_active: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('include_inactive') === 'true'

    const sql = includeInactive
      ? 'SELECT * FROM packages ORDER BY price'
      : 'SELECT * FROM packages WHERE is_active = true ORDER BY price'

    const result = await query(sql)

    // Get purchase stats for each package
    const statsResult = await query(`
      SELECT
        package_id,
        COUNT(*) as purchase_count,
        SUM(CASE WHEN expires_at > NOW() THEN 1 ELSE 0 END) as active_count
      FROM user_packages
      GROUP BY package_id
    `)

    const stats = Object.fromEntries(
      statsResult.rows.map(row => [row.package_id, row])
    )

    const packages = result.rows.map(pkg => ({
      ...pkg,
      purchase_count: stats[pkg.id]?.purchase_count || 0,
      active_count: stats[pkg.id]?.active_count || 0,
    }))

    return NextResponse.json({ packages })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const body = await request.json()
    const packageData = createPackageSchema.parse(body)

    const result = await query(
      `INSERT INTO packages (
        name, description, court_only_sessions, trainer_sessions,
        price, validity_days, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        packageData.name,
        packageData.description,
        packageData.court_only_sessions,
        packageData.trainer_sessions,
        packageData.price,
        packageData.validity_days,
        packageData.is_active,
      ]
    )

    return NextResponse.json({ package: result.rows[0] }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**File:** `app/api/admin/packages/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { query } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'
import { NotFoundError } from '@/types/errors'
import { z } from 'zod'

const updatePackageSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  court_only_sessions: z.number().min(0).optional(),
  trainer_sessions: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
  validity_days: z.number().min(1).optional(),
  is_active: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const body = await request.json()
    const updates = updatePackageSchema.parse(body)

    const result = await query(
      `UPDATE packages
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           court_only_sessions = COALESCE($3, court_only_sessions),
           trainer_sessions = COALESCE($4, trainer_sessions),
           price = COALESCE($5, price),
           validity_days = COALESCE($6, validity_days),
           is_active = COALESCE($7, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        updates.name,
        updates.description,
        updates.court_only_sessions,
        updates.trainer_sessions,
        updates.price,
        updates.validity_days,
        updates.is_active,
        params.id,
      ]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError('Package')
    }

    return NextResponse.json({ package: result.rows[0] })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    // Soft delete - just mark as inactive
    const result = await query(
      'UPDATE packages SET is_active = false WHERE id = $1 RETURNING *',
      [params.id]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError('Package')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Validation:**
- Test admin can create packages
- Test admin can update package details
- Test admin can deactivate packages
- Test package stats are calculated correctly

---

## Phase 3: Waitlist Management

**Scope:** Admin APIs for managing waitlist entries

### 3.1 Waitlist List

**File:** `app/api/admin/waitlist/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { query } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'
import { z } from 'zod'

const waitlistQuerySchema = z.object({
  status: z.enum(['pending', 'notified', 'booked', 'expired']).optional(),
  court_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const { searchParams } = new URL(request.url)
    const params = waitlistQuerySchema.parse({
      status: searchParams.get('status') || undefined,
      court_id: searchParams.get('court_id') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
    })

    let whereConditions: string[] = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (params.status) {
      whereConditions.push(`w.status = $${paramIndex}`)
      queryParams.push(params.status)
      paramIndex++
    }

    if (params.court_id) {
      whereConditions.push(`w.court_id = $${paramIndex}`)
      queryParams.push(params.court_id)
      paramIndex++
    }

    if (params.date_from) {
      whereConditions.push(`w.preferred_date >= $${paramIndex}`)
      queryParams.push(params.date_from)
      paramIndex++
    }

    if (params.date_to) {
      whereConditions.push(`w.preferred_date <= $${paramIndex}`)
      queryParams.push(params.date_to)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : ''

    const sql = `
      SELECT
        w.*,
        c.name as court_name,
        u.full_name as user_name,
        u.email as user_email,
        u.phone_number as user_phone
      FROM waitlist w
      JOIN courts c ON w.court_id = c.id
      JOIN users u ON w.user_id = u.id
      ${whereClause}
      ORDER BY w.priority DESC, w.created_at ASC
    `

    const result = await query(sql, queryParams)

    return NextResponse.json({ waitlist: result.rows })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### 3.2 Notify Waitlist User

**File:** `app/api/admin/waitlist/[id]/notify/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { transaction } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'
import { NotFoundError } from '@/types/errors'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const result = await transaction(async (client) => {
      // Update waitlist status
      const updateResult = await client.query(
        `UPDATE waitlist
         SET status = 'notified',
             notified_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [params.id]
      )

      if (updateResult.rows.length === 0) {
        throw new NotFoundError('Waitlist entry')
      }

      const waitlistEntry = updateResult.rows[0]

      // Get user and court details
      const detailsResult = await client.query(
        `SELECT
          u.email, u.full_name, u.phone_number,
          c.name as court_name,
          w.preferred_date, w.preferred_time_start
        FROM waitlist w
        JOIN users u ON w.user_id = u.id
        JOIN courts c ON w.court_id = c.id
        WHERE w.id = $1`,
        [params.id]
      )

      const details = detailsResult.rows[0]

      // TODO: Send notification (email/SMS)
      // await sendWaitlistNotification(details)

      return waitlistEntry
    })

    return NextResponse.json({ success: true, waitlist: result })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Validation:**
- Test admin can view waitlist entries
- Test admin can notify waitlist users
- Test filtering works correctly

---

## Phase 4: Dashboard & Analytics

**Scope:** Admin dashboard data and analytics endpoints

### 4.1 Dashboard Overview

**File:** `app/api/admin/dashboard/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { query } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    // Today's bookings
    const todayResult = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed
      FROM bookings
      WHERE booking_date = CURRENT_DATE
    `)

    // Revenue
    const revenueResult = await query(`
      SELECT
        SUM(court_fee + trainer_fee) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
        SUM(court_fee + trainer_fee) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as last_30_days,
        SUM(court_fee + trainer_fee) as all_time
      FROM bookings
      WHERE status IN ('confirmed', 'completed')
    `)

    // User stats
    const userResult = await query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE user_type = 'new') as new_users,
        COUNT(*) FILTER (WHERE user_type = 'premium') as premium_users,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as users_last_30_days
      FROM users
      WHERE is_active = true
    `)

    // Pending items
    const pendingResult = await query(`
      SELECT
        COUNT(*) FILTER (WHERE booking_date >= CURRENT_DATE) as pending_bookings,
        (SELECT COUNT(*) FROM waitlist WHERE status = 'pending') as waitlist_count
      FROM bookings
      WHERE status = 'pending'
    `)

    return NextResponse.json({
      today: todayResult.rows[0],
      revenue: revenueResult.rows[0],
      users: userResult.rows[0],
      pending: pendingResult.rows[0],
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### 4.2 Revenue Analytics

**File:** `app/api/admin/analytics/revenue/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { query } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'
import { z } from 'zod'

const revenueQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  days: z.string().default('30'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const { searchParams } = new URL(request.url)
    const params = revenueQuerySchema.parse({
      period: searchParams.get('period') || 'daily',
      days: searchParams.get('days') || '30',
    })

    const days = parseInt(params.days)

    let groupBy: string
    switch (params.period) {
      case 'daily':
        groupBy = 'DATE(created_at)'
        break
      case 'weekly':
        groupBy = 'DATE_TRUNC(\'week\', created_at)'
        break
      case 'monthly':
        groupBy = 'DATE_TRUNC(\'month\', created_at)'
        break
    }

    const result = await query(`
      SELECT
        ${groupBy} as period,
        COUNT(*) as booking_count,
        SUM(court_fee) as court_revenue,
        SUM(trainer_fee) as trainer_revenue,
        SUM(court_fee + trainer_fee) as total_revenue
      FROM bookings
      WHERE status IN ('confirmed', 'completed')
        AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY ${groupBy}
      ORDER BY period DESC
    `)

    return NextResponse.json({ data: result.rows })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### 4.3 Court Utilization

**File:** `app/api/admin/analytics/courts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { query } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const result = await query(`
      SELECT
        c.id,
        c.name,
        c.sport_type,
        COUNT(b.id) as total_bookings,
        COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed_bookings,
        SUM(b.court_fee) as total_revenue,
        AVG(b.court_fee) as avg_booking_fee
      FROM courts c
      LEFT JOIN bookings b ON c.id = b.court_id
        AND b.created_at >= CURRENT_DATE - INTERVAL '${days} days'
      WHERE c.is_active = true
      GROUP BY c.id, c.name, c.sport_type
      ORDER BY total_bookings DESC
    `)

    return NextResponse.json({ courts: result.rows })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Validation:**
- Test dashboard returns correct stats
- Test revenue analytics with different periods
- Test court utilization calculation

---

## Phase 5: Notification System

**Scope:** Email and SMS notification utilities

### 5.1 Email Service

**File:** `lib/services/email.service.ts`

```typescript
import sgMail from '@sendgrid/mail'

if (process.env.EMAIL_API_KEY) {
  sgMail.setApiKey(process.env.EMAIL_API_KEY)
}

interface EmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(params: EmailParams) {
  if (!process.env.EMAIL_API_KEY) {
    console.log('Email not configured, skipping:', params.subject)
    return
  }

  try {
    await sgMail.send({
      from: {
        email: process.env.EMAIL_FROM || 'noreply@redclay.com',
        name: process.env.EMAIL_FROM_NAME || 'Red Clay Tennis'
      },
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || params.html.replace(/<[^>]*>/g, ''),
    })

    console.log(`Email sent to ${params.to}: ${params.subject}`)
  } catch (error) {
    console.error('Email send error:', error)
    throw error
  }
}

// Email templates
export async function sendBookingConfirmation(booking: any, user: any, court: any) {
  const html = `
    <h2>Booking Confirmed</h2>
    <p>Hi ${user.full_name},</p>
    <p>Your booking has been confirmed!</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>Court: ${court.name}</li>
      <li>Date: ${booking.booking_date}</li>
      <li>Time: ${booking.start_time} - ${booking.end_time}</li>
      <li>Total: $${(booking.court_fee + booking.trainer_fee).toFixed(2)}</li>
    </ul>
    <p>See you on the court!</p>
  `

  await sendEmail({
    to: user.email,
    subject: 'Booking Confirmed - Red Clay Tennis',
    html,
  })
}

export async function sendBookingCancellation(booking: any, user: any, court: any) {
  const html = `
    <h2>Booking Cancelled</h2>
    <p>Hi ${user.full_name},</p>
    <p>Your booking has been cancelled.</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>Court: ${court.name}</li>
      <li>Date: ${booking.booking_date}</li>
      <li>Time: ${booking.start_time} - ${booking.end_time}</li>
    </ul>
    <p>If you need to rebook, please visit our platform.</p>
  `

  await sendEmail({
    to: user.email,
    subject: 'Booking Cancelled - Red Clay Tennis',
    html,
  })
}

export async function sendWelcomeEmail(user: any) {
  const html = `
    <h2>Welcome to Red Clay Tennis!</h2>
    <p>Hi ${user.full_name},</p>
    <p>Thanks for joining Red Clay Tennis. Your account has been created successfully.</p>
    <p>You can now book courts and manage your bookings through our platform.</p>
    <p>If you're a new user, please note that your bookings will require admin approval.</p>
    <p>Happy playing!</p>
  `

  await sendEmail({
    to: user.email,
    subject: 'Welcome to Red Clay Tennis',
    html,
  })
}

export async function sendUserApprovalEmail(user: any) {
  const html = `
    <h2>Account Approved!</h2>
    <p>Hi ${user.full_name},</p>
    <p>Great news! Your account has been upgraded to Premium status.</p>
    <p>You can now enjoy instant booking confirmations without admin approval.</p>
    <p>Start booking your favorite courts today!</p>
  `

  await sendEmail({
    to: user.email,
    subject: 'Account Upgraded - Red Clay Tennis',
    html,
  })
}
```

### 5.2 Notification Triggers

Update booking approval route to send emails:

**File:** `app/api/admin/bookings/[id]/status/route.ts` (update)

Add after status update:
```typescript
// Get booking details for email
const detailsResult = await client.query(
  `SELECT
    b.*, u.email, u.full_name,
    c.name as court_name
  FROM bookings b
  JOIN users u ON b.user_id = u.id
  JOIN courts c ON b.court_id = c.id
  WHERE b.id = $1`,
  [params.id]
)

const details = detailsResult.rows[0]

if (status === 'confirmed') {
  await sendBookingConfirmation(details, details, { name: details.court_name })
} else if (status === 'cancelled') {
  await sendBookingCancellation(details, details, { name: details.court_name })
}
```

**Validation:**
- Test email sending works (if configured)
- Test graceful fallback when email not configured
- Test all email templates render correctly

---

## Testing Strategy

### Unit Tests
- Admin permission checks
- Service functions for admin operations
- Email template generation

### Integration Tests
- All admin API endpoints
- Authorization checks (admin only)
- Booking approval flow
- User management flow
- Package CRUD operations

### Test Coverage Targets

| Area | Target |
|------|--------|
| Admin Services | 85% |
| Admin Routes | 90% |
| Email Service | 75% |
| Analytics | 80% |

---

## Success Criteria

### Functionality
- [ ] Admin can view and filter all bookings
- [ ] Admin can approve/reject bookings
- [ ] Admin can view booking statistics
- [ ] Admin can list and filter users
- [ ] Admin can upgrade users to premium
- [ ] Admin can change user roles
- [ ] Admin can view user activity
- [ ] Admin can create/update/delete packages
- [ ] Admin can view package statistics
- [ ] Admin can manage waitlist
- [ ] Admin can notify waitlist users
- [ ] Admin dashboard shows key metrics
- [ ] Revenue analytics work correctly
- [ ] Court utilization tracked
- [ ] Email notifications sent for key events

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] All admin routes require admin permission
- [ ] Consistent error handling across all routes
- [ ] Proper pagination on list endpoints
- [ ] No duplicate logic across admin routes
- [ ] Proper logging for admin actions

### Testing
- [ ] All admin endpoints have integration tests
- [ ] Permission checks are tested
- [ ] Email service tested (with mocks)
- [ ] Analytics calculations tested
- [ ] Test coverage meets targets

### Documentation
- [ ] All admin endpoints documented
- [ ] Email templates documented
- [ ] Analytics formulas documented
