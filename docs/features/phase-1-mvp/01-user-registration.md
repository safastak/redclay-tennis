# Feature 01: User Registration & Profile Setup

Complete user journey from first visit to registered account with preferences configured.

**User Personas:** Anyone discovering the platform
**Platforms:** Mobile web (primary), Desktop web (secondary)

---

## Overview

New users create an account, are automatically assigned default settings, and can optionally complete their profile. The system creates all necessary records and applies default permissions.

**Key Principles:**
- Mobile-first signup flow (minimal fields, large touch targets)
- Auto-create related records (no manual setup needed)
- Default to safe permissions (new user type)
- Progressive profile completion (not required immediately)

---

## User Story: New User Signup

### Step 1: User Discovers Platform

**What happens:**
- User visits the website (likely via Google, referral, or social media)
- Lands on homepage or booking page
- Sees courts, trainers, and availability (public read access)
- Attempts to book → redirected to sign-up page

**Mobile UI:**
```
┌─────────────────────────────────┐
│ [☰ Menu]  Red Clay  [Sign In]  │ ← Top bar
├─────────────────────────────────┤
│                                 │
│   🎾 Book Tennis & Pickleball   │
│      Courts Instantly           │
│                                 │
│   [Browse Courts] ──────────────│ ← Full width buttons
│   [View Schedule] ──────────────│
│   [Book Now] ───────────────────│
│                                 │
│ ✓ Premium courts & trainers     │
│ ✓ Flexible packages available   │
│ ✓ Easy online booking           │
│                                 │
└─────────────────────────────────┘
```

**Triggers when user taps "Book Now" without account:**
- Redirect to `/auth/signup`
- Preserve intended action (return to booking after signup)

---

### Step 2: Signup Form

**What the user sees:**

**Mobile View:**
```
┌─────────────────────────────────┐
│ ← Back    Create Account        │
├─────────────────────────────────┤
│                                 │
│ Email Address                   │
│ ┌─────────────────────────────┐ │
│ │ you@example.com             │ │ ← 56px height
│ └─────────────────────────────┘ │
│                                 │
│ Password                        │
│ ┌─────────────────────────────┐ │
│ │ ••••••••                    │ │
│ └─────────────────────────────┘ │
│ At least 8 characters           │
│                                 │
│ Full Name (Optional)            │
│ ┌─────────────────────────────┐ │
│ │ John Doe                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ Phone (Optional)                │
│ ┌─────────────────────────────┐ │
│ │ +1 234 567 8900             │ │
│ └─────────────────────────────┘ │
│ For booking confirmations       │
│                                 │
│ ☑ I agree to Terms & Privacy   │
│                                 │
│ [Create Account] ───────────────│ ← 56px sticky bottom
│                                 │
│ Already have an account?        │
│ [Sign In]                       │
│                                 │
└─────────────────────────────────┘
```

**Field Requirements:**
- **Email:** Required, must be valid format, unique
- **Password:** Required, minimum 8 characters
- **Full Name:** Optional (can add later)
- **Phone:** Optional (recommended for Telegram integration)
- **Terms Checkbox:** Required to submit

**Validation:**
- Inline validation after blur (red border + error text)
- Submit button disabled until valid
- Helpful error messages ("Email already in use - try signing in instead")

**Social Auth Options (Future):**
- "Continue with Google"
- "Continue with Apple"
- Same auto-creation flow applies

---

### Step 3: Account Creation (What Happens Automatically)

**When user taps "Create Account":**

**Backend Actions:**
1. Validate email uniqueness
2. Hash password securely (bcrypt, cost 12)
3. Create user account in `users` table
4. Generate JWT token (7 day expiration)
5. **Automatically create related records** (see Automation below)
6. Send welcome email
7. Return JWT to client
8. Redirect to dashboard

**Automation Triggered:**
- **Database trigger** `on_user_created` runs automatically
- Creates `user` record with defaults:
  - `user_type = 'new'` (requires booking approval)
  - `app_role = 'user'` (regular customer)
  - `is_active = true`
  - `profile_image_url = null` (default avatar shown in UI)
  - `preferences = {}` (defaults applied)

