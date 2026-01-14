-- ============================================================================
-- Red Clay Tennis Booking Platform - Database Migrations
-- ============================================================================
-- Purpose: Complete database schema setup for Neon PostgreSQL
-- Version: 1.0
-- Last Updated: January 14, 2026
-- ============================================================================

-- ============================================================================
-- MIGRATION 001: Initial Schema Setup
-- ============================================================================
-- Description: Core tables for users, courts, bookings
-- Run Order: 1
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

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

COMMENT ON TABLE users IS 'Central user authentication and profile management';
COMMENT ON COLUMN users.user_type IS 'NEW users require booking approval, PREMIUM users get instant confirmation';
COMMENT ON COLUMN users.app_role IS 'user=customer, trainer=instructor, admin=full access';

-- ============================================================================
-- COURTS
-- ============================================================================

CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  sport_type VARCHAR(20) NOT NULL CHECK (sport_type IN ('tennis', 'pickleball')),
  surface VARCHAR(50),  -- "Clay", "Hard court", "Grass"

  -- Pricing
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  peak_hour_rate DECIMAL(10,2),

  -- Status
  is_active BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_notes TEXT,

  -- Metadata
  capacity INTEGER DEFAULT 4,
  amenities TEXT[],

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courts_sport_type ON courts(sport_type);
CREATE INDEX idx_courts_is_active ON courts(is_active);

COMMENT ON TABLE courts IS 'Tennis and pickleball court inventory';

-- ============================================================================
-- TRAINERS
-- ============================================================================

CREATE TABLE trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,
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

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trainers_user_id ON trainers(user_id);
CREATE INDEX idx_trainers_is_active ON trainers(is_active);
CREATE INDEX idx_trainers_rating ON trainers(rating DESC);

COMMENT ON TABLE trainers IS 'Professional trainer profiles';

-- ============================================================================
-- TRAINER SCHEDULES
-- ============================================================================

CREATE TABLE trainer_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,

  -- Day and time (0=Sunday, 6=Saturday)
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

COMMENT ON TABLE trainer_schedules IS 'Weekly recurring trainer availability';

-- ============================================================================
-- BOOKINGS
-- ============================================================================

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

  -- Package integration (will be added in migration 002)
  package_id UUID,
  package_session_type VARCHAR(20) CHECK (package_session_type IN ('court_only', 'trainer_included')),
  package_refunded BOOLEAN DEFAULT false,
  is_peak_time BOOLEAN,

  -- Admin review
  admin_review_required BOOLEAN DEFAULT false,
  admin_reviewed_by UUID REFERENCES users(id),
  admin_review_notes TEXT,

  -- Session sharing (will be fully added in migration 004)
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

-- Performance indexes
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_court_id ON bookings(court_id);
CREATE INDEX idx_bookings_trainer_id ON bookings(trainer_id);
CREATE INDEX idx_bookings_date_time ON bookings(booking_date, start_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_package_id ON bookings(package_id);
CREATE INDEX idx_bookings_primary_booking_id ON bookings(primary_booking_id);

-- Unique constraint: Prevent double booking same court
CREATE UNIQUE INDEX idx_bookings_unique_court_slot ON bookings(court_id, booking_date, start_time)
  WHERE status IN ('confirmed', 'pending');

-- Unique constraint: Prevent double booking same trainer
CREATE UNIQUE INDEX idx_bookings_unique_trainer_slot ON bookings(trainer_id, booking_date, start_time)
  WHERE status IN ('confirmed', 'pending') AND trainer_id IS NOT NULL;

COMMENT ON TABLE bookings IS 'Core booking records with package and trainer integration';

-- ============================================================================
-- MIGRATION 002: Package System
-- ============================================================================
-- Description: Package classes, user packages, peak day overrides
-- Run Order: 2
-- Dependencies: Migration 001 (users, courts)
-- ============================================================================

-- ============================================================================
-- PACKAGE CLASSES
-- ============================================================================

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

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CHECK (court_only_sessions + trainer_sessions > 0)
);

CREATE INDEX idx_package_classes_sport_type ON package_classes(sport_type);
CREATE INDEX idx_package_classes_is_active ON package_classes(is_active);

