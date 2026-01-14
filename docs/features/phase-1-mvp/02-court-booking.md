# Feature 02: Court Booking

Complete booking flow from selecting a court to receiving confirmation, covering both NEW and PREMIUM user experiences.

**User Personas:** Registered users (NEW or PREMIUM)
**Key Difference:** NEW users get `pending` status, PREMIUM users get instant `confirmed`

---

## Overview

Users select sport, date, time, court, and optionally a trainer. The system automatically detects and applies packages, calculates fees, and creates the booking with appropriate status based on user type.

---

## Booking Flow

### Step 1: Start Booking

**Entry Points:**
- Dashboard: Tap "Book a Court"
- Bottom Nav: Tap "📅 Book" tab
- Homepage: Tap "Book Now"

**Mobile UI - Sport Selection:**
```
┌─────────────────────────────────┐
│ ← Back    Book a Court           │
├─────────────────────────────────┤
│                                 │
│ CHOOSE SPORT                    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🎾 Tennis                   │ │
│ │ 12 courts available  →      │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🏓 Pickleball               │ │
│ │ 6 courts available   →      │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

---

### Step 2: Select Date & Time

**Mobile UI:**
```
┌─────────────────────────────────┐
│ ← Back    Tennis Booking         │
├─────────────────────────────────┤
│ WHEN?                           │
│                                 │
│  < January 2026 >               │
│ ┌─────────────────────────────┐ │
│ │ S  M  T  W  T  F  S         │ │
│ │          1  2  3  4         │ │
│ │ 5  6  7  8  9 10 11         │ │
│ │12 13 14 15 16 17 18         │ │
│ │19 20 21 22 23 24 25         │ │
│ │26 27 28 29 30 31            │ │
│ └─────────────────────────────┘ │
│                                 │
│ Selected: Tuesday, Jan 14       │
│                                 │
│ TIME SLOTS                      │
│                                 │
│ Morning                         │
│ [9 AM] [10 AM] [11 AM]          │
│                                 │
│ Afternoon                       │
│ [12 PM] [1 PM] [2 PM] [3 PM]    │
│                                 │
│ Evening                         │
│ [4 PM] [5 PM] [6 PM] [7 PM]     │
│                                 │
│ [Continue →] ───────────────────│
└─────────────────────────────────┘
```

**Slot Color Coding:**
- Green: Available courts
- Yellow: Limited (1-2 courts left)
- Gray: Fully booked
- Badge: "3 courts" shows availability count

---

### Step 3: Trainer Selection (Optional)

**Mobile UI:**
```
┌─────────────────────────────────┐
│ ← Back    Select Trainer         │
├─────────────────────────────────┤
│ NEED A TRAINER?                 │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ☐ No trainer (court only)   │ │ ← Default
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ☐ Any available trainer     │ │
│ │   3 trainers available      │ │
│ └─────────────────────────────┘ │
│                                 │
│ SPECIFIC TRAINERS               │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [👤] Coach Mike Chen        │ │
│ │ ⭐ 4.8 (24 reviews)         │ │
│ │ 🎾 Tennis Specialist        │ │
│ │ 💰 $75/hour                 │ │
│ │ ✅ Available       [Select] │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [👤] Coach Sarah Lee        │ │
│ │ ⭐ 4.9 (18 reviews)         │ │
│ │ 🎾 Advanced Technique       │ │
│ │ 💰 $80/hour                 │ │
│ │ ⚠️ Unavailable              │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Continue →] ───────────────────│
└─────────────────────────────────┘
```

**Availability Logic:**
- System checks trainer_schedules for selected day/time
- Shows unavailable trainers with reason (already booked, not scheduled)
- "Any trainer" option shows count of available trainers

---

### Step 4: Court Selection

**Mobile UI:**
```
┌─────────────────────────────────┐
│ ← Back    Select Court           │
├─────────────────────────────────┤
│ AVAILABLE COURTS                │
│ Tuesday, Jan 14 at 10 AM        │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Court 1 - Clay              │ │
│ │ $50/hour                    │ │
│ │ [Select] ───────────────────│ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Court 2 - Clay              │ │
│ │ $50/hour                    │ │
│ │ ⚠️ Peak time (+$10)         │ │
│ │ [Select] ───────────────────│ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Court 3 - Hard Court        │ │
│ │ $45/hour                    │ │
│ │ [Select] ───────────────────│ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

---

### Step 5: Review & Confirm

