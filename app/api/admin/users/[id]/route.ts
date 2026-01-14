import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { updateUser, getUserStats } from '@/lib/services/admin.service'
import { z } from 'zod'

const updateUserSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone_number: z.string().optional(),
  user_type: z.enum(['standard', 'premium']).optional(),
  app_role: z.enum(['user', 'admin']).optional(),
  is_active: z.boolean().optional(),
})

// GET /api/admin/users/:id - Get user details with stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  const adminCheck = requireAdmin(user)
  if (adminCheck) return adminCheck

  try {
    const { id } = await params
    const userId = id
    const stats = await getUserStats(userId)

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Get user stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users/:id - Update user details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  const adminCheck = requireAdmin(user)
  if (adminCheck) return adminCheck

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)
    const userId = id

    const updatedUser = await updateUser(userId, validatedData)

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (error.message === 'User not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    if (error.message === 'No valid fields to update') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
