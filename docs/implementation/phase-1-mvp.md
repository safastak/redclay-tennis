# Phase 1: MVP Core Implementation
## Red Clay Tennis Booking Platform

**Timeline:** Weeks 1-3
**Goal:** Basic booking system with admin approval
**Team:** 2-3 full-stack developers

---

## Phase Overview

Phase 1 delivers the core booking functionality:
- User registration and authentication
- Court booking creation
- Admin approval workflow
- Basic package detection

By end of Phase 1, users can:
- Sign up and log in
- Browse available courts
- Request bookings
- Admins can approve/deny bookings

---

## Week 1: Foundation & Authentication

### Tasks
1. Database Setup ✅ (Already done via migrations)
2. Authentication System
3. User Registration
4. User Login/Logout

### Implementation Steps

#### 1. Create Authentication API Routes

**File:** `/api/auth/signup.ts`

```typescript
import { hash } from 'bcrypt'
import { sign } from 'jsonwebtoken'
import { pool } from '@/lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password, full_name, phone_number } = req.body

  // Validate inputs
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // Hash password
    const passwordHash = await hash(password, 12)

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, full_name, phone_number)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, user_type, app_role, created_at`,
      [email, full_name, phone_number]
    )

    const user = result.rows[0]

    // Store password hash in separate auth table
    await pool.query(
      'INSERT INTO user_auth (user_id, password_hash) VALUES ($1, $2)',
      [user.id, passwordHash]
    )

    // Generate JWT token
    const token = sign(
      { userId: user.id, email: user.email, role: user.app_role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    )

    // Send welcome email
    await sendWelcomeEmail(user.email, user.full_name)

    return res.status(201).json({ user, token })
  } catch (error) {
    if (error.code === '23505') {  // Unique violation
      return res.status(409).json({ error: 'Email already in use' })
    }
    console.error('Signup error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

#### 2. Create Frontend Registration Form

**File:** `/components/Auth/SignupForm.tsx`

```typescript
import { useState } from 'react'
import { useRouter } from 'next/router'

export function SignupForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone_number: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      const { user, token } = await response.json()

      // Store token
      localStorage.setItem('token', token)

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="signup-form">
      {error && <div className="error">{error}</div>}

      <div className="field">
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="field">
        <label>Password</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          minLength={8}
        />
      </div>

      <div className="field">
        <label>Full Name</label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          required
        />
      </div>

      <div className="field">
        <label>Phone Number (optional)</label>
        <input
          type="tel"
          value={formData.phone_number}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  )
}
```

### Documentation Reference
- See [User Registration Feature](../features/phase-1-mvp/01-user-registration.md) for complete user flows
- See [API Examples](../api/examples.md) for request/response formats

---

## Week 2: Court Booking System

### Tasks
1. Courts Management (Admin)
2. Booking Creation Flow
3. Package Detection (Basic)
4. Status Assignment (NEW vs PREMIUM)

### Key Implementation

#### Booking Creation API

**File:** `/api/bookings/create.ts`

```typescript
import { pool } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { applyPackageToBooking } from '@/lib/packages'
import { sendNotification } from '@/lib/notifications'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Verify authentication
  const user = await verifyToken(req.headers.authorization)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const {
    court_id,
    trainer_id,
    booking_date,
    start_time,
    end_time,
    notes
  } = req.body

  try {
    // Start transaction
    const client = await pool.connect()
    await client.query('BEGIN')

    // Check court availability
    const conflicts = await client.query(
      `SELECT id FROM bookings
       WHERE court_id = $1 AND booking_date = $2 AND start_time = $3
         AND status IN ('confirmed', 'pending')`,
      [court_id, booking_date, start_time]
    )

    if (conflicts.rows.length > 0) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'Court already booked at this time' })
    }

    // Determine booking status based on user type
    const status = user.user_type === 'premium' || user.app_role === 'admin'
      ? 'confirmed'
      : 'pending'

    // Get court pricing
    const courtResult = await client.query(
      'SELECT hourly_rate, peak_hour_rate FROM courts WHERE id = $1',
      [court_id]
    )
    const court = courtResult.rows[0]

    // Check if peak time
    const isPeakTime = await client.query(
      'SELECT is_peak_time($1, $2)',
      [booking_date, start_time]
    )
    const is_peak = isPeakTime.rows[0].is_peak_time

    let court_fee = is_peak && court.peak_hour_rate
      ? court.peak_hour_rate
      : court.hourly_rate

    let trainer_fee = 0
    if (trainer_id) {
      const trainerResult = await client.query(
        'SELECT hourly_rate FROM trainers WHERE id = $1',
        [trainer_id]
      )
      trainer_fee = trainerResult.rows[0].hourly_rate
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
        user.id, court_id, trainer_id,
        booking_date, start_time, end_time,
        status, court_fee, trainer_fee, is_peak, notes
      ]
    )

    const booking = bookingResult.rows[0]

    // Try to apply package (automation)
    const packageResult = await applyPackageToBooking(client, booking)
    if (packageResult.applied) {
      // Update booking with package info
      await client.query(
        `UPDATE bookings
         SET package_id = $1, court_fee = 0, trainer_fee = 0,
             package_session_type = $2
         WHERE id = $3`,
        [packageResult.package_id, packageResult.session_type, booking.id]
      )
    }

    // Commit transaction
    await client.query('COMMIT')
    client.release()

    // Send notifications (async, don't await)
    if (status === 'confirmed') {
      sendNotification(user.id, 'booking_confirmed', { booking })
    } else {
      sendNotification(user.id, 'booking_pending', { booking })
      // Notify admins
      notifyAdmins('booking_requires_approval', { booking })
    }

    return res.status(201).json({ booking, package: packageResult })
  } catch (error) {
    console.error('Booking creation error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

### Documentation Reference
- See [Court Booking Feature](../features/phase-1-mvp/02-court-booking.md) for complete flow
- See [Automation Rules](../reference/automation-rules.md) for package application algorithm

---

## Week 3: Admin Dashboard & Approval System

### Tasks
1. Admin Dashboard UI
2. Pending Bookings Queue
3. Approve/Deny Functionality
4. User Management (Upgrade to PREMIUM)

### Key Implementation

#### Admin Approval API

**File:** `/api/admin/bookings/approve.ts`

```typescript
export default async function handler(req, res) {
  const user = await verifyToken(req.headers.authorization)

  // Check admin role
  if (user.app_role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  const { bookingId } = req.query
  const { admin_notes } = req.body

  try {
    // Update booking status
    await pool.query(
      `UPDATE bookings
       SET status = 'confirmed',
           admin_reviewed_by = $1,
           admin_review_notes = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [user.id, admin_notes, bookingId]
    )

    // Get booking details
    const booking = await pool.query(
      `SELECT b.*, u.email, u.full_name, c.name as court_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN courts c ON b.court_id = c.id
       WHERE b.id = $1`,
      [bookingId]
    )

    // Notify user
    await sendNotification(booking.rows[0].user_id, 'booking_approved', {
      booking: booking.rows[0]
    })

    return res.status(200).json({ success: true, booking: booking.rows[0] })
  } catch (error) {
    console.error('Approval error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

### Documentation Reference
- See [Admin Dashboard Feature](../features/phase-1-mvp/08-admin-dashboard.md) for admin features
- See [Authentication](../architecture/authentication.md) for permission model

---

## Verification & Testing

### Week 1 Verification
```bash
# Test user registration
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'

# Expected: 201 Created with user object and JWT token
```

### Week 2 Verification
```bash
# Test booking creation
curl -X POST http://localhost:3000/api/bookings/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "court_id": "court-1",
    "booking_date": "2026-01-20",
    "start_time": "10:00:00",
    "end_time": "11:00:00"
  }'

# Expected: 201 Created with booking object
```

### Week 3 Verification
```bash
# Test admin approval
curl -X POST http://localhost:3000/api/admin/bookings/approve \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-id",
    "admin_notes": "Approved"
  }'

# Expected: 200 OK with updated booking
```

---

## Phase 1 Deliverables

### Features Completed
- ✅ User registration with email validation
- ✅ JWT-based authentication
- ✅ Court browsing and availability checking
- ✅ Booking creation with status assignment
- ✅ Package application (basic)
- ✅ Admin approval workflow
- ✅ Email notifications for key events

### Database Tables Used
- `users` - User accounts
- `courts` - Court definitions
- `bookings` - Booking records
- `trainers` - Trainer information (if trainer bookings)
- `user_packages` - Package assignments
- `package_classes` - Package definitions

### API Endpoints Created
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/courts` - List available courts
- `POST /api/bookings/create` - Create booking
- `GET /api/bookings` - List user bookings
- `POST /api/admin/bookings/approve` - Approve booking
- `POST /api/admin/bookings/deny` - Deny booking

---

## Success Criteria

Phase 1 is complete when:
- [ ] All unit tests passing for authentication and booking logic
- [ ] Integration tests passing for API endpoints
- [ ] E2E test for complete booking flow passing
- [ ] NEW users can register and create pending bookings
- [ ] PREMIUM users can create confirmed bookings
- [ ] Admins can approve/deny bookings
- [ ] Email notifications sent for all key events
- [ ] Mobile-responsive UI working on iOS and Android
- [ ] No critical bugs in issue tracker

---

## Common Issues & Solutions

### Issue: JWT Token Not Working
**Symptom:** 401 Unauthorized on protected routes

**Solution:**
```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET

# Check token format in Authorization header
# Should be: "Bearer <token>"
# NOT: "<token>" or "JWT <token>"
```

### Issue: Package Not Applying
**Symptom:** Booking created but package not deducted

**Solution:**
Check package eligibility in order:
1. Sport type matches court
2. Session type availability (court-only vs trainer)
3. Peak/off-peak compliance
4. Court is in package's eligible courts
5. Package status is 'active'

### Issue: Email Not Sending
**Symptom:** No welcome email received

**Solution:**
```bash
# Check email configuration
echo $EMAIL_PROVIDER
echo $EMAIL_API_KEY
echo $EMAIL_FROM

# Test email service directly
node scripts/test-email.js
```

---

## Next Steps

After completing Phase 1:
- **Review with stakeholders** - Demo the MVP
- **Gather feedback** - Note any issues or feature requests
- **Plan Phase 2** - Review [Phase 2 Implementation](phase-2-revenue.md)
- **Performance testing** - Load test the booking creation flow
- **Security audit** - Review authentication implementation

---

**Phase Duration:** 3 weeks
**Estimated Effort:** 120-180 developer hours
**Team Size:** 2-3 full-stack developers
**Risk Level:** Low (core functionality only)

---

**Document Version:** 2.0
**Last Updated:** January 14, 2026
