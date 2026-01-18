-- ============================================================================
-- Red Clay Tennis Booking Platform - Database Migrations
-- ============================================================================
-- Purpose: Complete database schema setup for PostgreSQL (Neon compatible)
-- Version: 2.0
-- Last Updated: January 18, 2026
-- ============================================================================
--
-- IMPORTANT: Run this file sequentially - tables are ordered for FK constraints
--
-- Tables included:
--   1.  users                - User accounts with type/role classification
--   2.  user_auth            - Password hashes (separate for security)
--   3.  courts               - Tennis and pickleball courts
--   4.  trainers             - Professional trainers linked to users
--   5.  trainer_schedules    - Weekly recurring availability
--   6.  package_classes      - Package type definitions
--   7.  peak_day_overrides   - Admin-designated peak days
--   8.  package_courts       - Links packages to eligible courts
--   9.  user_packages        - Purchased packages with session tracking
--   10. bookings             - Core booking records
--   11. booking_invites      - Session sharing invites
--   12. waitlists            - Slot-specific waitlist
--   13. notifications        - Multi-channel notifications
--   14. ai_recommendations   - AI-generated recommendations (future)
--   15. telegram_users       - Telegram integration (future)
--
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing (if doing server-side hashing)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE 1: USERS
-- ============================================================================
-- Central user accounts with classification and approval workflow

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),

    -- User classification
    -- 'new': Requires admin approval for bookings
    -- 'premium': Instant booking confirmation
    user_type VARCHAR(20) NOT NULL DEFAULT 'new'
        CHECK (user_type IN ('new', 'premium')),

    -- Application role
    -- 'user': Regular customer
    -- 'trainer': Professional trainer (has trainers record)
    -- 'admin': Full system access
    app_role VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (app_role IN ('user', 'trainer', 'admin')),

    -- Account status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Approval workflow (for 'new' users)
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Profile information
    profile_image_url TEXT,
    preferences JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_app_role ON users(app_role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

COMMENT ON TABLE users IS 'Central user accounts with type classification and role-based access';
COMMENT ON COLUMN users.user_type IS 'NEW users require booking approval, PREMIUM users get instant confirmation';
COMMENT ON COLUMN users.app_role IS 'user=customer, trainer=instructor, admin=full access';

-- ============================================================================
-- TABLE 2: USER_AUTH
-- ============================================================================
-- Separate table for password hashes (security best practice)
-- Keeps authentication data isolated from user profile data

CREATE TABLE user_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Password hash (bcrypt recommended, 60 chars for bcrypt)
    password_hash VARCHAR(255) NOT NULL,

    -- Password reset workflow
    reset_token VARCHAR(255),
    reset_token_expires_at TIMESTAMP WITH TIME ZONE,

    -- Security tracking
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user_auth table
CREATE INDEX idx_user_auth_user_id ON user_auth(user_id);
CREATE INDEX idx_user_auth_reset_token ON user_auth(reset_token) WHERE reset_token IS NOT NULL;

COMMENT ON TABLE user_auth IS 'Password hashes separated from user profile for security';
COMMENT ON COLUMN user_auth.password_hash IS 'Bcrypt or Argon2 hashed password';

-- ============================================================================
-- TABLE 3: COURTS
-- ============================================================================
-- Tennis and pickleball court inventory with pricing

CREATE TABLE courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,

    -- Court type
    sport_type VARCHAR(20) NOT NULL
        CHECK (sport_type IN ('tennis', 'pickleball')),
    surface VARCHAR(50),  -- 'Clay', 'Hard Court', 'Grass'

    -- Pricing (per hour)
    hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    peak_hour_rate DECIMAL(10,2),  -- Optional premium for peak times

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    maintenance_notes TEXT,

    -- Metadata
    capacity INTEGER DEFAULT 4,  -- Maximum players
    amenities TEXT[],  -- Array: ['Lights', 'Seating', 'Water Fountain']
    description TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for courts table
CREATE INDEX idx_courts_sport_type ON courts(sport_type);
CREATE INDEX idx_courts_is_active ON courts(is_active);
CREATE INDEX idx_courts_maintenance_mode ON courts(maintenance_mode);

COMMENT ON TABLE courts IS 'Tennis and pickleball court inventory with pricing';

-- ============================================================================
-- TABLE 4: TRAINERS
-- ============================================================================
-- Professional trainers linked to user accounts

CREATE TABLE trainers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Profile
    name TEXT NOT NULL,
    specialty TEXT,  -- 'Tennis Coach', 'Pickleball Instructor', 'Both'
    bio TEXT,
    experience_years INTEGER CHECK (experience_years >= 0),

    -- Pricing
    hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 75.00,

    -- Ratings (aggregated from reviews)
    rating DECIMAL(3,2) DEFAULT 5.00
        CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER NOT NULL DEFAULT 0
        CHECK (review_count >= 0),

    -- Profile
    profile_image_url TEXT,
    certifications TEXT[],  -- Array: ['USPTA', 'PTR', 'PPR']

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for trainers table
CREATE INDEX idx_trainers_user_id ON trainers(user_id);
CREATE INDEX idx_trainers_is_active ON trainers(is_active);
CREATE INDEX idx_trainers_rating ON trainers(rating DESC);
CREATE INDEX idx_trainers_specialty ON trainers(specialty);

COMMENT ON TABLE trainers IS 'Professional trainer profiles linked to user accounts';

-- ============================================================================
-- TABLE 5: TRAINER_SCHEDULES
-- ============================================================================
-- Weekly recurring trainer availability

CREATE TABLE trainer_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,

    -- Day of week (PostgreSQL DOW: 0=Sunday, 6=Saturday)
    day_of_week INTEGER NOT NULL
        CHECK (day_of_week >= 0 AND day_of_week <= 6),

    -- Time range
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Status
    is_available BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT trainer_schedules_time_check CHECK (end_time > start_time)
);

