# Automation & Cross-Linking Rules

Comprehensive automation logic that connects all systems and triggers automatic workflows across the Red Clay platform.

**Philosophy:** Automate everything possible. User actions should cascade through the system without manual intervention.

---

## Overview

**Automation Layers:**
1. **Database Triggers:** Automatic data updates on INSERT/UPDATE/DELETE
2. **Event Handlers:** Background jobs triggered by state changes
3. **Scheduled Jobs:** Time-based automation (expirations, reminders)
4. **Real-Time Sync:** Live updates across users and channels

---

## Core Automation Rules

### 1. Booking Creation Automation

**When:** User creates a booking

**Automatic Actions:**

**A. Package Detection & Application**
```
1. Query user_packages WHERE:
   - user_id = booking.user_id
   - status IN ('active', 'requested')
   - sport_type = booking.court.sport_type
   - remaining sessions > 0
   - NOT expired

2. Check session type match:
   - If booking has trainer → need trainer_sessions > 0
   - If court-only → need court_only_sessions > 0

3. Check peak/off-peak compliance:
   - Calculate is_peak_time(booking_date, start_time)
   - If package.peak_off_peak = 'off_peak_only' AND is_peak = true → REJECT
   - If package.peak_off_peak = 'anytime' → ALLOW

4. Check court eligibility:
   - EXISTS in package_courts linking package to booking.court_id

5. If ALL checks pass:
   - Set booking.package_id = matched_package.id
   - Set booking.court_fee = 0
   - Set booking.trainer_fee = 0 (if trainer session)
   - Deduct session:
     IF trainer booking THEN remaining_trainer_sessions -= 1
     ELSE remaining_court_only_sessions -= 1
   - Update package.last_used_at = now()

6. If package becomes depleted (remaining = 0):
   - Update package.status = 'depleted'
   - Notify user: "Package depleted"

7. If no package matches:
   - Set booking.court_fee = court.hourly_rate
   - Set booking.trainer_fee = trainer.hourly_rate (if applicable)
```

**B. Status Assignment**
```
1. Check user.user_type:
   - If 'premium' OR user.app_role = 'admin':
     → status = 'confirmed'
   - If 'new':
     → status = 'pending'

2. Record metadata:
   - booking.is_peak_time = is_peak_time(date, start_time)
   - booking.calculated_at_booking = now()
```

**C. Waitlist Processing**
```
1. If booking.status = 'confirmed':
   - This slot is NO LONGER available
   - Cancel any waitlist entries for this exact slot:
     UPDATE waitlists SET status = 'fulfilled'
     WHERE desired_date = booking.date
       AND desired_start_time = booking.start_time
       AND sport_type = booking.court.sport_type
       AND status = 'active'
```

**D. Notifications**
```
1. If status = 'confirmed':
   - Send to user: "Booking confirmed"
     Channels: in-app, email, telegram (if linked)
     Include: Court name, date, time, fees, package usage

2. If status = 'pending':
   - Send to user: "Booking pending admin approval"
   - Send to all admins: "New booking requires approval"
     Include: User name, court, date, time, fees

3. If trainer assigned:
   - Send to trainer: "New session assigned"
     Include: Client name, date, time, court
```

**E. Calendar Integration (Future)**
```
- Generate .ics file
- Send as email attachment
- Provide "Add to Google/Apple Calendar" link
```

---

### 2. Booking Cancellation Automation

**When:** User or admin cancels a booking

**Automatic Actions:**

**A. Timing Check**
```
1. Calculate hours_until_booking:
   hours_until = (booking.date + booking.start_time) - now()

2. Determine refund policy:
   - If hours_until >= 24:
     → Auto-refund eligible
   - If hours_until < 24:
     → Requires admin review
     → Set booking.admin_review_required = true
```