**Notification Sent:**
- Welcome email:
  - "Welcome to Red Clay!"
  - "Next steps: Browse courts and book your first session"
  - Link to booking page
  - Link to profile setup

**What the user doesn't see:**
- Complex database operations
- Default permission assignment
- Preference initialization
- Email queue processing

---

### Step 4: First Dashboard View

**What the user sees after signup:**

**Mobile Dashboard:**
```
┌─────────────────────────────────┐
│ ☰    Welcome, John!    🔔 👤   │
├─────────────────────────────────┤
│                                 │
│ 👋 Welcome to Red Clay          │
│                                 │
│ You're all set! Here's what     │
│ you can do:                     │
│                                 │
│ [Book Your First Court] ────────│ ← Primary CTA
│                                 │
│ [Complete Your Profile] ────────│ ← Secondary
│                                 │
├─────────────────────────────────┤
│ 📅 MY BOOKINGS                  │
│                                 │
│       📭                        │
│   No bookings yet               │
│   Book your first court to      │
│   get started                   │
│                                 │
│   [Book a Court] ───────────────│
│                                 │
├─────────────────────────────────┤
│ 💼 MY PACKAGES                  │
│                                 │
│       📦                        │
│   No packages yet               │
│   Save money with prepaid       │
│   packages                      │
│                                 │
│   [Browse Packages] ────────────│
│                                 │
└─────────────────────────────────┘
│ [🏠] [📅] [💼] [👤]            │ ← Bottom nav
└─────────────────────────────────┘
```

**Key Elements:**
- Welcome message with user's name
- Clear empty states (not intimidating, encouraging)
- Primary action: Book a court (what they came to do)
- Secondary action: Complete profile (optional, not blocking)
- Bottom navigation always visible (Home, Book, Packages, Profile)

**User Status Indicator:**
- Small badge on profile icon: "NEW" (orange)
- Tooltip: "New users - bookings require admin approval"

---

### Step 5: Optional Profile Completion

**User taps "Complete Your Profile" or profile icon:**

**Mobile Profile Screen:**
```
┌─────────────────────────────────┐
│ ← Back       Profile             │
├─────────────────────────────────┤
│                                 │
│        ┌───────┐                │
│        │  👤   │  [Upload]      │ ← Profile photo
│        └───────┘                │
│                                 │
│ ACCOUNT INFO                    │
│                                 │
│ Full Name                       │
│ ┌─────────────────────────────┐ │
│ │ John Doe                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ Email                           │
│ ┌─────────────────────────────┐ │
│ │ john@example.com (verified) │ │
│ └─────────────────────────────┘ │
│                                 │
│ Phone Number                    │
│ ┌─────────────────────────────┐ │
│ │ +1 234 567 8900             │ │
│ └─────────────────────────────┘ │
│                                 │
│ PREFERENCES                     │
│                                 │
│ Notifications >                 │
│ AI Recommendations >            │
│ Privacy Settings >              │
│                                 │
│ ACCOUNT                         │
│                                 │
│ Change Password >               │
│ Link Telegram Account >         │
│ Delete Account                  │
│                                 │
│ [Save Changes] ─────────────────│
│                                 │
└─────────────────────────────────┘
```

**Profile Photo Upload:**
- Tap placeholder → opens camera/photo library (mobile)
- Accepts: JPG, PNG, max 5MB
- Auto-crops to square
- Uploads to file storage (Vercel Blob)
- Updates `profile_image_url` in database
- Shows thumbnail immediately (optimistic UI)