-- Indexes for trainer_schedules table
CREATE INDEX idx_trainer_schedules_trainer_id ON trainer_schedules(trainer_id);
CREATE INDEX idx_trainer_schedules_day_of_week ON trainer_schedules(day_of_week);
CREATE INDEX idx_trainer_schedules_availability ON trainer_schedules(trainer_id, day_of_week, is_available);

-- Unique constraint: prevent duplicate schedule entries for same trainer/day/time
CREATE UNIQUE INDEX idx_trainer_schedules_unique_slot
    ON trainer_schedules(trainer_id, day_of_week, start_time, end_time);

COMMENT ON TABLE trainer_schedules IS 'Weekly recurring trainer availability blocks';
COMMENT ON COLUMN trainer_schedules.day_of_week IS '0=Sunday, 1=Monday, ... 6=Saturday';

-- ============================================================================
-- TABLE 6: PACKAGE_CLASSES
-- ============================================================================
-- Package type definitions (templates for purchase)

CREATE TABLE package_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,

    -- Sport type
    sport_type VARCHAR(20) NOT NULL
        CHECK (sport_type IN ('tennis', 'pickleball')),

    -- Session composition
    court_only_sessions INTEGER NOT NULL DEFAULT 0
        CHECK (court_only_sessions >= 0),
    trainer_sessions INTEGER NOT NULL DEFAULT 0
        CHECK (trainer_sessions >= 0),

    -- Computed total (stored for query performance)
    total_sessions INTEGER GENERATED ALWAYS AS (court_only_sessions + trainer_sessions) STORED,

    -- Pricing
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),

    -- Time restrictions
    -- 'anytime': Can be used at any time
    -- 'off_peak_only': Restricted to off-peak hours
    peak_off_peak VARCHAR(20) NOT NULL DEFAULT 'anytime'
        CHECK (peak_off_peak IN ('anytime', 'off_peak_only')),

    -- Validity period (days from purchase/activation)
    validity_days INTEGER NOT NULL DEFAULT 90 CHECK (validity_days > 0),

    -- Details
    description TEXT,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Must have at least one session
    CONSTRAINT package_classes_min_sessions CHECK (court_only_sessions + trainer_sessions > 0)
);

-- Indexes for package_classes table
CREATE INDEX idx_package_classes_sport_type ON package_classes(sport_type);
CREATE INDEX idx_package_classes_is_active ON package_classes(is_active);
CREATE INDEX idx_package_classes_peak_off_peak ON package_classes(peak_off_peak);

COMMENT ON TABLE package_classes IS 'Package type definitions (templates for user purchases)';

-- ============================================================================
-- TABLE 7: PEAK_DAY_OVERRIDES
-- ============================================================================
-- Admin-designated peak days (holidays, tournaments, special events)

CREATE TABLE peak_day_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Date to override as peak
    date DATE NOT NULL UNIQUE,

    -- Reason for override
    reason VARCHAR(255),  -- 'Tournament Day', 'Holiday', 'Special Event'

    -- Admin who created this override
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for peak_day_overrides table
CREATE INDEX idx_peak_day_overrides_date ON peak_day_overrides(date);
CREATE INDEX idx_peak_day_overrides_date_range ON peak_day_overrides(date)
    WHERE date >= CURRENT_DATE;

