# Feature 09: Multi-Channel Notifications

Automatic notifications across in-app, email, SMS, and Telegram channels.

---

## Notification Types

**Booking Related:**
- Booking confirmed
- Booking pending approval
- Booking approved/denied
- Booking cancelled
- Booking reminder (2 hours before)

**Package Related:**
- Package requested
- Package activated
- Package expiring (7 days warning)
- Package expired
- Package depleted (all sessions used)

**Waitlist Related:**
- Joined waitlist
- Slot available (urgent)
- Waitlist expired

**Session Sharing:**
- Invite received
- Invite accepted/declined

**Admin:**
- New booking pending review
- New package payment pending
- Late cancellation requiring review

---

## Notification Channels

### In-App (Always Enabled)

**Mobile notification center:**
```
┌─────────────────────────────────┐
│ 🔔 NOTIFICATIONS                │
├─────────────────────────────────┤
│ NEW (3)                         │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ✅ Booking Confirmed        │ │
│ │ Tennis Court 1, Jan 14      │ │
│ │ 5 minutes ago               │ │
│ │ [View →]                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🔔 Waitlist Alert           │ │
│ │ Slot available - book now!  │ │
│ │ 1 hour ago                  │ │
│ │ [Book →]                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ EARLIER (12)                    │
│ [View All →]                    │
└─────────────────────────────────┘
```

**Badge count:** Shows unread count on bell icon

---

### Email

**Example: Booking Confirmed**
```
Subject: ✅ Booking Confirmed - Tennis Court 1

Hi John,

Your booking is confirmed!

🎾 Tennis Court 1
📅 Tuesday, January 14, 2026
⏰ 10:00 AM - 11:00 AM
👨‍🏫 With Coach Mike Chen

💰 Total: $125.00
   Court fee: $50.00
   Trainer fee: $75.00

Payment at facility.

[Add to Calendar] [View Booking] [Cancel Booking]

Questions? Reply to this email.

---
Red Clay Tennis & Pickleball
```

---

### SMS (Future)

**Example:**
```
Red Clay: Booking confirmed!
Tennis Court 1, Jan 14 at 10 AM.
View: https://redclay.com/b/xyz
```

---

### Telegram

**Example:**
```
✅ Booking Confirmed!

🎾 Tennis Court 1
📅 Tue, Jan 14 at 10:00 AM
👨‍🏫 Coach Mike Chen

💰 $125.00

[View Booking] [Cancel]
```

---

## Notification Preferences

**User settings:**
```
┌─────────────────────────────────┐
│ CHANNELS                        │
│                                 │
│ In-App        ──────────── ON   │ ← Always
│ Email         ──────────── ON   │
│ SMS           ──────────── OFF  │
│ Telegram      ──────────── OFF  │
│                                 │
│ QUIET HOURS                     │
│ 10 PM - 8 AM  ──────────── ON   │
│                                 │
│ NOTIFICATION TYPES              │
│ ☑ Booking confirmations         │
│ ☑ Cancellations                 │
│ ☑ Waitlist alerts               │
│ ☑ Package reminders             │
│ ☐ Marketing emails              │
└─────────────────────────────────┘
```

---

## Automation

**On notification creation:**

1. **Check user preferences:**
   - Which channels enabled?
   - Quiet hours active?
   - Notification type enabled?

2. **Send via enabled channels:**
   - In-app: Always (insert into notifications table)
   - Email: If enabled and not in quiet hours
   - SMS: If enabled and urgent
   - Telegram: If linked and enabled

3. **Track delivery:**
   - Mark notification as sent
   - Record which channels used
   - Track read status (in-app only)

4. **Real-time push:**
   - WebSocket push to connected clients
   - Update UI instantly (badge count, toast)

---

## Foundation References

- **Database:** [database-schema.md](../foundations/database-schema.md) - notifications table
- **Automation:** [automation-rules.md](../foundations/automation-rules.md) - Multi-channel sync
