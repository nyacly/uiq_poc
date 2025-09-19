import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '../../../../../server/auth'

export async function GET(_request: NextRequest) {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      id: sessionUser.id,
      email: sessionUser.email,
      role: sessionUser.role,
      status: sessionUser.status,
      membershipTier: sessionUser.membershipTier
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    )
  }
}