COMMENT ON TABLE peak_day_overrides IS 'Admin-designated peak days for pricing and package restrictions';

-- ============================================================================
-- TABLE 8: PACKAGE_COURTS
-- ============================================================================
-- Links packages to eligible courts (many-to-many)

CREATE TABLE package_courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    package_class_id UUID NOT NULL REFERENCES package_classes(id) ON DELETE CASCADE,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint: prevent duplicate links
    CONSTRAINT package_courts_unique UNIQUE(court_id, package_class_id)
);

-- Indexes for package_courts table
CREATE INDEX idx_package_courts_court_id ON package_courts(court_id);
CREATE INDEX idx_package_courts_package_class_id ON package_courts(package_class_id);
CREATE INDEX idx_package_courts_is_active ON package_courts(is_active);

COMMENT ON TABLE package_courts IS 'Links package classes to eligible courts';

-- ============================================================================
-- TABLE 9: USER_PACKAGES
-- ============================================================================
-- Individual package purchases with session tracking

CREATE TABLE user_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_class_id UUID NOT NULL REFERENCES package_classes(id) ON DELETE RESTRICT,

    -- Package status workflow
    -- 'requested': Awaiting admin confirmation
    -- 'active': Confirmed and usable
    -- 'expired': Past expiration date
    -- 'depleted': All sessions used
    -- 'cancelled': Cancelled by admin/user
    status VARCHAR(20) NOT NULL DEFAULT 'requested'
        CHECK (status IN ('requested', 'active', 'expired', 'depleted', 'cancelled')),

    -- Session tracking (copied from package_class at purchase time)
    total_court_only_sessions INTEGER NOT NULL CHECK (total_court_only_sessions >= 0),
    remaining_court_only_sessions INTEGER NOT NULL CHECK (remaining_court_only_sessions >= 0),
    total_trainer_sessions INTEGER NOT NULL CHECK (total_trainer_sessions >= 0),
    remaining_trainer_sessions INTEGER NOT NULL CHECK (remaining_trainer_sessions >= 0),

    -- Payment information
    price_paid DECIMAL(10,2) NOT NULL CHECK (price_paid >= 0),
    payment_method VARCHAR(20)
        CHECK (payment_method IN ('cash', 'card', 'transfer', 'complimentary')),
    payment_received BOOLEAN NOT NULL DEFAULT false,

    -- Lifecycle timestamps
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,

    -- Admin management
    admin_notes TEXT,
    admin_adjusted BOOLEAN NOT NULL DEFAULT false,
    admin_adjustment_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Remaining cannot exceed total
    CONSTRAINT user_packages_court_sessions_check
        CHECK (remaining_court_only_sessions <= total_court_only_sessions),
    CONSTRAINT user_packages_trainer_sessions_check
        CHECK (remaining_trainer_sessions <= total_trainer_sessions)
);

-- Indexes for user_packages table
CREATE INDEX idx_user_packages_user_id ON user_packages(user_id);
CREATE INDEX idx_user_packages_package_class_id ON user_packages(package_class_id);
CREATE INDEX idx_user_packages_status ON user_packages(status);
CREATE INDEX idx_user_packages_expires_at ON user_packages(expires_at);
CREATE INDEX idx_user_packages_active ON user_packages(user_id, status)
    WHERE status = 'active';

COMMENT ON TABLE user_packages IS 'Individual package purchases with session usage tracking';

-- ============================================================================
-- TABLE 10: BOOKINGS
-- ============================================================================
-- Core booking records with package integration and session sharing

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Core references
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE RESTRICT,
    trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,

    -- Booking time slot
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Computed duration (hours, stored for query performance)
    duration_hours DECIMAL(4,2) GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
    ) STORED,

    -- Booking status
    -- 'pending': Awaiting confirmation (new users or admin review)
    -- 'confirmed': Approved and scheduled
    -- 'cancelled': Cancelled by user or admin
    -- 'completed': Session completed
    -- 'no_show': User did not attend
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),

    -- Pricing (at time of booking)
    court_fee DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (court_fee >= 0),
    trainer_fee DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (trainer_fee >= 0),
    total_fee DECIMAL(10,2) GENERATED ALWAYS AS (court_fee + trainer_fee) STORED,

    -- Package integration
    package_id UUID REFERENCES user_packages(id) ON DELETE SET NULL,
    package_session_type VARCHAR(20)
        CHECK (package_session_type IN ('court_only', 'trainer_included')),
    package_refunded BOOLEAN NOT NULL DEFAULT false,  -- True if session returned to package
    is_peak_time BOOLEAN,  -- Recorded at booking time for package validation

    -- Admin review workflow
    admin_review_required BOOLEAN NOT NULL DEFAULT false,
    admin_reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_review_notes TEXT,

    -- Session sharing (linked bookings for shared sessions)
    is_primary_booking BOOLEAN NOT NULL DEFAULT true,
    primary_booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,

    -- Metadata
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT bookings_time_check CHECK (end_time > start_time),
    -- Primary booking cannot reference itself
    CONSTRAINT bookings_primary_self_check
        CHECK (primary_booking_id IS NULL OR primary_booking_id != id)
);

