# Feature 05: Waitlist System

Slot-specific waitlist with automatic notifications when courts become available.

---

## Join Waitlist

**When slot is fully booked:**
```
┌─────────────────────────────────┐
│ ⚠️ Fully Booked                 │
│                                 │
│ Tennis courts are full at:      │
│ Tuesday, Jan 14 at 10 AM        │
│                                 │
│ JOIN WAITLIST                   │
│                                 │
│ We'll notify you if a slot      │
│ opens up. First-come-first-     │
│ served.                         │
│                                 │
│ Notify me via:                  │
│ ☑ In-App  ☑ Email  ☑ Telegram  │
│                                 │
│ Preferences (optional):         │
│ □ Need trainer                  │
│ Preferred trainer: [Any ▾]      │
│                                 │
│ [Join Waitlist] [Find Other Time│
└─────────────────────────────────┘
```

**Automation:**
- Create waitlist entry (status = 'active')
- Set expires_at = desired booking date
- User added to notification queue

---

## Waitlist Notification

**When booking cancelled:**

**Automation:**
1. Find all waitlist entries for that slot
2. Notify ALL waiting users (first-come-first-served to book)
3. Update waitlist status = 'notified'

**Mobile Notification:**
```
┌─────────────────────────────────┐
│ 🔔 WAITLIST ALERT               │
│                                 │
│ A court is now available!       │
│                                 │
│ Tennis Court 1                  │
│ Tuesday, Jan 14 at 10 AM        │
│                                 │
│ ⚡ Book quickly before someone  │
│    else takes it!               │
│                                 │
│ [Book Now →] ───────────────────│
│ [Dismiss]                       │
└─────────────────────────────────┘
```

**Channels:**
- In-app push notification
- Email with direct booking link
- Telegram message (if linked)

**First to book wins:**
- Multiple users notified
- First to complete booking gets slot
- Others see "No longer available"

---

## My Waitlist Entries

**Mobile UI:**
```
┌─────────────────────────────────┐
│ 🔔 MY WAITLIST                  │
├─────────────────────────────────┤
│ ACTIVE (2)                      │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🎾 Tennis Court             │ │
│ │ Jan 14 at 10 AM             │ │
│ │ Added 2 hours ago           │ │
│ │ [Cancel Waitlist]           │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🏓 Pickleball Court         │ │
│ │ Jan 16 at 2 PM              │ │
│ │ With trainer                │ │
│ │ [Cancel Waitlist]           │ │
│ └─────────────────────────────┘ │
│                                 │
│ NOTIFIED (1)                    │
│ [View History →]                │
└─────────────────────────────────┘
```

---

## Auto-Expiration

**Daily job:**
- Find waitlist entries where desired_date < today
- Update status = 'expired'
- Clean up old entries

---

## Foundation References

- **Database:** [database-schema.md](../foundations/database-schema.md) - waitlists table
- **Automation:** [automation-rules.md](../foundations/automation-rules.md) - Waitlist notification logic