COMMENT ON TABLE package_classes IS 'Defines available package types (templates)';

-- ============================================================================
-- PEAK DAY OVERRIDES
-- ============================================================================

CREATE TABLE peak_day_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  reason VARCHAR(255),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_peak_day_overrides_date ON peak_day_overrides(date);

COMMENT ON TABLE peak_day_overrides IS 'Admin-designated peak days (holidays, tournaments)';

-- ============================================================================
-- PACKAGE COURTS
-- ============================================================================

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

COMMENT ON TABLE package_courts IS 'Links packages to eligible courts';

-- ============================================================================
-- USER PACKAGES
-- ============================================================================

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

  -- Timestamps
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

COMMENT ON TABLE user_packages IS 'Individual package purchases and usage tracking';

-- Add foreign key constraint to bookings for package_id
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_package_id
  FOREIGN KEY (package_id) REFERENCES user_packages(id) ON DELETE SET NULL;

-- ============================================================================
-- MIGRATION 003: Notifications & Waitlist
-- ============================================================================
-- Description: Multi-channel notifications and waitlist system
-- Run Order: 3
-- Dependencies: Migration 001, 002
-- ============================================================================

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Content
  type VARCHAR(50) NOT NULL,
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
  waitlist_id UUID,  -- Will reference waitlists table

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

COMMENT ON TABLE notifications IS 'Multi-channel notification tracking';

-- ============================================================================
-- WAITLISTS
-- ============================================================================

CREATE TABLE waitlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport_type VARCHAR(20) NOT NULL CHECK (sport_type IN ('tennis', 'pickleball')),

  -- Desired slot
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
  expires_at TIMESTAMP,

  -- Metadata
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CHECK (desired_end_time > desired_start_time)
);

CREATE INDEX idx_waitlists_user_id ON waitlists(user_id);
CREATE INDEX idx_waitlists_desired_slot ON waitlists(desired_date, desired_start_time);
CREATE INDEX idx_waitlists_status ON waitlists(status);
CREATE INDEX idx_waitlists_sport_type ON waitlists(sport_type);

COMMENT ON TABLE waitlists IS 'Slot-specific waitlist with automatic notifications';

-- Add foreign key constraint to notifications for waitlist_id
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_waitlist_id
  FOREIGN KEY (waitlist_id) REFERENCES waitlists(id) ON DELETE SET NULL;

-- ============================================================================
-- MIGRATION 004: Session Sharing & Invites
-- ============================================================================
-- Description: Booking invites for session sharing
-- Run Order: 4
-- Dependencies: Migration 001, 003
-- ============================================================================

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
  expires_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CHECK (invited_user_id IS NOT NULL OR invited_email IS NOT NULL)
);

CREATE INDEX idx_booking_invites_booking_id ON booking_invites(booking_id);
CREATE INDEX idx_booking_invites_invited_by ON booking_invites(invited_by);
CREATE INDEX idx_booking_invites_invited_user_id ON booking_invites(invited_user_id);
CREATE INDEX idx_booking_invites_status ON booking_invites(status);

COMMENT ON TABLE booking_invites IS 'Invite friends to join bookings (session sharing)';

-- ============================================================================
-- MIGRATION 005: Advanced Features (AI & Telegram)
-- ============================================================================
-- Description: AI recommendations and Telegram integration
-- Run Order: 5
-- Dependencies: Migration 001, 002
-- ============================================================================

-- ============================================================================
-- AI RECOMMENDATIONS
-- ============================================================================

CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Recommendation content
  recommendation_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  reasoning TEXT,

  -- Suggested action
  suggested_court_id UUID REFERENCES courts(id),
  suggested_trainer_id UUID REFERENCES trainers(id),
  suggested_package_class_id UUID REFERENCES package_classes(id),
  suggested_time_slot JSONB,

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

COMMENT ON TABLE ai_recommendations IS 'AI-generated booking recommendations';

-- ============================================================================
-- TELEGRAM USERS
-- ============================================================================

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

COMMENT ON TABLE telegram_users IS 'Links Telegram accounts to platform users';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Check if time is peak
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

COMMENT ON FUNCTION is_peak_time IS 'Determines if a booking time is peak or off-peak';

