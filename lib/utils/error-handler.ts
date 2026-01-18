import { NextResponse } from 'next/server'
import { AppError } from '@/types/errors'
import { ZodError } from 'zod'

export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues
      },
      { status: 400 }
    )
  }

  // Custom app errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code
      },
      { status: error.statusCode }
    )
  }

  // Database errors
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as any

    // Unique constraint violation
    if (dbError.code === '23505') {
      return NextResponse.json(
        { error: 'Resource already exists', code: 'DUPLICATE' },
        { status: 409 }
      )
    }

    // Foreign key violation
    if (dbError.code === '23503') {
      return NextResponse.json(
        { error: 'Referenced resource not found', code: 'INVALID_REFERENCE' },
        { status: 400 }
      )
    }
  }

  // Generic error
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    },
    { status: 500 }
  )
}
