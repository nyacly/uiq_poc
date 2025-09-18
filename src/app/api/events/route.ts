import { NextResponse } from 'next/server'
import { z } from 'zod'

import { checkRateLimit } from '@/lib/rate-limiting'
import { HttpError, getSessionUser, requireUser } from '@server/auth'
import {
  createEvent,
  eventCreateSchema,
  listEvents,
  serializeEvent,
} from '@server/events'

const querySchema = z.object({
  category: z.string().trim().min(2).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
})

const RATE_LIMIT_ENDPOINT: Parameters<typeof checkRateLimit>[1] = 'post_event'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawCategory = searchParams.get('category')
    const rawLimit = searchParams.get('limit')

    const parsed = querySchema.safeParse({
      category: rawCategory && rawCategory.trim().length > 0 ? rawCategory.trim() : undefined,
      limit: rawLimit ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const sessionUser = await getSessionUser()
    const events = await listEvents({
      category: parsed.data.category,
      limit: parsed.data.limit,
      sessionUser,
    })

    return NextResponse.json({ events: events.map(serializeEvent) })
  } catch (error) {
    console.error('Failed to list events', error)
    return NextResponse.json(
      { error: 'Failed to load events' },
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
          error: 'Too many event submissions. Please try again later.',
          retryAfter: rateLimit.resetTime.toISOString(),
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSeconds) },
        },
      )
    }

    const body = await request.json()
    const parsed = eventCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const event = await createEvent(parsed.data, user.id)

    return NextResponse.json({ event: serializeEvent(event) }, { status: 201 })
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

    console.error('Failed to create event', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 },
    )
  }
}
