# Database Schema - Neon PostgreSQL

Complete database schema for the Red Clay tennis booking platform, designed for Neon PostgreSQL.

---

## Overview

**Database:** Neon PostgreSQL (Serverless)
**Security Model:** Application-layer JWT authentication with optional Row Level Security (RLS)
**UUID Generation:** `uuid-ossp` extension with `uuid_generate_v4()`
**Migration Strategy:** Sequential migrations organized in 5 phases
**Approach:** Relational data model with automated constraints and triggers

---

## Migration Strategy

The schema is organized into 5 sequential migrations for organized deployment:

1. **Migration 001:** Core tables (users, courts, bookings, trainers, schedules)
2. **Migration 002:** Package system (package_classes, user_packages, peak_day_overrides, package_courts)
3. **Migration 003:** Notifications & waitlist system
4. **Migration 004:** Session sharing & booking invites
5. **Migration 005:** Advanced features (AI recommendations, Telegram integration)

This approach allows for:
- ✅ Incremental deployment
- ✅ Easy rollback capabilities
- ✅ Clear feature boundaries
- ✅ Testing per migration phase

See `docs/database/migrations.sql` for the complete implementation.

---

## Core Tables

### `users`
User accounts and profiles:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),

  -- User classification
  user_type VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (user_type IN ('new', 'premium')),
  app_role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (app_role IN ('user', 'trainer', 'admin')),

  -- Status
  is_active BOOLEAN DEFAULT true,
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),

  -- Profile
  profile_image_url TEXT,
  preferences JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_app_role ON users(app_role);
```

**User Types:**
- `new`: Requires admin approval for bookings
- `premium`: Instant booking confirmation

**App Roles:**
- `user`: Regular customer
- `trainer`: Professional trainer
- `admin`: System administrator

---

### `user_auth`
Password hashes and authentication security data (separated for security best practices):
```sql
CREATE TABLE user_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,

  -- Password management
  password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reset_token TEXT,
  reset_token_expires TIMESTAMP,

  -- Security tracking
  last_login_at TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_auth_user_id ON user_auth(user_id);
CREATE INDEX idx_user_auth_reset_token ON user_auth(reset_token);
```

**Security Features:**
- Password hashes stored separately from user profiles
- Rate limiting via `failed_login_attempts` and `locked_until`
- Password reset token management
- Tracks last login for security auditing

---

### `courts`
Tennis and pickleball courts:
```sql
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  sport_type VARCHAR(20) NOT NULL CHECK (sport_type IN ('tennis', 'pickleball')),
  surface VARCHAR(50),  -- "Clay", "Hard court", "Grass"

  -- Pricing
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  peak_hour_rate DECIMAL(10,2),  -- Optional peak pricing

  -- Status
  is_active BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_notes TEXT,

  -- Metadata
  capacity INTEGER DEFAULT 4,  -- Max players
  amenities TEXT[],  -- ["Lights", "Seating", "Water fountain"]

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courts_sport_type ON courts(sport_type);
CREATE INDEX idx_courts_is_active ON courts(is_active);
```

---

### `bookings`
Court bookings with package and session sharing support:
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE RESTRICT,
  trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,

  -- Booking details
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours DECIMAL(4,2) GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
  ) STORED,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),

  -- Pricing
  court_fee DECIMAL(10,2) DEFAULT 0,
  trainer_fee DECIMAL(10,2) DEFAULT 0,
  total_fee DECIMAL(10,2) GENERATED ALWAYS AS (court_fee + trainer_fee) STORED,

  -- Package integration
  package_id UUID REFERENCES user_packages(id) ON DELETE SET NULL,
  package_session_type VARCHAR(20) CHECK (package_session_type IN ('court_only', 'trainer_included')),
  package_refunded BOOLEAN DEFAULT false,
  is_peak_time BOOLEAN,  -- Recorded at booking time

  -- Admin review
  admin_review_required BOOLEAN DEFAULT false,
  admin_reviewed_by UUID REFERENCES users(id),
  admin_review_notes TEXT,

  -- Session sharing
  is_primary_booking BOOLEAN DEFAULT true,
  primary_booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,

  -- Metadata
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CHECK (end_time > start_time),
  CHECK (booking_date >= CURRENT_DATE)
);

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_court_id ON bookings(court_id);
CREATE INDEX idx_bookings_trainer_id ON bookings(trainer_id);
CREATE INDEX idx_bookings_date_time ON bookings(booking_date, start_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_package_id ON bookings(package_id);
CREATE INDEX idx_bookings_primary_booking_id ON bookings(primary_booking_id);

-- Prevent double booking same court
CREATE UNIQUE INDEX idx_bookings_unique_court_slot ON bookings(court_id, booking_date, start_time)
  WHERE status IN ('confirmed', 'pending');

-- Prevent double booking same trainer
CREATE UNIQUE INDEX idx_bookings_unique_trainer_slot ON bookings(trainer_id, booking_date, start_time)
  WHERE status IN ('confirmed', 'pending') AND trainer_id IS NOT NULL;
```

