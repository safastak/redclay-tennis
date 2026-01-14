# Phase 2: Revenue Features Implementation
## Red Clay Tennis Booking Platform

**Timeline:** Weeks 4-6
**Goal:** Package system, booking management, and waitlist features
**Team:** 2-3 full-stack developers

---

## Phase Overview

Phase 2 adds revenue-generating features and booking management:
- Package system (prepaid sessions)
- Booking cancellation and modifications
- Waitlist system
- Session sharing (invite friends)
- Trainer portal

By end of Phase 2, the platform can:
- Sell and manage packages
- Handle booking changes and cancellations
- Notify users when slots become available
- Enable social booking (share sessions)
- Give trainers their own dashboard

---

## Week 4: Package System

### Tasks
1. Package Classes Management (Admin)
2. Package Request Flow
3. Package Payment Confirmation
4. Package Usage Tracking

### Key Implementation

#### Package Application Function

**File:** `/lib/packages.ts`

```typescript
export async function applyPackageToBooking(client, booking) {
  // 1. Find matching packages
  const packages = await client.query(
    `SELECT up.* FROM user_packages up
     JOIN package_classes pc ON up.package_class_id = pc.id
     WHERE up.user_id = $1
       AND pc.sport_type = (SELECT sport_type FROM courts WHERE id = $2)
       AND up.status IN ('active', 'requested')
       AND up.expires_at > CURRENT_TIMESTAMP`,
    [booking.user_id, booking.court_id]
  )

  // 2. Filter by session type
  let eligiblePackages = packages.rows.filter(pkg => {
    if (booking.trainer_id) {
      return pkg.remaining_trainer_sessions > 0
    } else {
      return pkg.remaining_court_only_sessions > 0
    }
  })

  // 3. Check peak/off-peak compliance
  if (booking.is_peak_time) {
    eligiblePackages = eligiblePackages.filter(pkg => pkg.peak_off_peak === 'anytime')
  }

  // 4. Check court eligibility
  const courtEligible = await Promise.all(
    eligiblePackages.map(async (pkg) => {
      const eligible = await client.query(
        `SELECT 1 FROM package_courts
         WHERE package_class_id = $1 AND court_id = $2 AND is_active = true`,
        [pkg.package_class_id, booking.court_id]
      )
      return eligible.rows.length > 0 ? pkg : null
    })
  )

  eligiblePackages = courtEligible.filter(Boolean)

  // 5. Apply first match
  if (eligiblePackages.length > 0) {
    const pkg = eligiblePackages[0]

    // Deduct session
    if (booking.trainer_id) {
      await client.query(
        `UPDATE user_packages
         SET remaining_trainer_sessions = remaining_trainer_sessions - 1,
             last_used_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [pkg.id]
      )
    } else {
      await client.query(
        `UPDATE user_packages
         SET remaining_court_only_sessions = remaining_court_only_sessions - 1,
             last_used_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [pkg.id]
      )
    }

    // Check if depleted
    const updated = await client.query(
      'SELECT * FROM user_packages WHERE id = $1',
      [pkg.id]
    )
    const updatedPkg = updated.rows[0]

    if (updatedPkg.remaining_court_only_sessions === 0 &&
        updatedPkg.remaining_trainer_sessions === 0) {
      await client.query(
        `UPDATE user_packages SET status = 'depleted' WHERE id = $1`,
        [pkg.id]
      )
    }

    return {
      applied: true,
      package_id: pkg.id,
      session_type: booking.trainer_id ? 'trainer_included' : 'court_only'
    }
  }

  return { applied: false }
}
```

#### Package Request API

**File:** `/api/packages/request.ts`

```typescript
export default async function handler(req, res) {
  const user = await verifyToken(req.headers.authorization)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { package_class_id } = req.body

  try {
    // Get package class details
    const pkgClass = await pool.query(
      'SELECT * FROM package_classes WHERE id = $1 AND is_active = true',
      [package_class_id]
    )

    if (pkgClass.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' })
    }

    const pkg = pkgClass.rows[0]

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + pkg.validity_days)

    // Create user package
    const result = await pool.query(
      `INSERT INTO user_packages (
        user_id, package_class_id, status,
        remaining_court_only_sessions, remaining_trainer_sessions,
        expires_at, purchased_at
      ) VALUES ($1, $2, 'requested', $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        user.id,
        package_class_id,
        pkg.total_court_sessions,
        pkg.total_trainer_sessions,
        expiresAt
      ]
    )

    // Send notification to admins for payment confirmation
    await notifyAdmins('package_request_pending', {
      user,
      package: result.rows[0],
      packageClass: pkg
    })

    return res.status(201).json({
      message: 'Package requested. Awaiting payment confirmation.',
      package: result.rows[0]
    })
  } catch (error) {
    console.error('Package request error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

### Documentation Reference
- See [Package System Feature](../features/phase-2-revenue/04-package-system.md) for complete package flows
- See [Automation Rules](../reference/automation-rules.md) for package logic

---

## Week 5: Booking Management & Waitlist

### Tasks
1. Cancel Booking (with refund logic)
2. Modify Booking Request
3. Join Waitlist
4. Waitlist Notifications

### Key Implementation

#### Booking Cancellation API

**File:** `/api/bookings/[id]/cancel.ts`

```typescript
export default async function handler(req, res) {
  const user = await verifyToken(req.headers.authorization)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  const { reason } = req.body

  try {
    const client = await pool.connect()
    await client.query('BEGIN')

    // Get booking details
    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE id = $1',
      [id]
    )

    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Booking not found' })
    }

    const booking = bookingResult.rows[0]

    // Verify ownership or admin
    if (booking.user_id !== user.id && user.app_role !== 'admin') {
      await client.query('ROLLBACK')
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // Check if cancellation is allowed (24hr+ before booking)
    const bookingTime = new Date(`${booking.booking_date} ${booking.start_time}`)
    const hoursUntilBooking = (bookingTime - new Date()) / (1000 * 60 * 60)

    if (hoursUntilBooking < 24) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: 'Cannot cancel booking less than 24 hours before start time'
      })
    }

    // Refund package session if applicable
    if (booking.package_id) {
      const sessionType = booking.package_session_type
      const column = sessionType === 'trainer_included'
        ? 'remaining_trainer_sessions'
        : 'remaining_court_only_sessions'

      await client.query(
        `UPDATE user_packages
         SET ${column} = ${column} + 1,
             status = CASE
               WHEN status = 'depleted' THEN 'active'
               ELSE status
             END
         WHERE id = $1`,
        [booking.package_id]
      )
    }

    // Cancel booking
    await client.query(
      `UPDATE bookings
       SET status = 'cancelled',
           cancellation_reason = $1,
           cancelled_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [reason, id]
    )

    // Notify waitlist users
    await notifyWaitlist(booking.court_id, booking.booking_date, booking.start_time)

    await client.query('COMMIT')
    client.release()

    return res.status(200).json({
      message: 'Booking cancelled successfully',
      refunded: !!booking.package_id
    })
  } catch (error) {
    console.error('Cancellation error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

#### Waitlist Join API

**File:** `/api/waitlist/join.ts`

```typescript
export default async function handler(req, res) {
  const user = await verifyToken(req.headers.authorization)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { court_id, booking_date, start_time, end_time } = req.body

  try {
    // Check if already on waitlist
    const existing = await pool.query(
      `SELECT id FROM waitlist
       WHERE user_id = $1 AND court_id = $2
         AND booking_date = $3 AND start_time = $4
         AND status = 'waiting'`,
      [user.id, court_id, booking_date, start_time]
    )

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Already on waitlist for this slot' })
    }

    // Add to waitlist
    const result = await pool.query(
      `INSERT INTO waitlist (
        user_id, court_id, booking_date, start_time, end_time, status
      ) VALUES ($1, $2, $3, $4, $5, 'waiting')
      RETURNING *`,
      [user.id, court_id, booking_date, start_time, end_time]
    )

    // Send confirmation
    await sendNotification(user.id, 'waitlist_joined', {
      waitlist: result.rows[0]
    })

    return res.status(201).json({
      message: 'Added to waitlist. You will be notified if this slot becomes available.',
      waitlist: result.rows[0]
    })
  } catch (error) {
    console.error('Waitlist join error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

### Documentation Reference
- See [Booking Management Feature](../features/phase-1-mvp/03-booking-management.md) for cancellation flows
- See [Waitlist Feature](../features/phase-2-revenue/05-waitlist.md) for waitlist system
- See [Automation Rules](../reference/automation-rules.md) Section "Booking Cancellation Automation"

---

## Week 6: Session Sharing & Trainer Portal

### Tasks
1. Invite to Booking
2. Accept/Decline Invite
3. Trainer Dashboard
4. Trainer Schedule View

### Key Implementation

#### Session Invite API

**File:** `/api/bookings/[id]/invite.ts`

```typescript
export default async function handler(req, res) {
  const user = await verifyToken(req.headers.authorization)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  const { invitee_email, invitee_name } = req.body

  try {
    // Get booking
    const booking = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [id, user.id]
    )

    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    // Create invite
    const invite = await pool.query(
      `INSERT INTO session_invites (
        booking_id, inviter_id, invitee_email, invitee_name, status
      ) VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *`,
      [id, user.id, invitee_email, invitee_name]
    )

    // Send email invite
    await sendInviteEmail(invitee_email, {
      inviter: user.full_name,
      booking: booking.rows[0],
      invite: invite.rows[0]
    })

    return res.status(201).json({
      message: 'Invite sent successfully',
      invite: invite.rows[0]
    })
  } catch (error) {
    console.error('Invite error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

#### Trainer Dashboard API

**File:** `/api/trainers/schedule.ts`

```typescript
export default async function handler(req, res) {
  const user = await verifyToken(req.headers.authorization)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  // Verify user is a trainer
  const trainer = await pool.query(
    'SELECT id FROM trainers WHERE user_id = $1',
    [user.id]
  )

  if (trainer.rows.length === 0) {
    return res.status(403).json({ error: 'Trainer access required' })
  }

  const trainerId = trainer.rows[0].id
  const { start_date, end_date } = req.query

  try {
    // Get trainer's bookings
    const bookings = await pool.query(
      `SELECT
        b.*,
        u.full_name as client_name,
        u.phone_number as client_phone,
        c.name as court_name,
        c.location as court_location
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN courts c ON b.court_id = c.id
       WHERE b.trainer_id = $1
         AND b.booking_date BETWEEN $2 AND $3
         AND b.status IN ('confirmed', 'pending')
       ORDER BY b.booking_date, b.start_time`,
      [trainerId, start_date, end_date]
    )

    return res.status(200).json({
      bookings: bookings.rows
    })
  } catch (error) {
    console.error('Trainer schedule error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

### Documentation Reference
- See [Session Sharing Feature](../features/phase-2-revenue/06-session-sharing.md) for invite flows
- See [Trainer Portal Feature](../features/phase-2-revenue/07-trainer-portal.md) for trainer features

---

## Verification & Testing

### Week 4 Verification
```bash
# Test package request
curl -X POST http://localhost:3000/api/packages/request \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"package_class_id": "pkg-class-1"}'

# Test package application (create booking with package)
curl -X POST http://localhost:3000/api/bookings/create \
  -H "Authorization: Bearer <token>" \
  -d '{"court_id": "court-1", "booking_date": "2026-01-20", ...}'
```

### Week 5 Verification
```bash
# Test booking cancellation
curl -X POST http://localhost:3000/api/bookings/booking-1/cancel \
  -H "Authorization: Bearer <token>" \
  -d '{"reason": "Schedule conflict"}'

# Test waitlist join
curl -X POST http://localhost:3000/api/waitlist/join \
  -H "Authorization: Bearer <token>" \
  -d '{"court_id": "court-1", "booking_date": "2026-01-20", ...}'
```

### Week 6 Verification
```bash
# Test session invite
curl -X POST http://localhost:3000/api/bookings/booking-1/invite \
  -H "Authorization: Bearer <token>" \
  -d '{"invitee_email": "friend@example.com", "invitee_name": "Friend"}'

# Test trainer schedule
curl http://localhost:3000/api/trainers/schedule?start_date=2026-01-20&end_date=2026-01-27 \
  -H "Authorization: Bearer <trainer-token>"
```

---

## Phase 2 Deliverables

### Features Completed
- ✅ Package system with admin management
- ✅ Automated package application to bookings
- ✅ Package usage tracking and depletion
- ✅ Booking cancellation with package refund
- ✅ Waitlist system with notifications
- ✅ Session sharing and invites
- ✅ Trainer portal with schedule view
- ✅ Email notifications for all new features

### Database Tables Used
- `package_classes` - Package definitions
- `user_packages` - User-owned packages
- `package_courts` - Package-court relationships
- `waitlist` - Waitlist entries
- `session_invites` - Session sharing invites
- `trainers` - Trainer profiles

### API Endpoints Created
- `POST /api/packages/request` - Request package
- `POST /api/admin/packages/confirm` - Confirm package payment
- `POST /api/bookings/[id]/cancel` - Cancel booking
- `POST /api/waitlist/join` - Join waitlist
- `POST /api/bookings/[id]/invite` - Invite to session
- `GET /api/trainers/schedule` - Get trainer schedule

---

## Success Criteria

Phase 2 is complete when:
- [ ] Users can request and purchase packages
- [ ] Packages automatically apply to eligible bookings
- [ ] Package sessions refunded on timely cancellations
- [ ] Waitlist users notified when slots become available
- [ ] Users can invite friends to sessions
- [ ] Trainers can view their schedule
- [ ] All tests passing for new features
- [ ] Revenue tracking working correctly

---

## Common Issues & Solutions

### Issue: Package Not Refunding on Cancel
**Symptom:** Package session not restored after cancellation

**Solution:**
Check cancellation timing - must be 24+ hours before booking. Verify package_id is set on booking record.

### Issue: Waitlist Not Notifying
**Symptom:** Users not getting waitlist notifications

**Solution:**
Verify notifyWaitlist function is called after cancellation. Check notification preferences are enabled.

---

## Next Steps

After completing Phase 2:
- **Review revenue metrics** - Track package sales
- **Gather user feedback** - Test waitlist and invite features
- **Plan Phase 3** - Review [Phase 3 Implementation](phase-3-advanced.md)
- **Optimize package algorithm** - Review performance

---

**Phase Duration:** 3 weeks
**Estimated Effort:** 120-180 developer hours
**Team Size:** 2-3 full-stack developers
**Risk Level:** Medium (complex business logic)

---

**Document Version:** 2.0
**Last Updated:** January 14, 2026
