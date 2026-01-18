import { query } from '@/lib/db'

export async function getUserById(userId: string) {
  const result = await query(
    'SELECT id, email, full_name, phone_number, user_type, app_role, profile_image_url, created_at FROM users WHERE id = $1',
    [userId]
  )
  return result.rows[0]
}

export async function updateUserProfile(userId: string, updates: any) {
  const { full_name, phone_number, profile_image_url } = updates

  const result = await query(
    `UPDATE users
     SET full_name = COALESCE($2, full_name),
         phone_number = COALESCE($3, phone_number),
         profile_image_url = COALESCE($4, profile_image_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id, email, full_name, phone_number, user_type, app_role, profile_image_url`,
    [userId, full_name, phone_number, profile_image_url]
  )

  return result.rows[0]
}

export async function upgradeUserToPremium(userId: string, approvedBy: string) {
  const result = await query(
    `UPDATE users
     SET user_type = 'premium',
         approved_at = CURRENT_TIMESTAMP,
         approved_by = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [userId, approvedBy]
  )

  return result.rows[0]
}