**Mobile UI - NEW User (Pending Approval):**
```
┌─────────────────────────────────┐
│ ← Back    Review Booking         │
├─────────────────────────────────┤
│ ⏳ PENDING APPROVAL              │
│ Admin will review your booking  │
│                                 │
│ BOOKING DETAILS                 │
│                                 │
│ 🎾 Tennis Court 1               │
│ 📅 Tuesday, Jan 14, 2026        │
│ ⏰ 10:00 AM - 11:00 AM          │
│ 👨‍🏫 Coach Mike Chen             │
│                                 │
│ PRICING                         │
│                                 │
│ Court fee:            $50.00    │
│ Trainer fee:          $75.00    │
│ ─────────────────────────────   │
│ Total:               $125.00    │
│                                 │
│ 💳 Payment at facility          │
│                                 │
│ NOTES (Optional)                │
│ ┌─────────────────────────────┐ │
│ │ First time player...        │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Confirm Booking] ──────────────│
└─────────────────────────────────┘
```

**With Package Applied:**
```
│ PRICING                         │
│                                 │
│ Court fee:              FREE    │
│ Trainer fee:            FREE    │
│ (1 trainer session used)        │
│ ─────────────────────────────   │
│ Total:                  $0.00   │
│                                 │
│ 💼 Package: Tennis Premium      │
│ Remaining: 9 court, 1 trainer   │
```

**Mobile UI - PREMIUM User (Instant Confirm):**
```
┌─────────────────────────────────┐
│ ✅ INSTANT CONFIRMATION          │
│ Your booking is confirmed!      │
│                                 │
│ [Same booking details...]       │
│                                 │
│ [Confirm Booking] ──────────────│
└─────────────────────────────────┘
```

---

### Step 6: Confirmation

**Mobile UI - Success Screen:**
```
┌─────────────────────────────────┐
│                                 │
│           ✅                    │
│                                 │
│      Booking Confirmed!         │
│   (or "Pending Approval")       │
│                                 │
│ 🎾 Tennis Court 1               │
│ Tuesday, Jan 14 at 10 AM        │
│                                 │
│ Confirmation sent to:           │
│ ✉️ john@example.com             │
│                                 │
│ [View My Bookings] ─────────────│
│ [Book Another Court]            │
│ [Add to Calendar]               │
│                                 │
└─────────────────────────────────┘
```

---

## Automation Triggered

**On booking creation:**

1. **Package Detection** (see automation-rules.md):
   - Check for active packages matching sport
   - Validate session type (court-only vs trainer)
   - Check peak/off-peak compliance
   - Apply if match found, deduct session

2. **Status Assignment:**
   - NEW user → `status = 'pending'`
   - PREMIUM/ADMIN → `status = 'confirmed'`

3. **Notifications:**
   - NEW user: "Booking pending approval"
   - PREMIUM user: "Booking confirmed"
   - Admins (if pending): "New booking requires approval"
   - Trainer: "New session assigned"

4. **Waitlist Processing:**
   - If confirmed, cancel waitlist entries for this slot

5. **Calendar Integration:**
   - Generate .ics file
   - Send via email

---

## Edge Cases

**Package Session Type Mismatch:**
```
┌─────────────────────────────────┐
│ ⚠️ PACKAGE MISMATCH             │
│                                 │
│ You're booking with a trainer,  │
│ but your package only has       │
│ court-only sessions left.       │
│                                 │
│ OPTIONS:                        │
│ [Book Without Trainer] Use pkg  │
│ [Pay Full Price $125]  No pkg   │
│                                 │
└─────────────────────────────────┘
```

**Off-Peak Package, Peak Time:**
```
┌─────────────────────────────────┐
│ ⚠️ PEAK TIME RESTRICTION        │
│                                 │
│ Your package is off-peak only.  │
│ This slot is peak (Saturday).   │
│                                 │
│ OPTIONS:                        │
│ [Choose Off-Peak Time]          │
│ [Pay Regular Rate $50] No pkg   │
│                                 │
└─────────────────────────────────┘
```

**Trainer Unavailable:**
```
┌─────────────────────────────────┐
│ ⚠️ TRAINER UNAVAILABLE          │
│                                 │
│ Coach Mike is already booked    │
│ at this time.                   │
│                                 │
│ OPTIONS:                        │
│ [Book Court Only]               │
│ [Choose Different Trainer]      │
│ [Choose Different Time]         │
│                                 │
└─────────────────────────────────┘
```

---

## Foundation References

- **Database:** [database-schema.md](../foundations/database-schema.md) - bookings table
- **Auth:** [authentication.md](../foundations/authentication.md) - NEW vs PREMIUM permissions
- **Automation:** [automation-rules.md](../foundations/automation-rules.md) - Package application logic
- **UI:** [mobile-first-ui.md](../foundations/mobile-first-ui.md) - Booking component patterns

---

**Related Features:**
- [03. Booking Management](./03-booking-management.md) - Cancel, modify bookings
- [04. Package System](./04-package-system.md) - How packages work
- [05. Waitlist](./05-waitlist.md) - Join waitlist when fully booked
