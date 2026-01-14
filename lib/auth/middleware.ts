import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader, JWTPayload } from './jwt'

export async function requireAuth(request: NextRequest): Promise<JWTPayload | NextResponse> {
  const authHeader = request.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized - No token provided' },
      { status: 401 }
    )
  }

  try {
    const user = verifyToken(token)
    return user
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid token' },
      { status: 401 }
    )
  }
}

export function requireAdmin(user: JWTPayload): NextResponse | null {
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    )
  }
  return null
}

export function requireTrainer(user: JWTPayload): NextResponse | null {
  if (user.role !== 'trainer' && user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Trainer access required' },
      { status: 403 }
    )
  }
  return null
}
