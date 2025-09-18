import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limiting'
import { HttpError, getSessionUser, requireUser } from '@server/auth'
import {
  announcementCreateSchema,
  createAnnouncement,
  listAnnouncements,
  serializeAnnouncement,
} from '@server/announcements'

const RATE_LIMIT_ENDPOINT: Parameters<typeof checkRateLimit>[1] = 'post_announcement'

export async function GET() {
  try {
    const sessionUser = await getSessionUser()
    const announcements = await listAnnouncements({ sessionUser })

    return NextResponse.json({
      announcements: announcements.map(serializeAnnouncement),
    })
  } catch (error) {
    console.error('Failed to list announcements', error)
    return NextResponse.json(
      { error: 'Failed to load announcements' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
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
          error: 'Too many announcements submitted. Please try again later.',
          retryAfter: rateLimit.resetTime.toISOString(),
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSeconds) },
        },
      )
    }

    const body = await request.json()
    const parsed = announcementCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const announcement = await createAnnouncement(parsed.data, user)

    return NextResponse.json(
      { announcement: serializeAnnouncement(announcement) },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 },
      )
    }

    console.error('Failed to create announcement', error)
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 },
    )
  }
}
