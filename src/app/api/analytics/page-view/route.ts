import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { db, analyticsEvents } from '@/lib/db'
import { getSessionUser } from '../../../../../server/auth'

const payloadSchema = z.object({
  path: z.string().min(1).max(512),
})

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser()
    const json = await request.json().catch(() => ({}))
    const parsed = payloadSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    await db.insert(analyticsEvents).values({
      kind: 'page_view',
      path: parsed.data.path.slice(0, 512),
      userId: sessionUser?.id ?? null,
      metadata: sessionUser ? { userEmail: sessionUser.email } : {},
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to record page view', error)
    return NextResponse.json({ error: 'Unable to record page view' }, { status: 500 })
  }
}