-- Performance indexes for bookings table
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_court_id ON bookings(court_id);
CREATE INDEX idx_bookings_trainer_id ON bookings(trainer_id) WHERE trainer_id IS NOT NULL;
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_date_time ON bookings(booking_date, start_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_package_id ON bookings(package_id) WHERE package_id IS NOT NULL;
CREATE INDEX idx_bookings_primary_booking_id ON bookings(primary_booking_id) WHERE primary_booking_id IS NOT NULL;
CREATE INDEX idx_bookings_admin_review ON bookings(admin_review_required, status)
    WHERE admin_review_required = true AND status = 'pending';

-- CRITICAL: Unique constraint to prevent double booking same court
-- Only applies to active bookings (confirmed or pending)
CREATE UNIQUE INDEX idx_bookings_unique_court_slot
    ON bookings(court_id, booking_date, start_time)
    WHERE status IN ('confirmed', 'pending');

-- CRITICAL: Unique constraint to prevent double booking same trainer
-- Only applies to active bookings with a trainer assigned
CREATE UNIQUE INDEX idx_bookings_unique_trainer_slot
    ON bookings(trainer_id, booking_date, start_time)
    WHERE status IN ('confirmed', 'pending') AND trainer_id IS NOT NULL;

COMMENT ON TABLE bookings IS 'Core booking records with package integration and session sharing';
COMMENT ON COLUMN bookings.is_peak_time IS 'Recorded at booking creation for package peak/off-peak validation';

-- ============================================================================
-- TABLE 11: BOOKING_INVITES
-- ============================================================================
-- Session sharing invitations

CREATE TABLE booking_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Invitee identification (either registered user or email for non-users)
    invited_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invited_email VARCHAR(255),

    -- Invite status
    -- 'pending': Awaiting response
    -- 'accepted': Invitee accepted
    -- 'declined': Invitee declined
    -- 'expired': Invite expired (booking time passed)
    -- 'cancelled': Invite withdrawn by sender
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),

    -- Lifecycle timestamps
    invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,  -- Typically set to booking start time

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Must have either user_id or email
    CONSTRAINT booking_invites_invitee_check
        CHECK (invited_user_id IS NOT NULL OR invited_email IS NOT NULL)
);

-- Indexes for booking_invites table
CREATE INDEX idx_booking_invites_booking_id ON booking_invites(booking_id);
CREATE INDEX idx_booking_invites_invited_by ON booking_invites(invited_by);
CREATE INDEX idx_booking_invites_invited_user_id ON booking_invites(invited_user_id)
    WHERE invited_user_id IS NOT NULL;
CREATE INDEX idx_booking_invites_invited_email ON booking_invites(invited_email)
    WHERE invited_email IS NOT NULL;
CREATE INDEX idx_booking_invites_status ON booking_invites(status);
CREATE INDEX idx_booking_invites_pending ON booking_invites(invited_user_id, status)
    WHERE status = 'pending';

-- Prevent duplicate invites to same user for same booking
CREATE UNIQUE INDEX idx_booking_invites_unique_user
    ON booking_invites(booking_id, invited_user_id)
    WHERE invited_user_id IS NOT NULL AND status NOT IN ('cancelled', 'declined');

CREATE UNIQUE INDEX idx_booking_invites_unique_email
    ON booking_invites(booking_id, invited_email)
    WHERE invited_email IS NOT NULL AND status NOT IN ('cancelled', 'declined');

COMMENT ON TABLE booking_invites IS 'Session sharing invitations to join existing bookings';

-- ============================================================================
-- TABLE 12: WAITLISTS
-- ============================================================================
-- Slot-specific waitlist with automatic notifications

