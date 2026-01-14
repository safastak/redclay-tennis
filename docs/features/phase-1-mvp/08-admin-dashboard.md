# Feature 08: Admin Dashboard

Complete system management interface for administrators.

---

## Admin Dashboard Overview

**Mobile UI:**
```
┌─────────────────────────────────┐
│ ☰   Admin Panel     🔔 👤      │
├─────────────────────────────────┤
│ PENDING ACTIONS                 │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⏳ 3 Pending Bookings       │ │
│ │ [Review →]                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 💼 2 Package Requests       │ │
│ │ [Confirm Payments →]        │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⚠️ 1 Late Cancellation      │ │
│ │ [Review →]                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ MANAGEMENT                      │
│ [📅 All Bookings]               │
│ [👥 Users]                      │
│ [🎾 Courts]                     │
│ [👨‍🏫 Trainers]                  │
│ [💼 Packages]                   │
│ [📊 Analytics]                  │
│                                 │
└─────────────────────────────────┘
```

---

## Approve Bookings

**Pending bookings list:**
```
┌─────────────────────────────────┐
│ ← Back   Pending Bookings        │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ John Doe (NEW USER)         │ │
│ │ Tennis Court 1              │ │
│ │ Jan 14 at 10 AM             │ │
│ │ With Coach Mike             │ │
│ │ $125.00                     │ │
│ │                             │ │
│ │ Notes: "First time"         │ │
│ │                             │ │
│ │ [Approve] [Deny]            │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**On approve:**
- Update status = 'confirmed'
- Notify user: "Booking approved!"
- Notify trainer
- Remove from pending queue

**On deny:**
- Update status = 'cancelled'
- Notify user: "Booking denied" + reason
- Refund package session (if used)

---

## Confirm Package Payments

**Package requests:**
```
┌─────────────────────────────────┐
│ ← Back   Package Requests        │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Sarah Smith                 │ │
│ │ Tennis Premium 12-Session   │ │
│ │ $550 cash                   │ │
│ │ Requested 2 hours ago       │ │
│ │                             │ │
│ │ ☑ Payment received          │ │
│ │                             │ │
│ │ Notes:                      │ │
│ │ [Paid in full, receipt...]  │ │
│ │                             │ │
│ │ [Confirm Package] [Cancel]  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**On confirm:**
- Update package status = 'active'
- Set confirmed_at, confirmed_by
- Notify user: "Package activated!"
- Apply to any pending bookings

---

## User Management

**User list:**
```
┌─────────────────────────────────┐
│ 👥 USERS                        │
├─────────────────────────────────┤
│ [Search users...]               │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ John Doe                    │ │
│ │ NEW USER | user             │ │
│ │ 5 bookings | 1 package      │ │
│ │                             │ │
│ │ [Upgrade to Premium]        │ │
│ │ [View Details →]            │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**User details:**
- Upgrade to PREMIUM
- Assign TRAINER role
- Assign ADMIN role
- View booking history
- View package history
- Deactivate account

---

## Court Management

**Courts:**
- Add/edit/delete courts
- Set pricing (hourly rate, peak pricing)
- Toggle maintenance mode
- View utilization stats

---

## Trainer Management

**Trainers:**
- Add/remove trainers
- Edit trainer profiles (rates, bio, certifications)
- Manage weekly schedules (which days, what hours)
- View trainer stats (bookings, ratings, revenue)

---

## Package Management

**Package Classes:**
- Create new package types
- Set session composition (court-only, trainer)
- Set pricing and validity
- Define peak/off-peak restrictions
- Link to eligible courts

**User Packages:**
- View all user packages
- Manually add/remove sessions
- Extend expiration dates
- Grant complimentary packages

---

## Analytics

**Reports:**
- Revenue by day/week/month
- Booking trends
- Court utilization rates
- Package sales and usage
- Trainer performance
- User retention metrics

---

## Foundation References

- **Auth:** [authentication.md](../foundations/authentication.md) - Admin permissions (full access)
- **Database:** [database-schema.md](../foundations/database-schema.md) - All tables
- **Automation:** [automation-rules.md](../foundations/automation-rules.md) - Admin action triggers
