import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import { hashPassword } from '../lib/auth/password'

dotenv.config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

// Helper to generate dates
const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
const nextWeek = new Date(today)
nextWeek.setDate(nextWeek.getDate() + 7)
const lastWeek = new Date(today)
lastWeek.setDate(lastWeek.getDate() - 7)
const lastMonth = new Date(today)
lastMonth.setDate(lastMonth.getDate() - 30)

// Helper to format date
const formatDate = (date: Date) => date.toISOString().split('T')[0]

async function seedComprehensive() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    console.log('🌱 Starting comprehensive database seeding...\n')

    // ========================================================================
    // 0. CLEAN EXISTING DATA (cascading deletes)
    // ========================================================================
    console.log('🧹 Cleaning existing data...')
    await client.query('DELETE FROM booking_invites')
    await client.query('DELETE FROM notifications')
    await client.query('DELETE FROM waitlists')
    await client.query('DELETE FROM bookings')
    await client.query('DELETE FROM user_packages')
    await client.query('DELETE FROM package_courts')
    await client.query('DELETE FROM package_classes')
    await client.query('DELETE FROM peak_day_overrides')
    await client.query('DELETE FROM trainer_schedules')
    await client.query('DELETE FROM trainers')
    await client.query('DELETE FROM courts')
    await client.query('DELETE FROM user_auth')
    await client.query('DELETE FROM users')
    console.log('   ✅ Cleaned all existing data\n')

    // ========================================================================
    // 1. COURTS
    // ========================================================================
    console.log('📍 Seeding courts...')
    const courtResults = await Promise.all([
      client.query(
        `INSERT INTO courts (name, sport_type, surface, hourly_rate, peak_hour_rate, is_active)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        ['Court 1 - Clay', 'tennis', 'Clay', 40.00, 50.00, true]
      ),
      client.query(
        `INSERT INTO courts (name, sport_type, surface, hourly_rate, peak_hour_rate, is_active)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        ['Court 2 - Hard', 'tennis', 'Hard court', 30.00, 40.00, true]
      ),
      client.query(
        `INSERT INTO courts (name, sport_type, surface, hourly_rate, peak_hour_rate, is_active)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        ['Court 3 - Grass', 'tennis', 'Grass', 45.00, 55.00, true]
      ),
      client.query(
        `INSERT INTO courts (name, sport_type, surface, hourly_rate, peak_hour_rate, is_active, maintenance_mode, maintenance_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        ['Court 4 - Indoor (Maintenance)', 'tennis', 'Hard court', 35.00, 45.00, true, true, 'Resurfacing scheduled']
      ),
      client.query(
        `INSERT INTO courts (name, sport_type, surface, hourly_rate, peak_hour_rate, is_active)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        ['Court 5 - Pickleball', 'pickleball', 'Hard court', 25.00, 35.00, true]
      ),
      client.query(
        `INSERT INTO courts (name, sport_type, surface, hourly_rate, peak_hour_rate, is_active)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        ['Court 6 - Pickleball', 'pickleball', 'Hard court', 25.00, 35.00, true]
      )
    ])
    const courtIds = courtResults.map(r => r.rows[0].id)
    console.log(`   ✅ Created ${courtIds.length} courts`)

    // ========================================================================
    // 2. USERS (Diverse personas)
    // ========================================================================
    console.log('\n👥 Seeding users...')
    const defaultPassword = await hashPassword('Test123!')

    const userScenarios = [
      // Admin
      { email: 'admin@redclay.com', name: 'Admin User', phone: '+1234567890', type: 'premium', role: 'admin' },

      // Test user for E2E tests
      { email: 'test@redclay.com', name: 'Test User', phone: '+1234567801', type: 'premium', role: 'user' },

      // Premium users (experienced)
      { email: 'sarah.tennis@example.com', name: 'Sarah Johnson', phone: '+1234567891', type: 'premium', role: 'user' },
      { email: 'mike.pickle@example.com', name: 'Mike Rodriguez', phone: '+1234567892', type: 'premium', role: 'user' },
      { email: 'emma.active@example.com', name: 'Emma Williams', phone: '+1234567893', type: 'premium', role: 'user' },

      // New users (need approval)
      { email: 'john.new@example.com', name: 'John Smith', phone: '+1234567894', type: 'new', role: 'user' },
      { email: 'lisa.beginner@example.com', name: 'Lisa Chen', phone: '+1234567895', type: 'new', role: 'user' },
      { email: 'david.first@example.com', name: 'David Kumar', phone: '+1234567896', type: 'new', role: 'user' },

      // Trainers
      { email: 'coach.maria@redclay.com', name: 'Coach Maria Garcia', phone: '+1234567897', type: 'premium', role: 'trainer' },
      { email: 'coach.alex@redclay.com', name: 'Coach Alex Turner', phone: '+1234567898', type: 'premium', role: 'trainer' },

      // Edge cases
      { email: 'inactive.user@example.com', name: 'Inactive User', phone: '+1234567899', type: 'premium', role: 'user', isActive: false },
      { email: 'package.buyer@example.com', name: 'Package Power User', phone: '+1234567800', type: 'premium', role: 'user' }
    ]

    const userIds: Record<string, string> = {}
    for (const scenario of userScenarios) {
      const result = await client.query(
        `INSERT INTO users (email, full_name, phone_number, user_type, app_role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           phone_number = EXCLUDED.phone_number,
           user_type = EXCLUDED.user_type,
           app_role = EXCLUDED.app_role,
           is_active = EXCLUDED.is_active
         RETURNING id`,
        [scenario.email, scenario.name, scenario.phone, scenario.type, scenario.role, scenario.isActive ?? true]
      )
      const userId = result.rows[0].id
      userIds[scenario.email] = userId

      await client.query(
        `INSERT INTO user_auth (user_id, password_hash)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           password_changed_at = CURRENT_TIMESTAMP`,
        [userId, defaultPassword]
      )
    }
    console.log(`   ✅ Created/Updated ${Object.keys(userIds).length} users`)

    // ========================================================================
    // 3. TRAINERS
    // ========================================================================
    console.log('\n🎾 Seeding trainers...')
    const trainerResults = await Promise.all([
      client.query(
        `INSERT INTO trainers (user_id, name, specialty, bio, experience_years, hourly_rate, rating, review_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id) DO UPDATE SET
           name = EXCLUDED.name,
           specialty = EXCLUDED.specialty,
           bio = EXCLUDED.bio,
           experience_years = EXCLUDED.experience_years,
           hourly_rate = EXCLUDED.hourly_rate
         RETURNING id`,
        [
          userIds['coach.maria@redclay.com'],
          'Coach Maria Garcia',
          'Advanced technique and tournament prep',
          'Former professional player with 10+ years coaching experience',
          10,
          85.00,
          4.9,
          47
        ]
      ),
      client.query(
        `INSERT INTO trainers (user_id, name, specialty, bio, experience_years, hourly_rate, rating, review_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id) DO UPDATE SET
           name = EXCLUDED.name,
           specialty = EXCLUDED.specialty,
           bio = EXCLUDED.bio,
           experience_years = EXCLUDED.experience_years,
           hourly_rate = EXCLUDED.hourly_rate
         RETURNING id`,
        [
          userIds['coach.alex@redclay.com'],
          'Coach Alex Turner',
          'Beginner friendly and fundamentals',
          'Certified coach specializing in beginner development',
          5,
          65.00,
          4.8,
          32
        ]
      )
    ])
    const trainerIds = trainerResults.map(r => r.rows[0].id)
    console.log(`   ✅ Created/Updated ${trainerIds.length} trainers`)

    // Delete old schedules and add new ones (Mon-Fri, 8 AM - 6 PM)
    for (const trainerId of trainerIds) {
      await client.query('DELETE FROM trainer_schedules WHERE trainer_id = $1', [trainerId])
      for (let day = 1; day <= 5; day++) {
        await client.query(
          `INSERT INTO trainer_schedules (trainer_id, day_of_week, start_time, end_time, is_available)
           VALUES ($1, $2, $3, $4, $5)`,
          [trainerId, day, '08:00:00', '18:00:00', true]
        )
      }
    }
    console.log(`   ✅ Added schedules for trainers`)

    // ========================================================================
    // 4. PACKAGE CLASSES
    // ========================================================================
    console.log('\n📦 Seeding package classes...')
    const packageResults = await Promise.all([
      client.query(
        `INSERT INTO package_classes (name, sport_type, court_only_sessions, trainer_sessions, price, validity_days, description, peak_off_peak)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        ['Tennis Starter 4-Pack', 'tennis', 4, 0, 140.00, 30, 'Perfect for trying out tennis', 'anytime']
      ),
      client.query(
        `INSERT INTO package_classes (name, sport_type, court_only_sessions, trainer_sessions, price, validity_days, description, peak_off_peak)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        ['Tennis Regular 8-Pack', 'tennis', 8, 0, 260.00, 60, 'Most popular package', 'anytime']
      ),
      client.query(
        `INSERT INTO package_classes (name, sport_type, court_only_sessions, trainer_sessions, price, validity_days, description, peak_off_peak)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        ['Tennis Premium 12-Pack', 'tennis', 10, 2, 550.00, 90, 'Best value with trainer sessions', 'anytime']
      ),
      client.query(
        `INSERT INTO package_classes (name, sport_type, court_only_sessions, trainer_sessions, price, validity_days, description, peak_off_peak)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        ['Pickleball Off-Peak 10', 'pickleball', 10, 0, 200.00, 60, 'Weekday value package', 'off_peak_only']
      ),
      client.query(
        `INSERT INTO package_classes (name, sport_type, court_only_sessions, trainer_sessions, price, validity_days, description, peak_off_peak)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        ['Pickleball Premium 12', 'pickleball', 12, 0, 300.00, 90, 'Unlimited scheduling', 'anytime']
      )
    ])
    const packageClassIds = packageResults.map(r => r.rows[0].id)
    console.log(`   ✅ Created ${packageClassIds.length} package classes`)

    // Link packages to courts
    for (const packageClassId of packageClassIds) {
      const packageResult = await client.query('SELECT sport_type FROM package_classes WHERE id = $1', [packageClassId])
      const sportType = packageResult.rows[0].sport_type

      for (const courtId of courtIds) {
        const courtResult = await client.query('SELECT sport_type FROM courts WHERE id = $1', [courtId])
        if (courtResult.rows[0].sport_type === sportType) {
          await client.query(
            `INSERT INTO package_courts (court_id, package_class_id) VALUES ($1, $2)`,
            [courtId, packageClassId]
          )
        }
      }
    }
    console.log(`   ✅ Linked packages to courts`)

    // ========================================================================
    // 5. USER PACKAGES (Various states)
    // ========================================================================
    console.log('\n💳 Seeding user packages...')

    // Active package with many sessions left
    const activePackage1 = await client.query(
      `INSERT INTO user_packages (
        user_id, package_class_id, status,
        total_court_only_sessions, remaining_court_only_sessions,
        total_trainer_sessions, remaining_trainer_sessions,
        price_paid, payment_method, payment_received,
        confirmed_at, confirmed_by, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [
        userIds['sarah.tennis@example.com'], packageClassIds[2], 'active',
        10, 7, 2, 2,
        550.00, 'card', true,
        lastWeek, userIds['admin@redclay.com'], new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
      ]
    )

    // Active package half used
    const activePackage2 = await client.query(
      `INSERT INTO user_packages (
        user_id, package_class_id, status,
        total_court_only_sessions, remaining_court_only_sessions,
        total_trainer_sessions, remaining_trainer_sessions,
        price_paid, payment_method, payment_received,
        confirmed_at, confirmed_by, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [
        userIds['emma.active@example.com'], packageClassIds[1], 'active',
        8, 4, 0, 0,
        260.00, 'card', true,
        lastWeek, userIds['admin@redclay.com'], new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000)
      ]
    )

    // Almost depleted package
    const activePackage3 = await client.query(
      `INSERT INTO user_packages (
        user_id, package_class_id, status,
        total_court_only_sessions, remaining_court_only_sessions,
        total_trainer_sessions, remaining_trainer_sessions,
        price_paid, payment_method, payment_received,
        confirmed_at, confirmed_by, expires_at, last_used_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [
        userIds['mike.pickle@example.com'], packageClassIds[4], 'active',
        12, 1, 0, 0,
        300.00, 'cash', true,
        lastMonth, userIds['admin@redclay.com'], new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        lastWeek
      ]
    )

    // Requested package (pending admin approval)
    await client.query(
      `INSERT INTO user_packages (
        user_id, package_class_id, status,
        total_court_only_sessions, remaining_court_only_sessions,
        total_trainer_sessions, remaining_trainer_sessions,
        price_paid, payment_method, payment_received
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userIds['john.new@example.com'], packageClassIds[0], 'requested',
        4, 4, 0, 0,
        140.00, 'card', false
      ]
    )

    // Expired package
    await client.query(
      `INSERT INTO user_packages (
        user_id, package_class_id, status,
        total_court_only_sessions, remaining_court_only_sessions,
        total_trainer_sessions, remaining_trainer_sessions,
        price_paid, payment_method, payment_received,
        confirmed_at, confirmed_by, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        userIds['package.buyer@example.com'], packageClassIds[1], 'expired',
        8, 2, 0, 0,
        260.00, 'card', true,
        new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
        userIds['admin@redclay.com'],
        new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000)
      ]
    )

    // Depleted package
    await client.query(
      `INSERT INTO user_packages (
        user_id, package_class_id, status,
        total_court_only_sessions, remaining_court_only_sessions,
        total_trainer_sessions, remaining_trainer_sessions,
        price_paid, payment_method, payment_received,
        confirmed_at, confirmed_by, expires_at, last_used_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        userIds['package.buyer@example.com'], packageClassIds[0], 'depleted',
        4, 0, 0, 0,
        140.00, 'cash', true,
        new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        userIds['admin@redclay.com'],
        new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
        new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)
      ]
    )

    console.log(`   ✅ Created 6 user packages with various states`)

    // ========================================================================
    // 6. BOOKINGS (Various states)
    // ========================================================================
    console.log('\n📅 Seeding bookings...')

    // SCENARIO 1: Confirmed booking today (premium user)
    await client.query(
      `INSERT INTO bookings (
        user_id, court_id, booking_date, start_time, end_time,
        status, court_fee, trainer_fee, is_peak_time
      ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8)`,
      [
        userIds['sarah.tennis@example.com'], courtIds[0],
        '10:00:00', '11:00:00', 'confirmed', 40.00, 0.00, false
      ]
    )

    // SCENARIO 2: Confirmed booking with trainer (tomorrow)
    await client.query(
      `INSERT INTO bookings (
        user_id, court_id, trainer_id, booking_date, start_time, end_time,
        status, court_fee, trainer_fee, package_id, package_session_type, is_peak_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        userIds['sarah.tennis@example.com'], courtIds[1], trainerIds[0], formatDate(tomorrow),
        '14:00:00', '15:00:00', 'confirmed', 0.00, 0.00,
        activePackage1.rows[0].id, 'trainer_included', false
      ]
    )

    // SCENARIO 3: Pending booking (new user needs approval)
    await client.query(
      `INSERT INTO bookings (
        user_id, court_id, booking_date, start_time, end_time,
        status, court_fee, trainer_fee, admin_review_required, is_peak_time, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userIds['john.new@example.com'], courtIds[0], formatDate(tomorrow),
        '09:00:00', '10:00:00', 'pending', 40.00, 0.00, true, false,
        'First time booking, looking forward to playing!'
      ]
    )

    // SCENARIO 4: Another pending booking (new user)
    await client.query(
      `INSERT INTO bookings (
        user_id, court_id, booking_date, start_time, end_time,
        status, court_fee, trainer_fee, admin_review_required, is_peak_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userIds['lisa.beginner@example.com'], courtIds[2], formatDate(nextWeek),
        '11:00:00', '12:00:00', 'pending', 45.00, 0.00, true, false
      ]
    )

    // SCENARIO 5: Cancelled booking (user changed plans)
    await client.query(
      `INSERT INTO bookings (
        user_id, court_id, booking_date, start_time, end_time,
        status, court_fee, trainer_fee, is_peak_time,
        cancellation_reason, cancelled_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userIds['emma.active@example.com'], courtIds[1], formatDate(tomorrow),
        '16:00:00', '17:00:00', 'cancelled', 30.00, 0.00, false,
        'Weather forecast looks bad', new Date()
      ]
    )

    // SCENARIO 6: Completed booking (earlier today)
    await client.query(
      `INSERT INTO bookings (
        user_id, court_id, booking_date, start_time, end_time,
        status, court_fee, trainer_fee, package_id, package_session_type, is_peak_time
      ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userIds['mike.pickle@example.com'], courtIds[4],
        '08:00:00', '09:00:00', 'completed', 0.00, 0.00,
        activePackage3.rows[0].id, 'court_only', false
      ]
    )

    // SCENARIO 7: No-show booking (earlier today)
    await client.query(
      `INSERT INTO bookings (
        user_id, court_id, booking_date, start_time, end_time,
        status, court_fee, trainer_fee, is_peak_time,
        admin_review_notes, admin_reviewed_by
      ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userIds['inactive.user@example.com'], courtIds[0],
        '09:00:00', '10:00:00', 'no_show', 40.00, 0.00, false,
        'User did not show up, no call/cancel', userIds['admin@redclay.com']
      ]
    )

    // SCENARIO 8: Peak time booking (next Saturday) - different time to avoid conflict
    await client.query(
      `INSERT INTO bookings (
        user_id, court_id, booking_date, start_time, end_time,
        status, court_fee, trainer_fee, is_peak_time
      ) VALUES ($1, $2, CURRENT_DATE + ((6 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 7) % 7) +
              CASE WHEN ((6 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 7) % 7) = 0 THEN 7 ELSE 0 END,
              $3, $4, $5, $6, $7, $8)`,
      [
        userIds['sarah.tennis@example.com'], courtIds[0],
        '14:00:00', '15:00:00', 'confirmed', 50.00, 0.00, true
      ]
    )

    // SCENARIO 9: Multiple bookings from package (confirmed)
    await client.query(
      `INSERT INTO bookings (
        user_id, court_id, booking_date, start_time, end_time,
        status, court_fee, trainer_fee, package_id, package_session_type, is_peak_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userIds['emma.active@example.com'], courtIds[1], formatDate(nextWeek),
        '13:00:00', '14:00:00', 'confirmed', 0.00, 0.00,
        activePackage2.rows[0].id, 'court_only', false
      ]
    )

    // SCENARIO 10: Pending with trainer request
    await client.query(
      `INSERT INTO bookings (
        user_id, court_id, trainer_id, booking_date, start_time, end_time,
        status, court_fee, trainer_fee, admin_review_required, is_peak_time, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        userIds['david.first@example.com'], courtIds[0], trainerIds[1], formatDate(nextWeek),
        '15:00:00', '16:00:00', 'pending', 40.00, 65.00, true, false,
        'Beginner player, need help with basics'
      ]
    )

    console.log(`   ✅ Created 10 bookings with various states`)

    // ========================================================================
    // 7. WAITLIST ENTRIES
    // ========================================================================
    console.log('\n⏰ Seeding waitlist...')

    // Active waitlist for popular time slot (next Saturday)
    await client.query(
      `INSERT INTO waitlists (
        user_id, sport_type, desired_date, desired_start_time, desired_end_time,
        status, preferred_court_id, needs_trainer
      ) VALUES ($1, $2, CURRENT_DATE + 7, $3, $4, $5, $6, $7)`,
      [
        userIds['john.new@example.com'], 'tennis',
        '10:00:00', '11:00:00', 'active', courtIds[0], false
      ]
    )

    // Waitlist with trainer preference
    await client.query(
      `INSERT INTO waitlists (
        user_id, sport_type, desired_date, desired_start_time, desired_end_time,
        status, needs_trainer, preferred_trainer_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userIds['lisa.beginner@example.com'], 'tennis', formatDate(nextWeek),
        '14:00:00', '15:00:00', 'active', true, trainerIds[0],
        'Want to work on my serve'
      ]
    )

    // Expired waitlist
    await client.query(
      `INSERT INTO waitlists (
        user_id, sport_type, desired_date, desired_start_time, desired_end_time,
        status, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userIds['package.buyer@example.com'], 'pickleball', formatDate(lastWeek),
        '09:00:00', '10:00:00', 'expired', new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
      ]
    )

    console.log(`   ✅ Created 3 waitlist entries`)

    // ========================================================================
    // 8. NOTIFICATIONS
    // ========================================================================
    console.log('\n🔔 Seeding notifications...')

    // Booking confirmed notification
    await client.query(
      `INSERT INTO notifications (
        user_id, type, title, message, in_app, email, read
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userIds['sarah.tennis@example.com'], 'booking_confirmed',
        'Booking Confirmed!',
        'Your booking for Court 1 on ' + formatDate(today) + ' at 10:00 AM has been confirmed.',
        true, true, false
      ]
    )

    // Package activated notification
    await client.query(
      `INSERT INTO notifications (
        user_id, type, title, message, in_app, email, read, sent, sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userIds['emma.active@example.com'], 'package_activated',
        'Package Activated',
        'Your Tennis Regular 8-Pack is now active! You have 8 sessions to use.',
        true, true, true, true, lastWeek
      ]
    )

    // Booking requires approval notification (to admin)
    await client.query(
      `INSERT INTO notifications (
        user_id, type, title, message, in_app, read
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userIds['admin@redclay.com'], 'booking_approval_required',
        'New Booking Requires Approval',
        'John Smith has requested a booking that requires your approval.',
        true, false
      ]
    )

    // Low sessions warning
    await client.query(
      `INSERT INTO notifications (
        user_id, type, title, message, in_app, email, read
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userIds['mike.pickle@example.com'], 'package_low_sessions',
        'Only 1 Session Remaining',
        'You have only 1 session left in your package. Consider purchasing a new package!',
        true, true, false
      ]
    )

    // Waitlist available notification
    await client.query(
      `INSERT INTO notifications (
        user_id, type, title, message, in_app, sms, read, sent, sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userIds['john.new@example.com'], 'waitlist_slot_available',
        'Court Available!',
        'A slot matching your waitlist preferences is now available. Book now!',
        true, true, false, true, new Date()
      ]
    )

    console.log(`   ✅ Created 5 notifications`)

    // ========================================================================
    // 9. PEAK DAY OVERRIDES
    // ========================================================================
    console.log('\n📆 Seeding peak day overrides...')

    const newYearsDay = new Date(today.getFullYear(), 0, 1)
    const july4th = new Date(today.getFullYear(), 6, 4)

    await client.query(
      `INSERT INTO peak_day_overrides (date, reason, created_by)
       VALUES ($1, $2, $3)`,
      [formatDate(newYearsDay), "New Year's Day", userIds['admin@redclay.com']]
    )

    await client.query(
      `INSERT INTO peak_day_overrides (date, reason, created_by)
       VALUES ($1, $2, $3)`,
      [formatDate(july4th), 'Independence Day', userIds['admin@redclay.com']]
    )

    console.log(`   ✅ Created 2 peak day overrides`)

    // ========================================================================
    // 10. BOOKING INVITES (Session sharing)
    // ========================================================================
    console.log('\n👫 Seeding booking invites...')

    const firstBooking = await client.query(
      `SELECT id FROM bookings WHERE user_id = $1 AND booking_date = $2 LIMIT 1`,
      [userIds['sarah.tennis@example.com'], formatDate(today)]
    )

    if (firstBooking.rows.length > 0) {
      // Pending invite
      await client.query(
        `INSERT INTO booking_invites (
          booking_id, invited_by, invited_user_id, status, expires_at
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          firstBooking.rows[0].id,
          userIds['sarah.tennis@example.com'],
          userIds['emma.active@example.com'],
          'pending',
          new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        ]
      )

      // Accepted invite (from another booking)
      const secondBooking = await client.query(
        `SELECT id FROM bookings WHERE user_id = $1 AND booking_date = $2 LIMIT 1`,
        [userIds['emma.active@example.com'], formatDate(nextWeek)]
      )

      if (secondBooking.rows.length > 0) {
        await client.query(
          `INSERT INTO booking_invites (
            booking_id, invited_by, invited_user_id, status, responded_at
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            secondBooking.rows[0].id,
            userIds['emma.active@example.com'],
            userIds['mike.pickle@example.com'],
            'accepted',
            new Date()
          ]
        )
      }
    }

    console.log(`   ✅ Created booking invites`)

    await client.query('COMMIT')

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(60))
    console.log('✅ COMPREHENSIVE DATABASE SEEDING COMPLETE!')
    console.log('='.repeat(60))
    console.log('\n📊 Summary:')
    console.log(`   • ${courtIds.length} courts (including 1 in maintenance)`)
    console.log(`   • ${Object.keys(userIds).length} users (1 admin, 2 trainers, 3 premium, 3 new, 1 inactive)`)
    console.log(`   • ${trainerIds.length} trainers with schedules`)
    console.log(`   • ${packageClassIds.length} package classes`)
    console.log(`   • 6 user packages (active, requested, expired, depleted)`)
    console.log(`   • 10 bookings (pending, confirmed, cancelled, completed, no-show)`)
    console.log(`   • 3 waitlist entries (active, expired)`)
    console.log(`   • 5 notifications (various types)`)
    console.log(`   • 2 peak day overrides`)
    console.log(`   • Booking invites (pending & accepted)`)
    console.log('\n🔑 Login credentials (all passwords: Test123!):')
    console.log('   • admin@redclay.com (Admin)')
    console.log('   • sarah.tennis@example.com (Premium User)')
    console.log('   • john.new@example.com (New User)')
    console.log('   • coach.maria@redclay.com (Trainer)')
    console.log('\n🎯 Test Scenarios Ready:')
    console.log('   ✓ New user bookings requiring approval')
    console.log('   ✓ Premium user instant bookings')
    console.log('   ✓ Package-based bookings')
    console.log('   ✓ Trainer sessions')
    console.log('   ✓ Waitlist management')
    console.log('   ✓ Various booking states')
    console.log('   ✓ Session sharing invites')
    console.log('   ✓ Low package sessions warnings')
    console.log('   ✓ Peak/off-peak pricing')
    console.log('   ✓ Court maintenance scenarios')

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('\n❌ Seeding failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

seedComprehensive()
