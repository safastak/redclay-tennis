# Feature 06: Session Sharing

Invite friends to join your bookings - you pay, they play for free.

---

## Overview

Primary user pays for booking and invites friends. Invited users see the session in their dashboard but aren't charged. Covered in [03-booking-management.md](./03-booking-management.md#invite-friends-session-sharing).

---

## Invite Flow

1. User has confirmed booking
2. Taps "Invite" button
3. Enters friend's email or selects registered user
4. Friend receives notification
5. Friend accepts/declines
6. Both users see booking in dashboards

---

## Accept Invite

**Invited user receives notification:**
```
┌─────────────────────────────────┐
│ 🔔 SESSION INVITE               │
│                                 │
│ John Doe invited you to play!   │
│                                 │
│ 🎾 Tennis Court 1               │
│ Tuesday, Jan 14 at 10 AM        │
│                                 │
│ ✓ Free (John pays)              │
│ ✓ With Coach Mike               │
│                                 │
│ [Accept Invite] [Decline]       │
└─────────────────────────────────┘
```

**On accept:**
- Secondary booking created (linked to primary)
- Both bookings share same slot
- Invited user sees "Shared session with John"
- Primary user sees "Sarah accepted invite"

---

## Automation

**On invite:**
- Create booking_invite record
- Notify invited user (email + in-app + telegram)
- Set expires_at = booking start time

**On accept:**
- Create booking (is_primary_booking = false)
- Link to primary booking
- Update invite status = 'accepted'
- Notify both users

**On decline:**
- Update invite status = 'declined'
- Notify primary user

---

## Foundation References

- **Database:** [database-schema.md](../foundations/database-schema.md) - booking_invites table
- **Automation:** [automation-rules.md](../foundations/automation-rules.md) - Invite notification logic