CREATE TABLE waitlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sport_type VARCHAR(20) NOT NULL
        CHECK (sport_type IN ('tennis', 'pickleball')),

    -- Desired time slot
    desired_date DATE NOT NULL,
    desired_start_time TIME NOT NULL,
    desired_end_time TIME NOT NULL,

    -- Optional preferences
    preferred_court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
    needs_trainer BOOLEAN NOT NULL DEFAULT false,
    preferred_trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,

    -- Waitlist status
    -- 'active': Actively waiting for slot
    -- 'notified': User notified of availability
    -- 'fulfilled': User booked the slot
    -- 'expired': Desired date has passed
    -- 'cancelled': User cancelled waitlist entry
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'notified', 'fulfilled', 'expired', 'cancelled')),

    -- Notification tracking
    notified_at TIMESTAMP WITH TIME ZONE,
    notification_expires_at TIMESTAMP WITH TIME ZONE,  -- Time limit to book after notification

    -- Metadata
    notes TEXT,
    priority INTEGER NOT NULL DEFAULT 0,  -- Higher = higher priority (for admin override)

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Time constraint
    CONSTRAINT waitlists_time_check CHECK (desired_end_time > desired_start_time)
);

-- Indexes for waitlists table
CREATE INDEX idx_waitlists_user_id ON waitlists(user_id);
CREATE INDEX idx_waitlists_desired_date ON waitlists(desired_date);
CREATE INDEX idx_waitlists_desired_slot ON waitlists(desired_date, desired_start_time);
CREATE INDEX idx_waitlists_status ON waitlists(status);
CREATE INDEX idx_waitlists_sport_type ON waitlists(sport_type);
CREATE INDEX idx_waitlists_active ON waitlists(desired_date, status)
    WHERE status = 'active';
CREATE INDEX idx_waitlists_preferred_court ON waitlists(preferred_court_id)
    WHERE preferred_court_id IS NOT NULL;

-- Prevent duplicate active waitlist entries for same user/slot
CREATE UNIQUE INDEX idx_waitlists_unique_user_slot
    ON waitlists(user_id, desired_date, desired_start_time)
    WHERE status IN ('active', 'notified');

COMMENT ON TABLE waitlists IS 'Slot-specific waitlist with automatic availability notifications';

-- ============================================================================
-- TABLE 13: NOTIFICATIONS
-- ============================================================================
-- Multi-channel notification system

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification content
    type VARCHAR(50) NOT NULL,  -- 'booking_confirmed', 'waitlist_available', 'package_expiring', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- Channel flags (which channels to send on)
    in_app BOOLEAN NOT NULL DEFAULT true,
    email BOOLEAN NOT NULL DEFAULT false,
    sms BOOLEAN NOT NULL DEFAULT false,
    telegram BOOLEAN NOT NULL DEFAULT false,

    -- Read status (for in-app)
    read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Delivery status
    sent BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_error TEXT,

    -- Linked entities (for navigation)
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    package_id UUID REFERENCES user_packages(id) ON DELETE SET NULL,
    waitlist_id UUID REFERENCES waitlists(id) ON DELETE SET NULL,

    -- Additional data (flexible JSON for various notification types)
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for notifications table
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read, created_at DESC)
    WHERE read = false;
CREATE INDEX idx_notifications_pending_send ON notifications(sent, created_at)
    WHERE sent = false;

COMMENT ON TABLE notifications IS 'Multi-channel notification tracking (in-app, email, SMS, Telegram)';

-- ============================================================================
-- TABLE 14: AI_RECOMMENDATIONS (Future/Optional)
-- ============================================================================
-- AI-generated booking recommendations

CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Recommendation content
    recommendation_type VARCHAR(50) NOT NULL,  -- 'optimal_time', 'package_suggestion', 'trainer_match'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    reasoning TEXT,  -- AI explanation of why this recommendation

    -- Suggested actions (links to entities)
    suggested_court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
    suggested_trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
    suggested_package_class_id UUID REFERENCES package_classes(id) ON DELETE SET NULL,
    suggested_time_slot JSONB,  -- {"date": "2026-01-20", "start_time": "10:00", "end_time": "11:00"}

    -- User interaction
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    user_feedback TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,

    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- AI metadata
    model_version VARCHAR(50),
    confidence_score DECIMAL(5,4),  -- 0.0000 to 1.0000

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ai_recommendations table
CREATE INDEX idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX idx_ai_recommendations_type ON ai_recommendations(recommendation_type);
CREATE INDEX idx_ai_recommendations_expires_at ON ai_recommendations(expires_at);
CREATE INDEX idx_ai_recommendations_pending ON ai_recommendations(user_id, status, expires_at)
    WHERE status = 'pending';

