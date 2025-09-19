import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limiting'
import {
  HttpError,
  UnauthorizedError,
  requireUser,
} from '@server/auth'
import {
  getNotificationPreferences,
  notificationPreferenceUpdateSchema,
  updateNotificationPreferences,
} from '@server/notifications'

const RATE_LIMIT_ENDPOINT: Parameters<typeof checkRateLimit>[1] =
  'update_notification_prefs'

export async function GET() {
  try {
    const user = await requireUser()
    const preferences = await getNotificationPreferences(user.id)

    return NextResponse.json({ preferences })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Failed to load notification preferences', error)
    return NextResponse.json(
      { error: 'Failed to load notification preferences' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser()

    const rateLimit = await checkRateLimit(user.id, RATE_LIMIT_ENDPOINT)
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 1000),
      )

      return NextResponse.json(
        {
          error: 'Too many updates. Please try again later.',
          retryAfter: rateLimit.resetTime.toISOString(),
        },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
      )
    }

    const body = await request.json()
    const parsed = notificationPreferenceUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const preferences = await updateNotificationPreferences(user.id, parsed.data)

    return NextResponse.json({ preferences })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    console.error('Failed to update notification preferences', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 },
    )
  }
}
