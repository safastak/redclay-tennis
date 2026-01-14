# Feature 10: Telegram Bot Integration

Natural language booking and notifications via Telegram.

---

## Link Telegram Account

**Flow:**

1. User taps "Link Telegram" in profile
2. System generates unique link code
3. User opens Telegram and messages bot: /start
4. Bot sends authentication link
5. User taps link → opens web app
6. Web app verifies code and links accounts
7. Bot confirms: "Account linked!"

**Mobile UI:**
```
┌─────────────────────────────────┐
│ TELEGRAM INTEGRATION            │
│                                 │
│ 1. Open Telegram                │
│ 2. Search: @RedClayBot          │
│ 3. Send: /start                 │
│ 4. Follow authentication steps  │
│                                 │
│ [Open Telegram] [Instructions]  │
└─────────────────────────────────┘
```

---

## Book via Telegram

**Natural language:**
```
User: Book tennis court tomorrow at 2pm

Bot: I found these options:

🎾 Tennis Courts
📅 Wed, Jan 15 at 2:00 PM

Available Courts:
1. Court 1 - Clay ($50)
2. Court 2 - Clay ($50)
3. Court 3 - Hard ($45)

[Select Court 1] [Select Court 2] [Select Court 3]
```

**User selects court:**
```
Bot: Great! Do you need a trainer?

[No trainer] [Any trainer] [Specific trainer]
```

**Confirmation:**
```
Bot: ✅ Booking Confirmed!

🎾 Tennis Court 1
📅 Wed, Jan 15 at 2:00 PM
💰 $50.00

Your booking is confirmed!

[View in App] [Cancel]
```

---

## Notifications via Telegram

**All in-app notifications also sent to Telegram (if linked):**
- Booking confirmations
- Cancellations
- Waitlist alerts
- Package updates

**Interactive:**
- Inline buttons for quick actions
- "Cancel Booking" → Confirms cancellation
- "View Details" → Opens web app

---

## Bot Commands

- `/start` - Link account
- `/book` - Start booking flow
- `/mybookings` - List upcoming bookings
- `/cancel` - Cancel a booking
- `/help` - Show available commands
- `/unlink` - Unlink Telegram account

---

## Foundation References

- **Database:** [database-schema.md](../foundations/database-schema.md) - telegram_users table
- **Automation:** [automation-rules.md](../foundations/automation-rules.md) - Telegram notification sync
