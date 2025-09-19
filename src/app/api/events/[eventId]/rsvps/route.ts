import { NextResponse } from 'next/server'
import { z } from 'zod'

import { checkRateLimit } from '@/lib/rate-limiting'
import { HttpError, requireUser } from '@server/auth'
import { createEventRsvp, serializeRsvp } from '@server/rsvps'
import { rsvpCreateSchema } from '@shared/models/rsvp'

const idSchema = z.string().uuid()
const RATE_LIMIT_ENDPOINT: Parameters<typeof checkRateLimit>[1] = 'post_rsvp'

type RouteContext = {
  params: { eventId: string }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const idResult = idSchema.safeParse(context.params.eventId)

    if (!idResult.success) {
      return NextResponse.json({ error: 'Invalid event id' }, { status: 400 })
    }

    const user = await requireUser()

    const rateLimit = await checkRateLimit(user.id, RATE_LIMIT_ENDPOINT)
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 1000),
      )

      return NextResponse.json(
        {
          error: 'Too many RSVPs. Please try again later.',
          retryAfter: rateLimit.resetTime.toISOString(),
        },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
      )
    }

    const body = await request.json()
    const parsed = rsvpCreateSchema.safeParse({
      ...body,
      eventId: idResult.data,
    })

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const rsvp = await createEventRsvp(parsed.data, user)

    return NextResponse.json({ rsvp: serializeRsvp(rsvp) }, { status: 201 })
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    console.error('Failed to create RSVP', error)
    return NextResponse.json({ error: 'Failed to create RSVP' }, { status: 500 })
  }
}