-- Function: Check trainer availability
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

COMMENT ON FUNCTION is_trainer_available IS 'Checks if trainer is available for a specific time slot';

-- ============================================================================
-- AUTOMATED TRIGGERS
-- ============================================================================

-- Trigger function: Update timestamps
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

CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON courts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON trainers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_package_classes_updated_at BEFORE UPDATE ON package_classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_packages_updated_at BEFORE UPDATE ON user_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_waitlists_updated_at BEFORE UPDATE ON waitlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_booking_invites_updated_at BEFORE UPDATE ON booking_invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all user-facing tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

-- NOTE: auth.uid() function must be provided by your authentication system
-- Example: Neon, Supabase, or custom JWT implementation

-- Users policies
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY users_select_admin ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND app_role = 'admin')
  );

CREATE POLICY users_update_admin ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND app_role = 'admin')
  );

-- Bookings policies
CREATE POLICY bookings_select_own ON bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY bookings_select_invited ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM booking_invites
      WHERE booking_id = bookings.id
        AND invited_user_id = auth.uid()
        AND status = 'accepted'
    )
  );

CREATE POLICY bookings_insert_own ON bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY bookings_update_own ON bookings
  FOR UPDATE USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY bookings_select_trainer ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trainers
      WHERE trainers.user_id = auth.uid()
        AND trainers.id = bookings.trainer_id
    )
  );

CREATE POLICY bookings_select_admin ON bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND app_role = 'admin')
  );

CREATE POLICY bookings_update_admin ON bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND app_role = 'admin')
  );

-- Package policies
CREATE POLICY user_packages_select_own ON user_packages
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_packages_insert_own ON user_packages
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY user_packages_select_admin ON user_packages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND app_role = 'admin')
  );

CREATE POLICY user_packages_update_admin ON user_packages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND app_role = 'admin')
  );

-- Notification policies
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Waitlist policies
CREATE POLICY waitlists_select_own ON waitlists
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY waitlists_insert_own ON waitlists
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY waitlists_delete_own ON waitlists
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- SEED DATA (Optional)
-- ============================================================================

-- System admin user (password should be hashed by application)
INSERT INTO users (email, full_name, user_type, app_role)
VALUES ('admin@redclay.com', 'System Admin', 'premium', 'admin');

-- Sample courts
INSERT INTO courts (name, sport_type, surface, hourly_rate, is_active) VALUES
('Court 1', 'tennis', 'Clay', 50.00, true),
('Court 2', 'tennis', 'Clay', 50.00, true),
('Court 3', 'tennis', 'Hard Court', 45.00, true),
('Court 4', 'pickleball', 'Hard Court', 40.00, true),
('Court 5', 'pickleball', 'Hard Court', 40.00, true),
('Court 6', 'pickleball', 'Hard Court', 40.00, true);

-- Sample package classes
INSERT INTO package_classes (name, sport_type, court_only_sessions, trainer_sessions, price, validity_days, description) VALUES
('Tennis Premium 12-Session', 'tennis', 10, 2, 550.00, 90, 'Perfect for regular players. Includes 10 court-only sessions and 2 trainer sessions. Valid for 90 days.'),
('Tennis Basic 8-Session', 'tennis', 8, 0, 350.00, 60, 'Great starter package. 8 court-only sessions. Valid for 60 days.'),
('Pickleball Off-Peak 10', 'pickleball', 10, 0, 300.00, 60, 'Weekday value package. 10 sessions for off-peak hours (6 AM - 5 PM). Valid for 60 days.'),
('Pickleball Premium 12', 'pickleball', 12, 0, 400.00, 90, 'Best value. 12 sessions anytime. Valid for 90 days.');

-- Link packages to courts (all tennis packages can use all tennis courts)
INSERT INTO package_courts (court_id, package_class_id)
SELECT c.id, p.id
FROM courts c
CROSS JOIN package_classes p
WHERE c.sport_type = p.sport_type;

-- ============================================================================
-- END OF MIGRATIONS
-- ============================================================================

-- Verify installation
SELECT 'Database schema installed successfully!' AS status;
SELECT COUNT(*) AS total_tables FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
