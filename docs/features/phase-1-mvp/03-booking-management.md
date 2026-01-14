# Feature 03: Booking Management

View, cancel, modify, and share existing bookings.

---

## View My Bookings

**Mobile Dashboard:**
```
┌─────────────────────────────────┐
│ 📅 MY BOOKINGS                  │
├─────────────────────────────────┤
│ UPCOMING (2)                    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⏳ PENDING                  │ │
│ │ Tennis Court 1              │ │
│ │ Jan 14 at 10 AM             │ │
│ │ With Coach Mike             │ │
│ │ $125.00                     │ │
│ │ [Cancel] [Details →]        │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ✅ CONFIRMED                │ │
│ │ Pickleball Court 3          │ │
│ │ Jan 16 at 2 PM              │ │
│ │ FREE (package used)         │ │
│ │ [Cancel] [Invite] [Details] │ │
│ └─────────────────────────────┘ │
│                                 │
│ PAST (5)                        │
│ [View History →]                │
└─────────────────────────────────┘
```

---

## Cancel Booking

**Cancellation Flow:**

**Step 1: Tap Cancel**
```
┌─────────────────────────────────┐
│ ⚠️ Cancel Booking?              │
│                                 │
│ Tennis Court 1                  │
│ Tuesday, Jan 14 at 10 AM        │
│                                 │
│ Time until booking: 36 hours    │
│                                 │
│ ✅ Package session will be      │
│    refunded (>24h notice)       │
│                                 │
│ Reason (optional):              │
│ ┌─────────────────────────────┐ │
│ │ Schedule conflict...        │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Confirm Cancel] [Keep Booking] │
└─────────────────────────────────┘
```

**If <24 hours:**
```
┌─────────────────────────────────┐
│ ⚠️ Late Cancellation            │
│                                 │
│ Time until booking: 8 hours     │
│                                 │
│ ⚠️ Package session refund       │
│    requires admin approval      │
│                                 │
│ Admin will review and decide.   │
│                                 │
│ Reason (required):              │
│ ┌─────────────────────────────┐ │
│ │ Emergency...                │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Submit Cancellation Request]   │
└─────────────────────────────────┘
```

**Automation:**
- >= 24h: Auto-refund package session
- < 24h: Admin review required
- Notify waitlist users
- Update booking status = 'cancelled'

---

## Request Changes

**User taps "Request Change":**
```
┌─────────────────────────────────┐
│ ← Back  Request Change           │
├─────────────────────────────────┤
│ CURRENT BOOKING                 │
│ Tennis Court 1                  │
│ Jan 14 at 10 AM                 │
│                                 │
│ WHAT WOULD YOU LIKE TO CHANGE?  │
│                                 │
│ ☐ Date/Time                     │
│ ☐ Court                         │
│ ☐ Add/Remove Trainer            │
│                                 │
│ Details:                        │
│ ┌─────────────────────────────┐ │
│ │ Please move to Jan 15 at    │ │
│ │ 2 PM instead...             │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Submit Request] ───────────────│
└─────────────────────────────────┘
```

**Automation:**
- Notification sent to admins
- Request tracked in database
- User notified when admin approves/denies

---

## Invite Friends (Session Sharing)

**User taps "Invite" on confirmed booking:**
```
┌─────────────────────────────────┐
│ ← Back  Invite to Session        │
├─────────────────────────────────┤
│ Tennis Court 1                  │
│ Jan 14 at 10 AM                 │
│                                 │
│ INVITE FRIEND                   │
│                                 │
│ Email:                          │
│ ┌─────────────────────────────┐ │
│ │ friend@example.com          │ │
│ └─────────────────────────────┘ │
│                                 │
│ Or search registered users:     │
│ [🔍 Search users...]            │
│                                 │
│ Message (optional):             │
│ ┌─────────────────────────────┐ │
│ │ Want to play doubles?       │ │
│ └─────────────────────────────┘ │
│                                 │
│ ℹ️ You pay, they play for free  │
│                                 │
│ [Send Invite] ──────────────────│
└─────────────────────────────────┘
```

**Invited user receives:**
- Email notification (if not registered)
- In-app notification (if registered)
- [Accept] [Decline] buttons

**Automation:**
- Create booking_invite record
- Notify invited user
- On accept: Create secondary booking linked to primary
- Update both users' dashboards

---

## Foundation References

- **Automation:** [automation-rules.md](../foundations/automation-rules.md) - Cancellation refund logic
- **Database:** [database-schema.md](../foundations/database-schema.md) - booking_invites table
- **UI:** [mobile-first-ui.md](../foundations/mobile-first-ui.md) - Booking card patterns
