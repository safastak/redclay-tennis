import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { query } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'
import { NotFoundError } from '@/types/errors'
import { z } from 'zod'

const updatePackageSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  court_only_sessions: z.number().min(0).optional(),
  trainer_sessions: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
  validity_days: z.number().min(1).optional(),
  is_active: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const { id } = await params
    const body = await request.json()
    const updates = updatePackageSchema.parse(body)

    const result = await query(
      `UPDATE packages
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           court_only_sessions = COALESCE($3, court_only_sessions),
           trainer_sessions = COALESCE($4, trainer_sessions),
           price = COALESCE($5, price),
           validity_days = COALESCE($6, validity_days),
           is_active = COALESCE($7, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        updates.name,
        updates.description,
        updates.court_only_sessions,
        updates.trainer_sessions,
        updates.price,
        updates.validity_days,
        updates.is_active,
        id,
      ]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError('Package')
    }

    return NextResponse.json({ package: result.rows[0] })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const { id } = await params

    // Soft delete - just mark as inactive
    const result = await query(
      'UPDATE packages SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError('Package')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