**B. Package Refund (If Applicable)**
```
1. If booking.package_id IS NOT NULL:

   A. If hours_until >= 24 (auto-refund):
      - Return session to package:
        IF booking.package_session_type = 'trainer_included':
          → user_packages.remaining_trainer_sessions += 1
        ELSE:
          → user_packages.remaining_court_only_sessions += 1

      - Update package status if was depleted:
        IF package.status = 'depleted' AND remaining_sessions > 0:
          → package.status = 'active'

      - Set booking.package_refunded = true
      - Notify user: "Package session refunded"

   B. If hours_until < 24 (admin review):
      - Set booking.admin_review_required = true
      - Notify admins: "Cancellation requires review"
      - Admin decides: refund or forfeit session
```

**C. Waitlist Notification**
```
1. Find matching waitlist entries:
   SELECT * FROM waitlists
   WHERE desired_date = booking.date
     AND desired_start_time = booking.start_time
     AND sport_type = booking.court.sport_type
     AND status = 'active'
   ORDER BY created_at ASC  -- First-come-first-served

2. Notify ALL matching users:
   - "Slot available: [court] on [date] at [time]"
   - "Book now before it's taken"
   - Channels: in-app, email, telegram
   - Set waitlist.notified_at = now()
   - Set waitlist.status = 'notified'

3. First user to book gets the slot
   - Other notified users see "No longer available" when they try
```

**D. Update Booking Status**
```
- Set booking.status = 'cancelled'
- Set booking.cancelled_at = now()
- Record booking.cancellation_reason (from user input)
```

**E. Notifications**
```
1. Send to user: "Booking cancelled"
   - Include refund status
   - If package: show updated session count

2. If trainer was assigned:
   - Send to trainer: "Session cancelled"
   - Free up trainer's time slot

3. If admin initiated cancellation:
   - Send to user: "Admin cancelled your booking"
   - Include reason from admin
```

---

### 3. Package Purchase Automation

**When:** User requests a package

**Automatic Actions:**

**A. Create Package Record**
```
1. INSERT INTO user_packages:
   - user_id = current_user
   - package_class_id = selected_package
   - status = 'requested'
   - total_court_only_sessions = package_class.court_only_sessions
   - remaining_court_only_sessions = package_class.court_only_sessions
   - total_trainer_sessions = package_class.trainer_sessions
   - remaining_trainer_sessions = package_class.trainer_sessions
   - price_paid = package_class.price
   - requested_at = now()
   - expires_at = now() + package_class.validity_days
```

**B. Notifications**
```
1. Send to user: "Package requested"
   - Payment instructions: "Pay $X cash at facility"
   - What happens next: "Admin will confirm after payment"

2. Send to all admins: "New package request"
   - User name, package type, amount
   - Link to confirm payment
```

---

### 4. Package Payment Confirmation Automation

**When:** Admin confirms package payment

**Automatic Actions:**

**A. Activate Package**
```
1. UPDATE user_packages:
   - status = 'active'
   - payment_received = true
   - confirmed_at = now()
   - confirmed_by = admin_user_id
```

**B. Retroactive Booking Updates**
```
1. Find unconfirmed bookings that used this package:
   SELECT * FROM bookings
   WHERE package_id = confirmed_package_id
     AND status = 'pending'
     AND package_refunded = false

2. For each booking:
   - Check if should auto-confirm (if user is now premium or admin confirms)
   - Update fees if package now covers costs
```

**C. Notifications**
```
1. Send to user: "Package activated!"
   - Session breakdown
   - Valid until date
   - How to use: "Automatically applied when booking"

2. In-app badge: Show "NEW PACKAGE" on dashboard
```

---

### 5. Package Expiration Automation

**When:** Scheduled job runs daily

**Automatic Actions:**

**A. Detect Expired Packages**
```
1. Find packages past expiration:
   SELECT * FROM user_packages
   WHERE status = 'active'
     AND expires_at < now()

2. For each expired package:
   - UPDATE status = 'expired'
   - Record remaining sessions (for reporting)
   - Notify user
```

