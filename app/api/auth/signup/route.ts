import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'
import { signToken } from '@/lib/auth/jwt'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  phone_number: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    // Hash password
    const passwordHash = await hashPassword(validatedData.password)

    // Start transaction
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Insert user
      const userResult = await client.query(
        `INSERT INTO users (email, full_name, phone_number)
         VALUES ($1, $2, $3)
         RETURNING id, email, full_name, user_type, app_role, created_at`,
        [validatedData.email, validatedData.full_name, validatedData.phone_number]
      )

      const user = userResult.rows[0]

      // Store password hash
      await client.query(
        'INSERT INTO user_auth (user_id, password_hash) VALUES ($1, $2)',
        [user.id, passwordHash]
      )

      await client.query('COMMIT')

      // Generate JWT token
      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.app_role,
        userType: user.user_type,
      })

      // TODO: Send welcome email

      return NextResponse.json(
        {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            user_type: user.user_type,
            app_role: user.app_role,
          },
          token,
        },
        { status: 201 }
      )

    } catch (error: any) {
      await client.query('ROLLBACK')

      // Handle duplicate email
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        )
      }
      throw error

    } finally {
      client.release()
    }

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
