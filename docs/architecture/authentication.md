# Authentication & Permissions Model

Role-based access control system for the Red Clay tennis booking platform, enforced at both database (RLS) and application layers.

---

## Overview

**Security Layers:**
1. **Database Layer:** Row Level Security (RLS) in Neon PostgreSQL
2. **API Layer:** Role validation in serverless functions
3. **UI Layer:** Conditional rendering based on permissions

**Authentication Flow:**
- Users authenticate via email/password or social auth
- JWT token contains user ID and role information
- Every API request validates token and checks permissions
- Database RLS provides final security layer

---

## User Classification

### User Types (Booking Behavior)

**NEW (`user_type = 'new'`)**
- Default for all new registrations
- Bookings require admin approval
- Status: `pending` → admin reviews → `confirmed`
- Purpose: Quality control, prevent spam/abuse

**PREMIUM (`user_type = 'premium'`)**
- Upgraded by admin after trust established
- Instant booking confirmation
- Status: Directly `confirmed` (no approval needed)
- Purpose: Reward regulars, reduce admin workload

**Upgrade Criteria:**
- Multiple successful bookings
- Payment history
- No cancellation issues
- Admin discretion

---

### App Roles (System Access)

**USER (`app_role = 'user'`)**
- Regular customer booking courts
- Default role for all accounts
- Can book courts, purchase packages, join waitlist
- Cannot access admin or trainer features

**TRAINER (`app_role = 'trainer'`)**
- Professional trainer offering sessions
- Assigned by admin
- Has user permissions + trainer dashboard
- Can view their schedule and assigned bookings
- Cannot modify other trainers' data

**ADMIN (`app_role = 'admin'`)**
- System administrator
- Full access to all features
- Can modify any data
- Manages users, courts, bookings, packages

**Multi-Role Users:**
- Users can have multiple roles (e.g., trainer + admin)
- Highest permission level applies
- UI shows role switcher if multiple roles exist

---

## Permission Matrix

### Public (Unauthenticated)
**Can:**
- View courts and trainers (read-only)
- See availability calendar
- Browse package offerings
- Access booking page (redirects to sign in)

**Cannot:**
- Create bookings
- Join waitlist
- Purchase packages
- Access any dashboard

---

### User - NEW Type
**Can:**
- Create bookings (status: `pending`)
- View own bookings
- Cancel own bookings (triggers refund/waitlist logic)
- Request booking changes (admin approves)
- Purchase packages (requires admin confirmation)
- Use active packages automatically
- Join slot-specific waitlist
- Invite friends to sessions (session sharing)
- Accept/decline session invites
- View own notifications
- Configure notification preferences
- Link Telegram account
- Interact with AI recommendations

**Cannot:**
- Get instant booking confirmation (requires approval)
- Cancel other users' bookings
- View other users' bookings
- Access trainer dashboard
- Access admin features
- Approve own booking requests
- Modify package session counts

**Booking Flow:**
1. User selects date/time/court
2. System creates booking with `status = 'pending'`
3. Admin receives notification
4. Admin reviews and approves/denies
5. User notified of decision

---

### User - PREMIUM Type
**Can:**
- Everything NEW users can do
- **Plus:** Instant booking confirmation
- Create bookings (status: `confirmed` immediately)
- Skip admin approval queue

**Cannot:**
- Same restrictions as NEW users (trainer/admin features)

**Booking Flow:**
1. User selects date/time/court
2. System creates booking with `status = 'confirmed'`
3. User receives instant confirmation
4. No admin approval needed

**Why Premium?**
- Faster booking experience
- Reduced admin workload
- Rewards for trusted users
- Incentive for good behavior

---

### Trainer
**Can:**
- Everything PREMIUM users can do
- **Plus:** Trainer-specific features
- View trainer dashboard (own schedule, sessions, bookings)
- See which bookings include them
- View own availability calendar
- Mark sessions complete (if allowed)
- Receive notifications for assigned bookings

**Cannot:**
- Modify own schedule (admin-managed)
- Cancel bookings with them (users/admin can)
- View other trainers' data
- Access admin features
- Approve bookings
- Manage package system

**Dashboard Shows:**
- Today's sessions
- Upcoming bookings (trainer assigned)
- Weekly schedule view
- Booking history
- Client notes (if enabled)

---

### Admin
**Can:**
- **Everything**, including:

**User Management:**
- View all user accounts
- Upgrade users (NEW → PREMIUM)
- Assign trainer role
- Assign admin role
- Deactivate/reactivate accounts
- View user booking history
- View user package history

