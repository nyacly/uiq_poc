import { NextResponse } from 'next/server'

import { HttpError, requireUser } from '@server/auth'
import { getAdminOverview } from '@server/admin'

export async function GET() {
  try {
    const user = await requireUser()

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const overview = await getAdminOverview()

    return NextResponse.json({ overview })
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Failed to load admin overview', error)
    return NextResponse.json({ error: 'Failed to load admin overview' }, { status: 500 })
  }
}