**Notification Preferences:**
```
┌─────────────────────────────────┐
│ ← Back   Notification Settings  │
├─────────────────────────────────┤
│                                 │
│ CHANNELS                        │
│                                 │
│ In-App Notifications            │
│ ────────────────────────── ✓ ON │
│ Always enabled                  │
│                                 │
│ Email Notifications             │
│ ────────────────────────── ✓ ON │
│ Booking updates, reminders      │
│                                 │
│ SMS Notifications               │
│ ────────────────────────── ☐ OFF│
│ Urgent alerts only (future)     │
│                                 │
│ Telegram Notifications          │
│ ────────────────────────── ☐ OFF│
│ [Link Telegram Account]         │
│                                 │
│ QUIET HOURS                     │
│                                 │
│ No notifications between:       │
│ 10:00 PM - 8:00 AM              │
│ ────────────────────────── ☐ OFF│
│                                 │
│ PREFERENCES                     │
│                                 │
│ ☑ Booking confirmations         │
│ ☑ Cancellation alerts           │
│ ☑ Waitlist notifications        │
│ ☑ Package reminders             │
│ ☐ Marketing emails              │
│                                 │
│ [Save] ─────────────────────────│
│                                 │
└─────────────────────────────────┘
```

**AI Recommendation Settings:**
```
┌─────────────────────────────────┐
│ ← Back   AI Settings             │
├─────────────────────────────────┤
│                                 │
│ AI-POWERED FEATURES             │
│                                 │
│ Personalized Recommendations    │
│ ────────────────────────── ✓ ON │
│ Get booking suggestions based   │
│ on your preferences             │
│                                 │
│ Proactive Suggestions           │
│ ────────────────────────── ✓ ON │
│ Auto-suggest optimal times      │
│                                 │
│ Learning from Behavior          │
│ ────────────────────────── ✓ ON │
│ Improve recommendations over    │
│ time based on your bookings     │
│                                 │
│ [Save] ─────────────────────────│
│                                 │
└─────────────────────────────────┘
```

**All changes auto-save or require explicit "Save" button:**
- Toggles: Auto-save immediately (optimistic UI)
- Text fields: Save button required
- Success toast: "Settings saved"

---

## Edge Cases & Scenarios

### Scenario A: Email Already Registered

**What happens:**
1. User enters email that already exists
2. On submit, backend returns error
3. Form shows error: "This email is already registered"
4. Action buttons appear: [Sign In Instead] [Reset Password]
5. Tapping "Sign In" → redirects to login page with email pre-filled

**Mobile UI:**
```
┌─────────────────────────────────┐
│ Email Address                   │
│ ┌─────────────────────────────┐ │
│ │ john@example.com            │ │ ← Red border
│ └─────────────────────────────┘ │
│ ⚠️ This email is already used   │
│                                 │
│ [Sign In Instead] [Reset PWD]   │
└─────────────────────────────────┘
```

---

### Scenario B: Weak Password

**What happens:**
1. User enters password less than 8 characters
2. Inline validation shows error immediately (on blur)
3. Submit button remains disabled
4. Helper text: "Password must be at least 8 characters"

**Mobile UI:**
```
┌─────────────────────────────────┐
│ Password                        │
│ ┌─────────────────────────────┐ │
│ │ abc123                      │ │ ← Red border
│ └─────────────────────────────┘ │
│ ⚠️ At least 8 characters        │
│                                 │
│ [Create Account] ───────────────│ ← Disabled
└─────────────────────────────────┘
```

---

### Scenario C: Network Error During Signup