**Booking Management:**
- Approve/deny pending bookings (NEW users)
- Create bookings for any user
- Modify any booking (date, time, court, trainer)
- Cancel any booking
- Mark bookings complete
- Override package matching
- Process refunds manually

**Court Management:**
- Add/edit/remove courts
- Set maintenance mode
- Adjust pricing
- Configure availability hours

**Trainer Management:**
- Add/remove trainers
- Set trainer schedules (weekly recurring)
- Adjust trainer hourly rates
- Toggle trainer availability
- Assign trainers to bookings

**Package Management:**
- Create package classes (define offerings)
- Set package pricing and session counts
- Confirm package payments
- Grant packages to users (complimentary)
- Add/remove sessions from user packages
- Extend package expiration dates
- Mark packages active/expired/cancelled

**Waitlist Management:**
- View all waitlist entries
- Manually trigger waitlist notifications
- Remove waitlist entries

**System Configuration:**
- Designate peak day overrides (holidays, tournaments)
- Configure package court eligibility
- Set system-wide pricing rules
- Manage notification templates

**Analytics & Reports:**
- Revenue reports
- Booking trends
- Package usage analytics
- User retention metrics
- Trainer utilization

**Cannot:**
- None (full access)

---

## Permission Enforcement

### Database Level (RLS Policies)

**Users Table:**
```sql
-- Users can view own profile
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

-- Admins can view all
CREATE POLICY users_select_admin ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND app_role = 'admin')
  );
```

**Bookings Table:**
```sql
-- Users see own bookings
CREATE POLICY bookings_select_own ON bookings
  FOR SELECT USING (user_id = auth.uid());

-- Trainers see assigned bookings
CREATE POLICY bookings_select_trainer ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trainers
      WHERE user_id = auth.uid() AND id = bookings.trainer_id
    )
  );

-- Admins see all
CREATE POLICY bookings_select_admin ON bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND app_role = 'admin')
  );
```

**Packages Table:**
```sql
-- Users see own packages
CREATE POLICY user_packages_select_own ON user_packages
  FOR SELECT USING (user_id = auth.uid());

-- Admins see and modify all
CREATE POLICY user_packages_all_admin ON user_packages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND app_role = 'admin')
  );
```

### API Level (Function Validation)

**Before any operation:**
1. Extract user ID from JWT token
2. Query user's `user_type` and `app_role`
3. Check permission matrix
4. Proceed or return 403 Forbidden

**Example: Create Booking**
```typescript
async function createBooking(userId, bookingData) {
  const user = await getUser(userId);

  // Check authenticated
  if (!user) {
    return {error: "Unauthorized", status: 401};
  }

  // Check if banned/inactive
  if (!user.is_active) {
    return {error: "Account inactive", status: 403};
  }

  // Determine booking status based on user type
  const status = (user.user_type === 'premium' || user.app_role === 'admin')
    ? 'confirmed'
    : 'pending';

  // Create booking with appropriate status
  const booking = await db.bookings.create({
    ...bookingData,
    user_id: userId,
    status: status
  });

  // Trigger notifications based on status
  if (status === 'pending') {
    await notifyAdmins('booking_pending', booking);
  } else {
    await notifyUser('booking_confirmed', booking);
  }

  return {booking, status: 200};
}
```

**Example: Approve Booking (Admin Only)**
```typescript
async function approveBooking(userId, bookingId) {
  const user = await getUser(userId);

  // Check admin role
  if (user.app_role !== 'admin') {
    return {error: "Admin access required", status: 403};
  }

  // Proceed with approval
  const booking = await db.bookings.update(bookingId, {
    status: 'confirmed',
    confirmed_at: new Date(),
    confirmed_by: userId
  });

  // Notify booking owner
  await notifyUser('booking_approved', booking);

  return {booking, status: 200};
}
```

### UI Level (Conditional Rendering)

**React Example:**
```jsx
function DashboardNav({user}) {
  return (
    <nav>
      <NavLink to="/dashboard">My Bookings</NavLink>
      <NavLink to="/packages">Packages</NavLink>

      {/* Trainer-only link */}
      {(user.app_role === 'trainer' || user.app_role === 'admin') && (
        <NavLink to="/trainer-dashboard">Trainer Portal</NavLink>
      )}

      {/* Admin-only link */}
      {user.app_role === 'admin' && (
        <NavLink to="/admin">Admin Panel</NavLink>
      )}
    </nav>
  );
}

function BookingCard({booking, user}) {
  const canCancel = (
    booking.user_id === user.id ||  // Own booking
    user.app_role === 'admin'        // Or admin
  ) && booking.status !== 'cancelled';

  const showApproveButton = (
    user.app_role === 'admin' &&
    booking.status === 'pending'
  );

  return (
    <div className="booking-card">
      <h3>{booking.court_name}</h3>
      <p>{booking.date} at {booking.start_time}</p>
      <span className={`status-${booking.status}`}>
        {booking.status}
      </span>

      {canCancel && (
        <button onClick={() => cancelBooking(booking.id)}>
          Cancel Booking
        </button>
      )}

      {showApproveButton && (
        <button onClick={() => approveBooking(booking.id)}>
          Approve
        </button>
      )}
    </div>
  );
}
```

