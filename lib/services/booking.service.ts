import { PoolClient } from 'pg'
import { query, transaction } from '@/lib/db'

export interface CreateBookingInput {
  userId: string
  courtId: string
  trainerId?: string
  bookingDate: string
  startTime: string
  endTime: string
  notes?: string
}

export async function createBooking(input: CreateBookingInput) {
  return transaction(async (client: PoolClient) => {
    // Check court availability
    const conflicts = await client.query(
      `SELECT id FROM bookings
       WHERE court_id = $1 AND booking_date = $2 AND start_time = $3
         AND status IN ('confirmed', 'pending')`,
      [input.courtId, input.bookingDate, input.startTime]
    )

    if (conflicts.rows.length > 0) {
      throw new Error('Court already booked at this time')
    }

    // Get user info to determine status
    const userResult = await client.query(
      'SELECT user_type, app_role FROM users WHERE id = $1',
      [input.userId]
    )
    const user = userResult.rows[0]

    // Determine booking status
    const status = user.user_type === 'premium' || user.app_role === 'admin'
      ? 'confirmed'
      : 'pending'

    // Get court pricing
    const courtResult = await client.query(
      'SELECT hourly_rate, peak_hour_rate FROM courts WHERE id = $1',
      [input.courtId]
    )
    const court = courtResult.rows[0]

    // Check if peak time
    const isPeakResult = await client.query(
      'SELECT is_peak_time($1, $2) as is_peak',
      [input.bookingDate, input.startTime]
    )
    const isPeak = isPeakResult.rows[0].is_peak

    let courtFee = isPeak && court.peak_hour_rate
      ? court.peak_hour_rate
      : court.hourly_rate

    let trainerFee = 0
    if (input.trainerId) {
      const trainerResult = await client.query(
        'SELECT hourly_rate FROM trainers WHERE id = $1',
        [input.trainerId]
      )
      trainerFee = trainerResult.rows[0].hourly_rate
    }

    // Create booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (
        user_id, court_id, trainer_id,
        booking_date, start_time, end_time,
        status, court_fee, trainer_fee, is_peak_time, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        input.userId,
        input.courtId,
        input.trainerId,
        input.bookingDate,
        input.startTime,
        input.endTime,
        status,
        courtFee,
        trainerFee,
        isPeak,
        input.notes,
      ]
    )

    const booking = bookingResult.rows[0]

    // Try to apply package (Phase 2 feature)
    // TODO: Implement package application logic

    return booking
  })
}

export async function getBookingsByUser(userId: string) {
  const result = await query(
    `SELECT b.*, c.name as court_name, c.sport_type,
            t.name as trainer_name
     FROM bookings b
     JOIN courts c ON b.court_id = c.id
     LEFT JOIN trainers t ON b.trainer_id = t.id
     WHERE b.user_id = $1
     ORDER BY b.booking_date DESC, b.start_time DESC`,
    [userId]
  )
  return result.rows
}

export async function getBookingById(bookingId: string, userId: string) {
  const result = await query(
    `SELECT b.*, c.name as court_name, c.sport_type,
            t.name as trainer_name
     FROM bookings b
     JOIN courts c ON b.court_id = c.id
     LEFT JOIN trainers t ON b.trainer_id = t.id
     WHERE b.id = $1 AND b.user_id = $2`,
    [bookingId, userId]
  )
  return result.rows[0]
}

export async function cancelBooking(bookingId: string, userId: string) {
  return transaction(async (client: PoolClient) => {
    // Get booking
    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, userId]
    )

    if (bookingResult.rows.length === 0) {
      throw new Error('Booking not found')
    }

    const booking = bookingResult.rows[0]

    if (booking.status === 'cancelled') {
      throw new Error('Booking already cancelled')
    }

    // Update booking
    await client.query(
      `UPDATE bookings
       SET status = 'cancelled',
           cancelled_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [bookingId]
    )

    // Refund package session if applicable
    if (booking.package_id) {
      const sessionType = booking.package_session_type
      const column = sessionType === 'court_only'
        ? 'remaining_court_only_sessions'
        : 'remaining_trainer_sessions'

      await client.query(
        `UPDATE user_packages
         SET ${column} = ${column} + 1
         WHERE id = $1`,
        [booking.package_id]
      )
    }

    return true
  })
}

export interface RescheduleBookingInput {
  bookingDate: string
  startTime: string
  endTime: string
  courtId?: string
  trainerId?: string
}

export async function rescheduleBooking(
  bookingId: string,
  userId: string,
  input: RescheduleBookingInput
) {
  return transaction(async (client: PoolClient) => {
    // Get existing booking
    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, userId]
    )

    if (bookingResult.rows.length === 0) {
      throw new Error('Booking not found')
    }

    const booking = bookingResult.rows[0]

    if (booking.status !== 'confirmed' && booking.status !== 'pending') {
      throw new Error(`Cannot reschedule booking with status: ${booking.status}`)
    }

    // Use existing court if not specified
    const newCourtId = input.courtId || booking.court_id
    const newTrainerId = input.trainerId !== undefined ? input.trainerId : booking.trainer_id

    // Check availability for new slot
    const conflicts = await client.query(
      `SELECT id FROM bookings
       WHERE court_id = $1
         AND booking_date = $2
         AND start_time = $3
         AND id != $4
         AND status IN ('confirmed', 'pending')`,
      [newCourtId, input.bookingDate, input.startTime, bookingId]
    )

    if (conflicts.rows.length > 0) {
      throw new Error('Court already booked at the new time slot')
    }

    // Get court pricing for new slot
    const courtResult = await client.query(
      'SELECT hourly_rate, peak_hour_rate FROM courts WHERE id = $1',
      [newCourtId]
    )
    const court = courtResult.rows[0]

    // Check if new time is peak
    const isPeakResult = await client.query(
      'SELECT is_peak_time($1, $2) as is_peak',
      [input.bookingDate, input.startTime]
    )
    const isPeak = isPeakResult.rows[0].is_peak

    let courtFee = isPeak && court.peak_hour_rate
      ? court.peak_hour_rate
      : court.hourly_rate

    let trainerFee = 0
    if (newTrainerId) {
      const trainerResult = await client.query(
        'SELECT hourly_rate FROM trainers WHERE id = $1',
        [newTrainerId]
      )
      trainerFee = trainerResult.rows[0].hourly_rate
    }

    // Update booking
    const result = await client.query(
      `UPDATE bookings
       SET booking_date = $1,
           start_time = $2,
           end_time = $3,
           court_id = $4,
           trainer_id = $5,
           court_fee = $6,
           trainer_fee = $7,
           is_peak_time = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        input.bookingDate,
        input.startTime,
        input.endTime,
        newCourtId,
        newTrainerId,
        courtFee,
        trainerFee,
        isPeak,
        bookingId,
      ]
    )

    // TODO: Send notification about rescheduling

    return result.rows[0]
  })
}