COMMENT ON TABLE ai_recommendations IS 'AI-generated personalized booking recommendations (Phase 3)';

-- ============================================================================
-- TABLE 15: TELEGRAM_USERS (Future/Optional)
-- ============================================================================
-- Links Telegram accounts to platform users

CREATE TABLE telegram_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Telegram identifiers
    telegram_id BIGINT NOT NULL UNIQUE,
    telegram_username VARCHAR(100),
    telegram_first_name VARCHAR(255),
    telegram_last_name VARCHAR(255),

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    linked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Notification preferences (granular control)
    notification_preferences JSONB DEFAULT '{
        "booking_confirmations": true,
        "booking_reminders": true,
        "waitlist_alerts": true,
        "package_updates": true,
        "promotional": false
    }',

    -- Bot interaction state (for conversation flow)
    bot_state JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for telegram_users table
CREATE INDEX idx_telegram_users_user_id ON telegram_users(user_id);
CREATE INDEX idx_telegram_users_telegram_id ON telegram_users(telegram_id);
CREATE INDEX idx_telegram_users_is_active ON telegram_users(is_active);

COMMENT ON TABLE telegram_users IS 'Telegram account links for bot integration (Phase 3)';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- ============================================================================
-- FUNCTION: is_peak_time
-- ============================================================================
-- Determines if a booking time is peak or off-peak
-- Peak times: Weekends, weekday evenings (5 PM+), admin-designated days

CREATE OR REPLACE FUNCTION is_peak_time(
    p_booking_date DATE,
    p_start_time TIME
)
RETURNS BOOLEAN AS $$
BEGIN
    -- 1. Check admin-designated peak day overrides first
    IF EXISTS (
        SELECT 1 FROM peak_day_overrides
        WHERE date = p_booking_date
    ) THEN
        RETURN true;
    END IF;

    -- 2. Check if weekend (DOW: 0=Sunday, 6=Saturday)
    IF EXTRACT(DOW FROM p_booking_date) IN (0, 6) THEN
        RETURN true;
    END IF;

    -- 3. Check weekday hours
    -- Off-peak: 6:00 AM to 5:00 PM (exclusive)
    -- Peak: Before 6 AM or 5 PM onwards
    IF EXTRACT(DOW FROM p_booking_date) BETWEEN 1 AND 5 THEN
        IF p_start_time >= '06:00:00'::TIME AND p_start_time < '17:00:00'::TIME THEN
            RETURN false;  -- Off-peak weekday hours
        END IF;
    END IF;

    -- 4. Default: peak time (weekday evenings, early mornings)
    RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_peak_time IS 'Determines if a booking time slot is peak (true) or off-peak (false)';

-- ============================================================================
-- FUNCTION: is_trainer_available
-- ============================================================================
-- Checks if a trainer is available for a specific time slot
-- Considers: trainer status, schedule, existing bookings

CREATE OR REPLACE FUNCTION is_trainer_available(
    p_trainer_id UUID,
    p_booking_date DATE,
    p_start_time TIME,
    p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
    v_day_of_week INTEGER;
BEGIN
    -- 1. Check if trainer exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM trainers
        WHERE id = p_trainer_id AND is_active = true
    ) THEN
        RETURN false;
    END IF;

    -- 2. Get day of week for schedule check
    v_day_of_week := EXTRACT(DOW FROM p_booking_date);

    -- 3. Check if trainer has an available schedule block covering this time
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

    -- 4. Check for conflicting bookings
    -- A conflict exists if there's any overlap with existing confirmed/pending bookings
    IF EXISTS (
        SELECT 1 FROM bookings
        WHERE trainer_id = p_trainer_id
            AND booking_date = p_booking_date
            AND status IN ('confirmed', 'pending')
            AND (
                -- New booking starts during existing booking
                (p_start_time >= start_time AND p_start_time < end_time)
                OR
                -- New booking ends during existing booking
                (p_end_time > start_time AND p_end_time <= end_time)
                OR
                -- New booking completely contains existing booking
                (p_start_time <= start_time AND p_end_time >= end_time)
            )
    ) THEN
        RETURN false;
    END IF;

    -- 5. Trainer is available
    RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_trainer_available IS 'Checks trainer availability considering schedule and existing bookings';

-- ============================================================================
-- FUNCTION: is_court_available
-- ============================================================================
-- Checks if a court is available for a specific time slot

