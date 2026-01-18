import sgMail from '@sendgrid/mail'

if (process.env.EMAIL_API_KEY) {
  sgMail.setApiKey(process.env.EMAIL_API_KEY)
}

interface EmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(params: EmailParams) {
  if (!process.env.EMAIL_API_KEY) {
    console.log('Email not configured, skipping:', params.subject)
    return
  }

  try {
    await sgMail.send({
      from: {
        email: process.env.EMAIL_FROM || 'noreply@redclay.com',
        name: process.env.EMAIL_FROM_NAME || 'Red Clay Tennis'
      },
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || params.html.replace(/<[^>]*>/g, ''),
    })

    console.log(`Email sent to ${params.to}: ${params.subject}`)
  } catch (error) {
    console.error('Email send error:', error)
    throw error
  }
}

// Email templates
export async function sendBookingConfirmation(booking: any, user: any, court: any) {
  const html = `
    <h2>Booking Confirmed</h2>
    <p>Hi ${user.full_name},</p>
    <p>Your booking has been confirmed!</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>Court: ${court.name}</li>
      <li>Date: ${booking.booking_date}</li>
      <li>Time: ${booking.start_time} - ${booking.end_time}</li>
      <li>Total: $${(booking.court_fee + booking.trainer_fee).toFixed(2)}</li>
    </ul>
    <p>See you on the court!</p>
  `

  await sendEmail({
    to: user.email,
    subject: 'Booking Confirmed - Red Clay Tennis',
    html,
  })
}

export async function sendBookingCancellation(booking: any, user: any, court: any) {
  const html = `
    <h2>Booking Cancelled</h2>
    <p>Hi ${user.full_name},</p>
    <p>Your booking has been cancelled.</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>Court: ${court.name}</li>
      <li>Date: ${booking.booking_date}</li>
      <li>Time: ${booking.start_time} - ${booking.end_time}</li>
    </ul>
    <p>If you need to rebook, please visit our platform.</p>
  `

  await sendEmail({
    to: user.email,
    subject: 'Booking Cancelled - Red Clay Tennis',
    html,
  })
}

export async function sendWelcomeEmail(user: any) {
  const html = `
    <h2>Welcome to Red Clay Tennis!</h2>
    <p>Hi ${user.full_name},</p>
    <p>Thanks for joining Red Clay Tennis. Your account has been created successfully.</p>
    <p>You can now book courts and manage your bookings through our platform.</p>
    <p>If you're a new user, please note that your bookings will require admin approval.</p>
    <p>Happy playing!</p>
  `

  await sendEmail({
    to: user.email,
    subject: 'Welcome to Red Clay Tennis',
    html,
  })
}

export async function sendUserApprovalEmail(user: any) {
  const html = `
    <h2>Account Approved!</h2>
    <p>Hi ${user.full_name},</p>
    <p>Great news! Your account has been upgraded to Premium status.</p>
    <p>You can now enjoy instant booking confirmations without admin approval.</p>
    <p>Start booking your favorite courts today!</p>
  `

  await sendEmail({
    to: user.email,
    subject: 'Account Upgraded - Red Clay Tennis',
    html,
  })
}
