import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getUserPackages, purchasePackage } from '@/lib/services/package.service'
import { z } from 'zod'

const purchaseSchema = z.object({
  package_id: z.string().uuid(),
})

// GET /api/user-packages - Get user's packages
export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  try {
    const packages = await getUserPackages(user.userId)
    return NextResponse.json({ packages })
  } catch (error) {
    console.error('Get user packages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user packages' },
      { status: 500 }
    )
  }
}

// POST /api/user-packages - Purchase a package
export async function POST(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  try {
    const body = await request.json()
    const { package_id } = purchaseSchema.parse(body)

    const result = await purchasePackage(user.userId, package_id)

    return NextResponse.json(
      {
        message: 'Package purchase initiated. Complete payment to activate.',
        userPackage: result.userPackage,
        package: result.package,
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

    if (error.message === 'Package not found or inactive') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    console.error('Purchase package error:', error)
    return NextResponse.json(
      { error: 'Failed to purchase package' },
      { status: 500 }
    )
  }
}