---

## Trainer System

### `trainers`
Professional trainers:
```sql
CREATE TABLE trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,  -- "Tennis Coach", "Pickleball Instructor"
  bio TEXT,
  experience_years INTEGER,

  -- Pricing
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 75.00,

  -- Ratings
  rating DECIMAL(3,2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,

  -- Profile
  profile_image_url TEXT,
  certifications TEXT[],

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trainers_user_id ON trainers(user_id);
CREATE INDEX idx_trainers_is_active ON trainers(is_active);
CREATE INDEX idx_trainers_rating ON trainers(rating DESC);
```

### `trainer_schedules`
Weekly recurring availability:
```sql
CREATE TABLE trainer_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,

  -- Day and time
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Status
  is_available BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CHECK (end_time > start_time)
);

CREATE INDEX idx_trainer_schedules_trainer_id ON trainer_schedules(trainer_id);
CREATE INDEX idx_trainer_schedules_day_of_week ON trainer_schedules(day_of_week);
```

---

## Package System

### `package_classes`
Available package types:
```sql
CREATE TABLE package_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  sport_type VARCHAR(20) NOT NULL CHECK (sport_type IN ('tennis', 'pickleball')),

  -- Session composition
  court_only_sessions INTEGER NOT NULL DEFAULT 0,
  trainer_sessions INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER GENERATED ALWAYS AS (court_only_sessions + trainer_sessions) STORED,

  -- Pricing
  price DECIMAL(10,2) NOT NULL,

  -- Time restrictions
  peak_off_peak VARCHAR(20) NOT NULL DEFAULT 'anytime'
    CHECK (peak_off_peak IN ('anytime', 'off_peak_only')),
  validity_days INTEGER NOT NULL DEFAULT 90,

  -- Details
  description TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CHECK (court_only_sessions + trainer_sessions > 0)
);

CREATE INDEX idx_package_classes_sport_type ON package_classes(sport_type);
CREATE INDEX idx_package_classes_is_active ON package_classes(is_active);
```

### `peak_day_overrides`
Admin-designated peak days:
```sql
CREATE TABLE peak_day_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  reason VARCHAR(255),  -- "Tournament Day", "Special Event"
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_peak_day_overrides_date ON peak_day_overrides(date);
```

### `package_courts`
Links packages to eligible courts:
```sql
CREATE TABLE package_courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  package_class_id UUID NOT NULL REFERENCES package_classes(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(court_id, package_class_id)
);

CREATE INDEX idx_package_courts_court_id ON package_courts(court_id);
CREATE INDEX idx_package_courts_package_class_id ON package_courts(package_class_id);
```

### `user_packages`
Individual package purchases:
```sql
CREATE TABLE user_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_class_id UUID NOT NULL REFERENCES package_classes(id) ON DELETE RESTRICT,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'active', 'expired', 'depleted', 'cancelled')),

  -- Session tracking
  total_court_only_sessions INTEGER NOT NULL,
  remaining_court_only_sessions INTEGER NOT NULL,
  total_trainer_sessions INTEGER NOT NULL,
  remaining_trainer_sessions INTEGER NOT NULL,

  -- Payment
  price_paid DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'complimentary')),
  payment_received BOOLEAN DEFAULT false,

  -- Lifecycle
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  confirmed_by UUID REFERENCES users(id),
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,

  -- Admin management
  admin_notes TEXT,
  admin_adjusted BOOLEAN DEFAULT false,
  admin_adjustment_notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CHECK (remaining_court_only_sessions >= 0),
  CHECK (remaining_trainer_sessions >= 0),
  CHECK (total_court_only_sessions >= 0),
  CHECK (total_trainer_sessions >= 0)
);

CREATE INDEX idx_user_packages_user_id ON user_packages(user_id);
CREATE INDEX idx_user_packages_package_class_id ON user_packages(package_class_id);
CREATE INDEX idx_user_packages_status ON user_packages(status);
CREATE INDEX idx_user_packages_expires_at ON user_packages(expires_at);
```

---

## Session Sharing

### `booking_invites`
Invite friends to join bookings:
```sql
CREATE TABLE booking_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Invitee (registered or email)
  invited_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invited_email VARCHAR(255),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),

  -- Timestamps
  invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  expires_at TIMESTAMP,  -- When booking starts

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Either user_id or email must be provided
  CHECK (invited_user_id IS NOT NULL OR invited_email IS NOT NULL)
);

CREATE INDEX idx_booking_invites_booking_id ON booking_invites(booking_id);
CREATE INDEX idx_booking_invites_invited_by ON booking_invites(invited_by);
CREATE INDEX idx_booking_invites_invited_user_id ON booking_invites(invited_user_id);
CREATE INDEX idx_booking_invites_status ON booking_invites(status);
```

