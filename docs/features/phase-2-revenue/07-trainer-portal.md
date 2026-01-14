# Feature 07: Trainer Portal

Dashboard for trainers to view their schedule and assigned bookings.

---

## Trainer Dashboard

**Mobile UI:**
```
┌─────────────────────────────────┐
│ ☰   Trainer Portal    🔔 👤    │
├─────────────────────────────────┤
│ TODAY'S SESSIONS                │
│ Tuesday, January 14, 2026       │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 10:00 AM - 11:00 AM         │ │
│ │ ✅ John Doe                 │ │
│ │ Tennis Court 1              │ │
│ │ [View Details →]            │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 2:00 PM - 3:00 PM           │ │
│ │ ✅ Sarah Smith              │ │
│ │ Tennis Court 2              │ │
│ │ [View Details →]            │ │
│ └─────────────────────────────┘ │
│                                 │
│ UPCOMING THIS WEEK (8)          │
│ [View Schedule →]               │
│                                 │
│ MY STATS                        │
│ Sessions this week: 12          │
│ Average rating: ⭐ 4.8          │
│ Earnings this month: $1,200     │
│                                 │
└─────────────────────────────────┘
```

---

## Weekly Schedule View

**Mobile UI:**
```
┌─────────────────────────────────┐
│ ← Back   My Schedule             │
├─────────────────────────────────┤
│  < Week of Jan 13-19, 2026 >    │
│                                 │
│ MONDAY, JAN 13                  │
│ 9 AM - 5 PM (Available)         │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 10 AM | John D. | Court 1  │ │
│ │ 2 PM  | Sarah S. | Court 2 │ │
│ └─────────────────────────────┘ │
│                                 │
│ TUESDAY, JAN 14                 │
│ 9 AM - 5 PM (Available)         │
│ [Sessions listed...]            │
│                                 │
│ WEDNESDAY, JAN 15               │
│ 🚫 Not Scheduled (Day off)      │
│                                 │
└─────────────────────────────────┘
```

---

## Permissions

**Trainers can:**
- ✅ View their own schedule
- ✅ View bookings assigned to them
- ✅ See client names and contact info
- ✅ Mark sessions complete (if enabled)

**Trainers cannot:**
- ❌ Modify their schedule (admin-only)
- ❌ Cancel bookings (users/admin can)
- ❌ View other trainers' data
- ❌ Create bookings for clients

---

## Notifications

**Trainers receive:**
- New session assigned
- Session cancelled
- Schedule changed by admin

---

## Foundation References

- **Database:** [database-schema.md](../foundations/database-schema.md) - trainers, trainer_schedules tables
- **Auth:** [authentication.md](../foundations/authentication.md) - Trainer permissions
