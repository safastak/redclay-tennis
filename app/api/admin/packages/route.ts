import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { createPackage } from '@/lib/services/package.service'
import { z } from 'zod'

const createPackageSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  price: z.number().positive(),
  sport_type: z.enum(['tennis', 'padel']),
  court_only_sessions: z.number().int().min(0),
  trainer_sessions: z.number().int().min(0),
  validity_days: z.number().int().positive(),
})

// POST /api/admin/packages - Create new package
export async function POST(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  const adminCheck = requireAdmin(user)
  if (adminCheck) return adminCheck

  try {
    const body = await request.json()
    const validatedData = createPackageSchema.parse(body)

    const pkg = await createPackage(validatedData)

    return NextResponse.json(
      {
        message: 'Package created successfully',
        package: pkg,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Create package error:', error)
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    )
  }
}