---

## Status Transitions

### Booking Statuses

```
NEW USER FLOW:
pending → confirmed (admin approves)
pending → cancelled (user cancels OR admin denies)
confirmed → completed (session finishes)
confirmed → cancelled (user/admin cancels)

PREMIUM USER FLOW:
confirmed (instant) → completed
confirmed → cancelled

ADMIN FLOW:
Any status → Any status (full control)
```

**Status Definitions:**
- `pending`: Awaiting admin approval
- `confirmed`: Booking active and confirmed
- `completed`: Session finished successfully
- `cancelled`: Booking cancelled (refund processed)
- `no_show`: User didn't attend (admin marks)

### Package Statuses

```
requested → active (admin confirms payment)
requested → cancelled (payment not received)
active → depleted (all sessions used)
active → expired (validity period passed)
active → cancelled (admin cancels)
```

**Status Definitions:**
- `requested`: User requested, awaiting payment confirmation
- `active`: Package confirmed, sessions available
- `depleted`: All sessions used (0 remaining)
- `expired`: Past expiration date
- `cancelled`: Admin cancelled (refund issued)

---

## Access Control Checklist

**For Every Protected Action:**
1. ✅ Is user authenticated? (Valid JWT)
2. ✅ Is user active? (`is_active = true`)
3. ✅ Does user have required role? (Check `app_role`)
4. ✅ Does user have required user type? (Check `user_type` if relevant)
5. ✅ Is user accessing own data? (Or admin accessing any data)
6. ✅ Database RLS enforces final check

**For Every UI Element:**
1. ✅ Should this be visible to current user?
2. ✅ Should this be enabled or disabled?
3. ✅ What happens if user manipulates client-side code? (Server validates anyway)

---

## Special Cases

### Trainer Who Is Also Admin
- Can access both trainer dashboard AND admin panel
- UI shows role switcher
- Booking flow uses admin permissions (instant confirm)
- Can manage own schedule (admin permission)

### User Upgrading from NEW to PREMIUM
- Future bookings: Instant confirmation
- Past pending bookings: Remain pending until approved
- No retroactive status changes
- User notified of upgrade

### Admin Creating Booking for User
- Can set any status directly
- Can override package matching
- Can assign any court/trainer
- Can waive fees (set to $0)

### Trainer Viewing Own Booking
- Sees booking as trainer (assigned sessions)
- Also sees booking as user (if they created it)
- UI clearly indicates role context

---

## Role Assignment Flow

### Making a User PREMIUM
1. Admin navigates to user management
2. Selects user profile
3. Clicks "Upgrade to Premium"
4. System updates `user_type = 'premium'`
5. User receives notification
6. Future bookings instant-confirm

### Making a User TRAINER
1. Admin creates trainer profile (links to user account)
2. Sets trainer schedule (weekly recurring)
3. Sets hourly rate
4. Activates trainer (`is_active = true`)
5. Trainer receives access to trainer dashboard
6. Appears in booking flow trainer selection

### Making a User ADMIN
1. Admin updates user's `app_role = 'admin'`
2. User immediately gains admin access
3. Dangerous: Should require confirmation
4. Audit log records change

---

## Security Best Practices

### JWT Token Contents
```json
{
  "sub": "user-uuid-here",
  "email": "user@example.com",
  "user_type": "premium",
  "app_role": "user",
  "exp": 1737849600
}
```

**Do NOT include:**
- Password hashes
- Payment information
- Personal notes
- Excessive user data (tokens should be small)

### Password Requirements
- Minimum 8 characters
- At least one number or special character
- Not in common password list
- Hashed with bcrypt (cost factor 12+)

### Session Management
- JWT expiration: 7 days
- Refresh token: 30 days
- Logout: Invalidate refresh token
- Password change: Invalidate all sessions

### Rate Limiting
- Login attempts: 5 per 15 minutes per email
- Booking creation: 10 per hour per user
- API calls: 100 per minute per user
- Admin actions: No limit (trusted)

---

**Next:** See [Automation Rules](./automation-rules.md) for cross-linking logic that triggers based on these permissions.