**B. Expiration Warnings**
```
1. Find packages expiring soon:
   SELECT * FROM user_packages
   WHERE status = 'active'
     AND expires_at BETWEEN now() AND now() + INTERVAL '7 days'
     AND (last_warned_at IS NULL OR last_warned_at < now() - INTERVAL '2 days')

2. For each package:
   - Send reminder: "Package expiring in X days"
   - Show remaining sessions
   - Encourage booking
   - Update last_warned_at = now()
```

**C. Notifications**
```
1. Expiration warning (7 days before):
   - "Your package expires on [date]"
   - "You have X sessions left"
   - "Book now to use them"

2. Expiration notice (day of):
   - "Your package has expired"
   - "X sessions remaining" (unused)
   - "Contact admin for extension"
```

---

### 6. Waitlist Automation

**When:** User joins waitlist

**Automatic Actions:**

**A. Check Immediate Availability**
```
1. Query current availability:
   - Is desired slot currently available?
   - If YES: Don't add to waitlist, prompt to book now

2. If NO (slot full):
   - INSERT waitlist entry
   - status = 'active'
   - Set expires_at = desired_date (auto-expire after slot passes)
```

**B. Notifications**
```
1. Send to user: "Added to waitlist"
   - Slot details
   - "We'll notify you if it opens up"
   - First-come-first-served reminder
```

---

### 7. Trainer Schedule Changes Automation

**When:** Admin updates trainer_schedules

**Automatic Actions:**

**A. Conflict Detection**
```
1. Find bookings that conflict with new schedule:
   - Trainer now unavailable on days they're booked
   - Trainer hours changed (booking outside new hours)

2. For each conflicting booking:
   - Flag for admin review
   - Suggest: Cancel or reassign trainer
   - Notify affected users
```

**B. Availability Recalculation**
```
1. Update frontend calendar cache
2. Regenerate availability grids
3. Show trainer as unavailable on removed days
```

---

### 8. Session Sharing (Invites) Automation

**When:** User invites friend to booking

**Automatic Actions:**

**A. Create Invite**
```
1. INSERT INTO booking_invites:
   - booking_id = shared_booking
   - invited_by = current_user
   - invited_email OR invited_user_id
   - status = 'pending'
   - expires_at = booking.date + booking.start_time
```

**B. Notifications**
```
1. If invited_user_id (registered user):
   - In-app notification: "[Name] invited you to join [court] on [date]"
   - Include [Accept] [Decline] buttons
   - Email notification with same

2. If invited_email (not registered):
   - Email: "You're invited to play at Red Clay!"
   - Include signup link
   - "Create account to accept invite"
   - Invite held for 7 days
```

**C. Invite Acceptance**
```
1. When user accepts:
   - Create secondary booking record:
     is_primary_booking = false
     primary_booking_id = original_booking
     user_id = invited_user
     court_fee = 0 (primary user pays)
     status = primary_booking.status

2. Update invite:
   - status = 'accepted'
   - responded_at = now()

3. Notify primary user:
   - "[Name] accepted your invite"

4. Add to both users' dashboards:
   - Show "Shared session" badge
   - Display all participants
```

**D. Invite Decline/Expiration**
```
1. If user declines:
   - Update invite.status = 'declined'
   - Notify primary user: "[Name] declined"

2. If invite expires (booking time passes):
   - Auto-update status = 'expired'
   - Clean up pending invites
```

---

### 9. Multi-Channel Notification Sync

**When:** Any notification is created

**Automatic Actions:**

**A. Determine Channels**
```
1. Check user notification preferences:
   - in_app: Always enabled
   - email: Check user.preferences.email_notifications
   - sms: Check user.preferences.sms_notifications (if enabled)
   - telegram: Check if telegram_users.is_active

2. Check notification type priority:
   - Urgent (booking cancelled <24h): ALL channels
   - High (booking confirmed, waitlist available): In-app + Email + Telegram
   - Medium (package expiring soon): In-app + Email
   - Low (general updates): In-app only
```