**What happens:**
1. User submits form
2. Network request fails (timeout, no connection)
3. Show error banner: "Connection error - please try again"
4. [Retry] button appears
5. Form data preserved (user doesn't re-type everything)

**Mobile UI:**
```
┌─────────────────────────────────┐
│ ⚠️ Connection Error             │
│ Unable to create account.       │
│ Check your internet and retry.  │
│ [Retry] [Cancel]                │
├─────────────────────────────────┤
│ [Form fields remain filled]     │
└─────────────────────────────────┘
```

---

### Scenario D: User Skips Profile Completion

**What happens:**
1. User signs up with minimal info (email + password only)
2. Sees dashboard with prompts to complete profile
3. Can still book courts (profile completion not required)
4. Profile shows default avatar
5. Future prompts: "Add phone for SMS notifications" when relevant

**Progressive Prompts:**
- When booking first court: "Add phone to receive booking confirmations"
- When viewing packages: "Complete profile to unlock premium features" (future)
- Not intrusive, contextual, dismissible

---

### Scenario E: User Returns After Partial Signup

**What happens:**
1. User starts signup, closes tab midway
2. Returns later, email already registered but account incomplete
3. Can sign in with credentials
4. Dashboard shows profile completion prompts

**No "partial account" limbo state - account is either created or not**

---

## Automation Summary

### Triggered on Signup

**Database Operations:**
1. ✅ Create `users` record
2. ✅ Set default `user_type = 'new'`
3. ✅ Set default `app_role = 'user'`
4. ✅ Set default `is_active = true`
5. ✅ Initialize `preferences` JSON with defaults
6. ✅ Generate JWT token

**Notifications:**
1. ✅ Send welcome email
   - Subject: "Welcome to Red Clay!"
   - Body: Next steps, links to booking and profile
   - Channel: Email only (no in-app yet, user just signed up)

**Analytics:**
1. ✅ Track signup event
   - Source: Referral URL, UTM params
   - Device: Mobile vs Desktop
   - Time to signup: From landing to completion

**Security:**
1. ✅ Hash password (bcrypt, cost 12)
2. ✅ Validate email format and uniqueness
3. ✅ Generate secure session token
4. ✅ Set token expiration (7 days)

---

## Mobile UI Requirements

### Touch Targets
- All input fields: 56px height minimum
- All buttons: 48px height minimum (56px for primary actions)
- Checkbox: 24x24px box, 48x48px tap area
- Spacing between fields: 16px

### Input Optimization
- Email field: `type="email"` (shows @ key on mobile keyboard)
- Phone field: `type="tel"` (shows number pad)
- Password field: `type="password"` with show/hide toggle
- Auto-capitalize name field
- Auto-focus email field on page load (desktop only, not mobile)

### Form Behavior
- Submit on "Enter" key (desktop)
- Submit button always visible (sticky bottom on mobile)
- Clear error states when user starts typing
- Show success feedback immediately
- Disable submit during processing (loading spinner in button)

### Responsive Layout
```css
/* Mobile first (default) */
.signup-form {
  padding: 16px;
  max-width: 100%;
}

.form-field {
  height: 56px;
  font-size: 16px; /* Prevents zoom on iOS */
}

.submit-button {
  width: 100%;
  height: 56px;
  position: sticky;
  bottom: 0;
}

/* Tablet (640px+) */
@media (min-width: 640px) {
  .signup-form {
    max-width: 400px;
    margin: 0 auto;
    padding: 24px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .signup-form {
    max-width: 450px;
  }

  .submit-button {
    position: relative; /* Not sticky on desktop */
  }
}
```

---

## Success Criteria

**User can successfully:**
- ✅ Sign up with email + password
- ✅ Sign up with minimal info (just email/password)
- ✅ See clear errors for invalid inputs
- ✅ Receive welcome email
- ✅ Access dashboard immediately after signup
- ✅ Optionally complete profile later
- ✅ Update preferences anytime

**System automatically:**
- ✅ Creates user with correct default permissions
- ✅ Sends notifications to correct channels
- ✅ Validates all inputs server-side (not just client)
- ✅ Handles errors gracefully (network, validation, duplicates)

---

## Foundation References

**Database Schema:**
- See [database-schema.md](../foundations/database-schema.md) for `users` table structure

**Authentication:**
- See [authentication.md](../foundations/authentication.md) for permission model and user types

**Automation:**
- See [automation-rules.md](../foundations/automation-rules.md) for automatic record creation

**Mobile UI:**
- See [mobile-first-ui.md](../foundations/mobile-first-ui.md) for form patterns and input components

---

## Next Steps

After registration, users typically:
1. **Browse courts** (public access, no booking yet)
2. **Book their first court** → See [02-court-booking.md](./02-court-booking.md)
3. **Complete profile** (optional, covered in this doc)
4. **Link Telegram** (optional) → See [10-telegram-integration.md](./10-telegram-integration.md)

---

**Related Features:**
- [02. Court Booking](./02-court-booking.md) - What new users do after signup
- [09. Notifications](./09-notifications.md) - How notification preferences work
- [10. Telegram Integration](./10-telegram-integration.md) - Linking Telegram for notifications