CREATE OR REPLACE FUNCTION is_court_available(
    p_court_id UUID,
    p_booking_date DATE,
    p_start_time TIME,
    p_end_time TIME
)
RETURNS BOOLEAN AS $$
BEGIN
    -- 1. Check if court exists and is active (not in maintenance)
    IF NOT EXISTS (
        SELECT 1 FROM courts
        WHERE id = p_court_id
            AND is_active = true
            AND maintenance_mode = false
    ) THEN
        RETURN false;
    END IF;

    -- 2. Check for conflicting bookings
    IF EXISTS (
        SELECT 1 FROM bookings
        WHERE court_id = p_court_id
            AND booking_date = p_booking_date
            AND status IN ('confirmed', 'pending')
            AND (
                (p_start_time >= start_time AND p_start_time < end_time)
                OR
                (p_end_time > start_time AND p_end_time <= end_time)
                OR
                (p_start_time <= start_time AND p_end_time >= end_time)
            )
    ) THEN
        RETURN false;
    END IF;

    -- 3. Court is available
    RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_court_available IS 'Checks court availability for a specific time slot';

-- ============================================================================
-- FUNCTION: get_user_active_packages
-- ============================================================================
-- Returns active packages for a user with remaining sessions

CREATE OR REPLACE FUNCTION get_user_active_packages(p_user_id UUID)
RETURNS TABLE (
    package_id UUID,
    package_name VARCHAR(100),
    sport_type VARCHAR(20),
    remaining_court_sessions INTEGER,
    remaining_trainer_sessions INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    peak_off_peak VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.id AS package_id,
        pc.name AS package_name,
        pc.sport_type,
        up.remaining_court_only_sessions AS remaining_court_sessions,
        up.remaining_trainer_sessions,
        up.expires_at,
        pc.peak_off_peak
    FROM user_packages up
    JOIN package_classes pc ON up.package_class_id = pc.id
    WHERE up.user_id = p_user_id
        AND up.status = 'active'
        AND (up.expires_at IS NULL OR up.expires_at > CURRENT_TIMESTAMP)
        AND (up.remaining_court_only_sessions > 0 OR up.remaining_trainer_sessions > 0)
    ORDER BY up.expires_at ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_active_packages IS 'Returns all active packages with remaining sessions for a user';

-- ============================================================================
-- TRIGGER FUNCTION: update_updated_at
-- ============================================================================
-- Automatically updates the updated_at timestamp on row modification

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at IS 'Trigger function to auto-update updated_at timestamp';

-- ============================================================================
-- APPLY UPDATE TRIGGERS TO ALL TABLES WITH updated_at
-- ============================================================================

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_auth_updated_at
    BEFORE UPDATE ON user_auth
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_courts_updated_at
    BEFORE UPDATE ON courts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_trainers_updated_at
    BEFORE UPDATE ON trainers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_package_classes_updated_at
    BEFORE UPDATE ON package_classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_packages_updated_at
    BEFORE UPDATE ON user_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_booking_invites_updated_at
    BEFORE UPDATE ON booking_invites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_waitlists_updated_at
    BEFORE UPDATE ON waitlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_telegram_users_updated_at
    BEFORE UPDATE ON telegram_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TRIGGER FUNCTION: auto_expire_waitlists
-- ============================================================================
-- Automatically expire waitlist entries when desired date has passed

CREATE OR REPLACE FUNCTION auto_expire_waitlists()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if status is being checked/updated
    IF NEW.status = 'active' AND NEW.desired_date < CURRENT_DATE THEN
        NEW.status := 'expired';
        NEW.updated_at := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_waitlist_expiry
    BEFORE INSERT OR UPDATE ON waitlists
    FOR EACH ROW EXECUTE FUNCTION auto_expire_waitlists();

-- ============================================================================
-- TRIGGER FUNCTION: validate_booking_package
-- ============================================================================
-- Validates package can be used for the booking (peak/off-peak check)

CREATE OR REPLACE FUNCTION validate_booking_package()
RETURNS TRIGGER AS $$
DECLARE
    v_package_peak_off_peak VARCHAR(20);
    v_is_peak BOOLEAN;
BEGIN
    -- Only validate if package is being used
    IF NEW.package_id IS NOT NULL THEN
        -- Get package restrictions
        SELECT pc.peak_off_peak INTO v_package_peak_off_peak
        FROM user_packages up
        JOIN package_classes pc ON up.package_class_id = pc.id
        WHERE up.id = NEW.package_id;

        -- Check peak/off-peak restriction
        IF v_package_peak_off_peak = 'off_peak_only' THEN
            v_is_peak := is_peak_time(NEW.booking_date, NEW.start_time);
            IF v_is_peak THEN
                RAISE EXCEPTION 'Package can only be used during off-peak hours';
            END IF;
        END IF;

        -- Set the is_peak_time flag
        NEW.is_peak_time := is_peak_time(NEW.booking_date, NEW.start_time);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_booking_package_trigger
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION validate_booking_package();

-- ============================================================================
-- SEED DATA (Optional - Comment out for production)
-- ============================================================================

-- System admin user
INSERT INTO users (email, full_name, user_type, app_role, is_active)
VALUES ('admin@redclay.com', 'System Administrator', 'premium', 'admin', true);

-- Sample courts
INSERT INTO courts (name, sport_type, surface, hourly_rate, peak_hour_rate, is_active, amenities) VALUES
    ('Court 1 - Center', 'tennis', 'Clay', 50.00, 65.00, true, ARRAY['Lights', 'Covered Seating', 'Water Fountain']),
    ('Court 2 - East', 'tennis', 'Clay', 50.00, 65.00, true, ARRAY['Lights', 'Seating']),
    ('Court 3 - West', 'tennis', 'Hard Court', 45.00, 60.00, true, ARRAY['Lights']),
    ('Court 4 - Pickleball A', 'pickleball', 'Hard Court', 40.00, 50.00, true, ARRAY['Lights', 'Nets Provided']),
    ('Court 5 - Pickleball B', 'pickleball', 'Hard Court', 40.00, 50.00, true, ARRAY['Lights', 'Nets Provided']),
    ('Court 6 - Pickleball C', 'pickleball', 'Hard Court', 40.00, 50.00, true, ARRAY['Lights', 'Nets Provided']);

-- Sample package classes
INSERT INTO package_classes (name, sport_type, court_only_sessions, trainer_sessions, price, validity_days, peak_off_peak, description) VALUES
    ('Tennis Premium 12', 'tennis', 10, 2, 550.00, 90, 'anytime',
     'Our best value tennis package. 10 court sessions + 2 trainer sessions. Use anytime. Valid for 90 days.'),
    ('Tennis Basic 8', 'tennis', 8, 0, 350.00, 60, 'anytime',
     'Perfect for regular players. 8 court-only sessions. Valid for 60 days.'),
    ('Tennis Off-Peak 10', 'tennis', 10, 0, 300.00, 60, 'off_peak_only',
     'Great value for flexible schedules. 10 sessions for weekday mornings/afternoons only.'),
    ('Pickleball Starter 6', 'pickleball', 6, 0, 200.00, 45, 'anytime',
     'New to pickleball? 6 court sessions to get started. Valid for 45 days.'),
    ('Pickleball Premium 12', 'pickleball', 12, 0, 400.00, 90, 'anytime',
     'Best pickleball value. 12 sessions anytime. Valid for 90 days.'),
    ('Pickleball Off-Peak 10', 'pickleball', 10, 0, 250.00, 60, 'off_peak_only',
     'Weekday value package. 10 off-peak sessions. Valid for 60 days.');

-- Link packages to courts (all tennis packages can use tennis courts, etc.)
INSERT INTO package_courts (court_id, package_class_id)
SELECT c.id, p.id
FROM courts c
CROSS JOIN package_classes p
WHERE c.sport_type = p.sport_type AND c.is_active = true;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table creation
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name IN (
            'users', 'user_auth', 'courts', 'trainers', 'trainer_schedules',
            'package_classes', 'peak_day_overrides', 'package_courts',
            'user_packages', 'bookings', 'booking_invites', 'waitlists',
            'notifications', 'ai_recommendations', 'telegram_users'
        );

    IF table_count = 15 THEN
        RAISE NOTICE 'SUCCESS: All 15 tables created successfully';
    ELSE
        RAISE WARNING 'WARNING: Expected 15 tables, found %', table_count;
    END IF;
END $$;

-- Verify functions
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
        AND routine_name IN (
            'is_peak_time', 'is_trainer_available', 'is_court_available',
            'get_user_active_packages', 'update_updated_at',
            'auto_expire_waitlists', 'validate_booking_package'
        );

    RAISE NOTICE 'Functions created: %', function_count;
END $$;

-- Display summary
SELECT 'Red Clay Tennis Booking Platform - Database Migration Complete' AS status;
SELECT
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS tables_created,
    (SELECT COUNT(*) FROM information_schema.routines
     WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') AS functions_created,
    (SELECT COUNT(*) FROM information_schema.triggers
     WHERE trigger_schema = 'public') AS triggers_created;

-- ============================================================================
-- END OF MIGRATIONS
-- ============================================================================