---

## Waitlist System

### `waitlists`
Slot-specific waitlist:
```sql
CREATE TABLE waitlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport_type VARCHAR(20) NOT NULL CHECK (sport_type IN ('tennis', 'pickleball')),

  -- Specific slot
  desired_date DATE NOT NULL,
  desired_start_time TIME NOT NULL,
  desired_end_time TIME NOT NULL,

  -- Optional preferences
  preferred_court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
  needs_trainer BOOLEAN DEFAULT false,
  preferred_trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'notified', 'fulfilled', 'expired', 'cancelled')),

  -- Notification
  notified_at TIMESTAMP,
  expires_at TIMESTAMP,  -- Auto-expire after desired date passes

  -- Metadata
  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CHECK (desired_end_time > desired_start_time)
);

CREATE INDEX idx_waitlists_user_id ON waitlists(user_id);
CREATE INDEX idx_waitlists_desired_slot ON waitlists(desired_date, desired_start_time);
CREATE INDEX idx_waitlists_status ON waitlists(status);
CREATE INDEX idx_waitlists_sport_type ON waitlists(sport_type);
```

---

## Notifications System

### `notifications`
Multi-channel notifications:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Content
  type VARCHAR(50) NOT NULL,  -- "booking_confirmed", "waitlist_available", "package_expiring"
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Channels
  in_app BOOLEAN DEFAULT true,
  email BOOLEAN DEFAULT false,
  sms BOOLEAN DEFAULT false,
  telegram BOOLEAN DEFAULT false,

  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,

  -- Linked entities
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  package_id UUID REFERENCES user_packages(id) ON DELETE SET NULL,
  waitlist_id UUID REFERENCES waitlists(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

## AI & Analytics

### `ai_recommendations`
AI-generated booking recommendations:
```sql
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Recommendation content
  recommendation_type VARCHAR(50) NOT NULL,  -- "optimal_time", "package_suggestion", "trainer_match"
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  reasoning TEXT,  -- AI explanation

  -- Suggested action
  suggested_court_id UUID REFERENCES courts(id),
  suggested_trainer_id UUID REFERENCES trainers(id),
  suggested_package_class_id UUID REFERENCES package_classes(id),
  suggested_time_slot JSONB,  -- {"date": "2026-01-20", "start_time": "10:00", "end_time": "11:00"}

  -- User interaction
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  user_feedback TEXT,
  responded_at TIMESTAMP,

  -- Expiration
  expires_at TIMESTAMP NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX idx_ai_recommendations_expires_at ON ai_recommendations(expires_at);
```

---

## Telegram Integration

### `telegram_users`
Links Telegram accounts to platform users:
```sql
CREATE TABLE telegram_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL UNIQUE,
  telegram_username VARCHAR(100),

  -- Status
  is_active BOOLEAN DEFAULT true,
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Preferences
  notification_preferences JSONB DEFAULT '{"booking_updates": true, "waitlist_alerts": true}',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telegram_users_user_id ON telegram_users(user_id);
CREATE INDEX idx_telegram_users_telegram_id ON telegram_users(telegram_id);
```

---

## Row Level Security (RLS) Policies

### Current Implementation: Application-Layer Security

**⚠️ Important:** In the current implementation (`docs/database/migrations.sql`), RLS policies are **commented out**.

The platform currently uses **JWT authentication at the application layer** for the following reasons:
- Simpler initial setup with standard Neon PostgreSQL
- No need to configure `auth.uid()` function
- Security enforced in API endpoints before database access
- Easier to debug and test during development

### Optional: Database-Level RLS (Future Enhancement)

For enhanced security, you can enable Row Level Security at the database layer. This provides an additional security layer beyond application authentication.

**To enable RLS, you must:**
1. Create an `auth` schema and `auth.uid()` function to get the current user's ID
2. Configure your application to set the user context on each database connection
3. Uncomment the RLS policies in `migrations.sql` or use the examples below

### Enable RLS on all user-facing tables
```sql
-- Note: Only enable this after setting up auth.uid() function
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;
```

### Example RLS Policies (Optional - Not Currently Active)

The following policies show how RLS could be configured if enabled. These are reference examples only.

#### User policies
```sql
-- Users can view their own profile
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY users_select_admin ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND app_role = 'admin')
  );

-- Admins can update all users
CREATE POLICY users_update_admin ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND app_role = 'admin')
  );
```

#### Booking policies
```sql
-- Users can view their own bookings
CREATE POLICY bookings_select_own ON bookings
  FOR SELECT USING (user_id = auth.uid());

-- Users can view bookings they're invited to
CREATE POLICY bookings_select_invited ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM booking_invites
      WHERE booking_id = bookings.id
        AND invited_user_id = auth.uid()
        AND status = 'accepted'
    )
  );

-- Users can create their own bookings
CREATE POLICY bookings_insert_own ON bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own pending bookings
CREATE POLICY bookings_update_own ON bookings
  FOR UPDATE USING (user_id = auth.uid() AND status = 'pending');

-- Trainers can view their assigned bookings
CREATE POLICY bookings_select_trainer ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trainers
      WHERE trainers.user_id = auth.uid()
        AND trainers.id = bookings.trainer_id
    )
  );

-- Admins can view all bookings
CREATE POLICY bookings_select_admin ON bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND app_role = 'admin')
  );

-- Admins can update all bookings
CREATE POLICY bookings_update_admin ON bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND app_role = 'admin')
  );
```

#### Package policies
```sql
-- Users can view their own packages
CREATE POLICY user_packages_select_own ON user_packages
  FOR SELECT USING (user_id = auth.uid());

-- Users can request packages
CREATE POLICY user_packages_insert_own ON user_packages
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can view all packages
CREATE POLICY user_packages_select_admin ON user_packages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND app_role = 'admin')
  );

-- Admins can update all packages
CREATE POLICY user_packages_update_admin ON user_packages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND app_role = 'admin')
  );
```

#### Notification policies
```sql
-- Users can view their own notifications
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE USING (user_id = auth.uid());
```

---

## Helper Functions

### Check if time is peak
```sql
CREATE OR REPLACE FUNCTION is_peak_time(booking_date DATE, start_time TIME)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check admin-designated peak days
  IF EXISTS (SELECT 1 FROM peak_day_overrides WHERE date = booking_date) THEN
    RETURN true;
  END IF;

  -- Check if weekend (0=Sunday, 6=Saturday)
  IF EXTRACT(DOW FROM booking_date) IN (0, 6) THEN
    RETURN true;
  END IF;

  -- Check if weekday off-peak hours (6 AM - 5 PM)
  IF EXTRACT(DOW FROM booking_date) BETWEEN 1 AND 5
     AND start_time >= '06:00:00'::TIME
     AND start_time < '17:00:00'::TIME THEN
    RETURN false;
  END IF;

  -- Default: peak (weekday evenings)
  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Check trainer availability
```sql
CREATE OR REPLACE FUNCTION is_trainer_available(
  p_trainer_id UUID,
  p_booking_date DATE,
  p_start_time TIME,
  p_end_time TIME
) RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week INTEGER;
BEGIN
  -- Check if trainer is active
  IF NOT EXISTS (
    SELECT 1 FROM trainers WHERE id = p_trainer_id AND is_active = true
  ) THEN
    RETURN false;
  END IF;

  -- Get day of week
  v_day_of_week := EXTRACT(DOW FROM p_booking_date);

  -- Check if trainer has schedule for this day/time
  IF NOT EXISTS (
    SELECT 1 FROM trainer_schedules
    WHERE trainer_id = p_trainer_id
      AND day_of_week = v_day_of_week
      AND is_available = true
      AND start_time <= p_start_time
      AND end_time >= p_end_time
  ) THEN
    RETURN false;
  END IF;

  -- Check for booking conflicts
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE trainer_id = p_trainer_id
      AND booking_date = p_booking_date
      AND start_time = p_start_time
      AND status IN ('confirmed', 'pending')
  ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## Automated Triggers

### Update timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_packages_updated_at BEFORE UPDATE ON user_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Apply to other tables as needed
```

### Auto-expire waitlists
```sql
CREATE OR REPLACE FUNCTION expire_past_waitlists()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE waitlists
  SET status = 'expired'
  WHERE status = 'active'
    AND desired_date < CURRENT_DATE;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Run daily via cron job or scheduled function
```

---

## Indexes Summary

All tables include optimized indexes for:
- Primary keys (automatic)
- Foreign keys
- Status fields
- Date/time fields for booking queries
- Composite indexes for common query patterns

---

---

## Summary

**Total Tables:** 15 core tables
- 14 documented in original schema
- 1 additional (`user_auth`) for security best practices

**Key Features:**
- ✅ Complete relational model with proper constraints
- ✅ Optimized indexes for all common query patterns
- ✅ Helper functions for business logic (peak time detection, trainer availability)
- ✅ Automated triggers for timestamps
- ✅ Application-layer JWT authentication (RLS optional)
- ✅ Sequential migration strategy for organized deployment

**Next:** See [Authentication Model](./authentication.md) for user role management and [Automation Rules](./automation-rules.md) for cross-linking logic.