**B. Send Via Channels**
```
1. In-App:
   - INSERT into notifications table
   - Push via WebSocket to connected clients
   - Show badge count on UI

2. Email:
   - Queue email job
   - Use template matching notification type
   - Track opens/clicks (if analytics enabled)

3. Telegram (if linked):
   - Send via Telegram Bot API
   - Format message for Telegram
   - Include inline action buttons where applicable

4. SMS (if enabled):
   - Queue SMS via provider (Twilio, etc.)
   - Keep message concise (160 chars)
   - Include link for details
```

**C. Mark as Sent**
```
1. Update notification record:
   - sent = true
   - sent_at = now()
   - channels_used = ['in_app', 'email', 'telegram']
```

**D. Real-Time Updates**
```
1. Web app users:
   - Push notification via WebSocket
   - Update UI instantly (toast, badge)

2. Mobile app users (future):
   - Push notification via FCM/APNS
   - Deep link to relevant screen

3. Telegram users:
   - Bot message appears immediately
   - Can reply to interact
```

---

### 10. AI Recommendations Automation

**When:** Scheduled job (daily at 6 AM) OR user triggers

**Automatic Actions:**

**A. Generate Recommendations**
```
1. For each user, analyze:
   - Booking history (frequency, times, courts, trainers)
   - Package usage patterns
   - Preferred days/times (clustering)
   - Trainer preferences

2. Generate recommendations:
   - Optimal booking times (based on history + availability)
   - Package suggestions (if nearing expiration or heavy user)
   - Trainer matches (based on ratings + compatibility)
   - Off-peak savings opportunities

3. INSERT INTO ai_recommendations:
   - user_id, type, title, description, reasoning
   - suggested_* fields (court, trainer, package, time)
   - expires_at = now() + 7 days
```

**B. Notifications**
```
1. Send to user: "Personalized recommendation"
   - Show top recommendation
   - Include AI reasoning
   - [View Details] [Accept] [Dismiss] buttons
```

**C. User Interaction**
```
1. If user accepts:
   - Pre-fill booking form with suggested data
   - Track acceptance (improve model)
   - Update recommendation.status = 'accepted'

2. If user rejects:
   - Update recommendation.status = 'rejected'
   - Optionally collect feedback
   - Improve future recommendations
```

---

### 11. Telegram Bot Sync Automation

**When:** User interacts via Telegram bot

**Automatic Actions:**

**A. Account Linking**
```
1. User sends /start to bot
2. Bot generates unique link code
3. User clicks link → opens web app
4. Web app verifies code and links:
   INSERT INTO telegram_users (user_id, telegram_id)
5. Bot confirms: "Account linked!"
```

**B. Booking via Telegram**
```
1. User: "Book tennis court tomorrow at 2pm"
2. Bot uses NLP/AI to parse:
   - Sport: tennis
   - Date: tomorrow
   - Time: 2pm (14:00)
3. Bot queries availability
4. Bot shows options with inline buttons
5. User selects → creates booking (same automation as web)
6. Confirmation sent via Telegram
```

**C. Notification Mirroring**
```
1. All in-app notifications also sent to Telegram (if linked)
2. Telegram messages can trigger actions:
   - "Approve booking #123" → Calls API
   - "Cancel booking #456" → Calls API
3. Responses sync back to web app
```

---

### 12. Analytics & Reporting Automation

**When:** Scheduled jobs (nightly) OR admin requests

**Automatic Actions:**

**A. Revenue Tracking**
```
1. Daily calculation:
   - Bookings revenue (court + trainer fees)
   - Package revenue (confirmed packages)
   - Cancellation refunds (subtract)

2. Store in analytics table for reporting
```

**B. User Engagement Metrics**
```
1. Track per user:
   - Total bookings
   - Average booking frequency
   - Package purchase rate
   - Cancellation rate
   - No-show rate

2. Flag users for:
   - Premium upgrade (good behavior)
   - Account review (high cancellation rate)
```

