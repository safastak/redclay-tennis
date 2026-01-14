# Feature 04: Package System

Prepaid session bundles with automatic application and flexible management.

---

## Browse Packages

**Mobile UI:**
```
┌─────────────────────────────────┐
│ 💼 PACKAGES                     │
├─────────────────────────────────┤
│ AVAILABLE PACKAGES              │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ TENNIS PREMIUM 12-SESSION   │ │
│ │ [ANYTIME] 🌟                │ │
│ │                             │ │
│ │ 💼 10 court-only sessions   │ │
│ │ 👨‍🏫 2 trainer sessions      │ │
│ │                             │ │
│ │ ⏱️ Valid for 90 days        │ │
│ │ 💰 $550 ($45.83/session)    │ │
│ │ 💾 Save $50+                │ │
│ │                             │ │
│ │ [Request Package] ──────────│ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ PICKLEBALL OFF-PEAK 10      │ │
│ │ [OFF-PEAK ONLY] ⚠️          │ │
│ │                             │ │
│ │ 💼 10 court-only sessions   │ │
│ │                             │ │
│ │ ⏰ Weekdays 6 AM - 5 PM     │ │
│ │ 💰 $300 ($30/session)       │ │
│ │ 💾 Save $10/session         │ │
│ │                             │ │
│ │ [Request Package] ──────────│ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## Purchase Package

**Step 1: Request Package**
```
┌─────────────────────────────────┐
│ ⚠️ Package Request              │
│                                 │
│ Tennis Premium 12-Session       │
│ Total: $550                     │
│                                 │
│ PAYMENT INSTRUCTIONS            │
│                                 │
│ 1. Pay $550 cash at facility    │
│ 2. Admin confirms payment       │
│ 3. Package activated            │
│                                 │
│ Package will show as REQUESTED  │
│ until payment confirmed.        │
│                                 │
│ ☑ I understand                  │
│                                 │
│ [Request Package] [Cancel]      │
└─────────────────────────────────┘
```

**Automation:**
- Create user_package record (status = 'requested')
- Notify user: "Package requested"
- Notify admins: "Payment pending"

---

## My Active Packages

**Mobile UI:**
```
┌─────────────────────────────────┐
│ 💼 MY PACKAGES                  │
├─────────────────────────────────┤
│ ACTIVE (1)                      │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ TENNIS PREMIUM   ✅ ACTIVE  │ │
│ │                             │ │
│ │ 📊 SESSION USAGE            │ │
│ │                             │ │
│ │ Court-Only:                 │ │
│ │ ████████░░ 8/10 remaining   │ │
│ │                             │ │
│ │ Trainer:                    │ │
│ │ ██░░ 1/2 remaining          │ │
│ │                             │ │
│ │ ⏰ Expires: Apr 15, 2026    │ │
│ │    (85 days left)           │ │
│ │                             │ │
│ │ [View History] [Book Now]   │ │
│ └─────────────────────────────┘ │
│                                 │
│ REQUESTED (1)                   │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ PICKLEBALL 10   ⏳ PENDING  │ │
│ │ Awaiting payment confirm    │ │
│ │ $300 cash at facility       │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Color-Coded Progress:**
- Green (70-100%): Plenty of sessions left
- Yellow (40-69%): Running low
- Orange (20-39%): Almost depleted
- Red (1-19%): Last few sessions

---

## Automatic Package Application

**During booking, system automatically:**

1. **Searches for matching package:**
   - Sport match (tennis/pickleball)
   - Session type match (court-only vs trainer)
   - Peak/off-peak compliance
   - Has remaining sessions
   - Status = 'active' or 'requested'

2. **If match found:**
   - Set court_fee = 0
   - Set trainer_fee = 0 (if trainer session)
   - Deduct session from package
   - Show in booking summary

3. **If no match:**
   - Charge regular rates
   - Explain why package didn't apply

**Error Handling:**
See mobile-first-ui.md for package mismatch error patterns.

---

## Package Expiration

**Automation (daily job):**
- Find packages where expires_at < now()
- Update status = 'expired'
- Notify user

**Warning Notifications:**
- 7 days before: "Package expiring soon"
- Day of: "Package expired"

---

## Foundation References

- **Database:** [database-schema.md](../foundations/database-schema.md) - package tables
- **Automation:** [automation-rules.md](../foundations/automation-rules.md) - Package application logic
- **UI:** [mobile-first-ui.md](../foundations/mobile-first-ui.md) - Package card patterns
