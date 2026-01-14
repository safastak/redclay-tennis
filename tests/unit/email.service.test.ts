import { sendEmail, sendBookingConfirmation, sendWelcomeEmail } from '@/lib/services/email.service'

// Mock SendGrid
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }])
}))

describe('Email Service', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('sendEmail', () => {
    it('should skip sending when EMAIL_API_KEY is not configured', async () => {
      delete process.env.EMAIL_API_KEY

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Email not configured')
      )
      consoleSpy.mockRestore()
    })

    it('should send email when configured', async () => {
      process.env.EMAIL_API_KEY = 'test-key'
      const sgMail = require('@sendgrid/mail')

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test body</p>'
      })

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Subject',
          html: '<p>Test body</p>'
        })
      )
    })
  })

  describe('sendBookingConfirmation', () => {
    it('should send booking confirmation with correct details', async () => {
      process.env.EMAIL_API_KEY = 'test-key'
      const sgMail = require('@sendgrid/mail')

      const booking = {
        booking_date: '2024-01-15',
        start_time: '10:00',
        end_time: '11:00',
        court_fee: 50,
        trainer_fee: 30
      }

      const user = {
        full_name: 'John Doe',
        email: 'john@example.com'
      }

      const court = {
        name: 'Court 1'
      }

      await sendBookingConfirmation(booking, user, court)

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: expect.stringContaining('Booking Confirmed')
        })
      )
    })
  })

  describe('sendWelcomeEmail', () => {
    it('should send welcome email to new user', async () => {
      process.env.EMAIL_API_KEY = 'test-key'
      const sgMail = require('@sendgrid/mail')

      const user = {
        full_name: 'Jane Smith',
        email: 'jane@example.com'
      }

      await sendWelcomeEmail(user)

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'jane@example.com',
          subject: expect.stringContaining('Welcome')
        })
      )
    })
  })
})