**C. Utilization Reports**
```
1. Calculate per court:
   - Booking percentage (booked hours / available hours)
   - Peak vs off-peak usage
   - Revenue per court

2. Calculate per trainer:
   - Utilization rate
   - Average rating
   - Revenue generated
```

---

## Database Triggers (Automatic)

### Trigger: Update Package Status on Session Change
```sql
CREATE TRIGGER auto_update_package_status
AFTER UPDATE ON user_packages
FOR EACH ROW
WHEN (NEW.remaining_court_only_sessions = 0 AND NEW.remaining_trainer_sessions = 0)
EXECUTE FUNCTION set_package_depleted();

-- Function
CREATE FUNCTION set_package_depleted() RETURNS TRIGGER AS $$
BEGIN
  NEW.status = 'depleted';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Trigger: Auto-Expire Waitlists
```sql
CREATE TRIGGER auto_expire_waitlists
BEFORE UPDATE ON waitlists
FOR EACH ROW
WHEN (NEW.desired_date < CURRENT_DATE AND NEW.status = 'active')
EXECUTE FUNCTION expire_waitlist();

-- Function
CREATE FUNCTION expire_waitlist() RETURNS TRIGGER AS $$
BEGIN
  NEW.status = 'expired';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Trigger: Timestamp Updates
```sql
CREATE TRIGGER update_booking_timestamp
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Applies to all tables with updated_at column
```

---

## Scheduled Jobs (Cron/Serverless)

### Daily Jobs (Run at 6 AM)
```
1. Expire old packages (check expires_at < now())
2. Expire old waitlists (check desired_date < today())
3. Send package expiration warnings (7 days before)
4. Generate AI recommendations
5. Clean up old notifications (delete read notifications > 30 days)
6. Calculate and store analytics metrics
```

### Hourly Jobs
```
1. Process pending payment confirmations
2. Send booking reminders (2 hours before start time)
3. Check for no-shows (10 minutes after start time)
```

### Real-Time Jobs (Event-Driven)
```
1. On booking created → All automation from Rule #1
2. On booking cancelled → All automation from Rule #2
3. On package confirmed → All automation from Rule #4
4. On notification created → Send via channels (Rule #9)
```

---

## Cross-Linking Summary

**When a booking is created, these systems interact automatically:**
1. ✅ Package system (detect, apply, deduct session)
2. ✅ Waitlist system (cancel fulfilled entries)
3. ✅ Notification system (user, admins, trainer)
4. ✅ Calendar integration (future)
5. ✅ Analytics tracking

**When a booking is cancelled, these systems interact automatically:**
1. ✅ Package system (refund session if eligible)
2. ✅ Waitlist system (notify all waiting users)
3. ✅ Notification system (user, trainer, waitlist)
4. ✅ Admin review queue (if <24h cancellation)
5. ✅ Analytics tracking (cancellation metrics)

**When a package is purchased:**
1. ✅ User notification
2. ✅ Admin notification
3. ✅ Dashboard updates

**When a package is confirmed:**
1. ✅ Activate package
2. ✅ Update related bookings
3. ✅ Notify user
4. ✅ Dashboard badge

**When a waitlist opens:**
1. ✅ Notify ALL waiting users
2. ✅ Mark waitlist as notified
3. ✅ First to book wins

---

## Implementation Notes

**Use Event-Driven Architecture:**
- Emit events: `booking.created`, `booking.cancelled`, `package.confirmed`
- Event handlers run automation asynchronously
- Prevents blocking user requests
- Allows retries on failure

**Use Database Transactions:**
- Package deduction + booking creation = atomic
- Prevents race conditions
- Roll back on errors

**Use Idempotency:**
- Same action triggered twice = same result
- Use idempotency keys for critical operations
- Prevent duplicate charges/notifications

**Monitor Automation:**
- Log all automated actions
- Alert on failures (notification not sent, package not deducted)
- Provide admin override for all automation

---

**Next:** See feature implementation guides in [features/](../features/) for how these automation rules apply to specific user flows.
