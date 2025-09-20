import { NextResponse } from 'next/server'
import { z } from 'zod'

import { checkRateLimit } from '@/lib/rate-limiting'
import {
  HttpError,
  ensureOwnerOrAdmin,
  getSessionUser,
  requireUser,
} from '@server/auth'
import {
  deleteEvent,
  eventUpdateSchema,
  getEventById,
  serializeEvent,
  updateEvent,
} from '@server/events'

const idSchema = z.string().uuid()
const RATE_LIMIT_ENDPOINT: Parameters<typeof checkRateLimit>[1] = 'post_event'

type RouteContext = {
  params: { eventId: string }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const idResult = idSchema.safeParse(context.params.eventId)
    if (!idResult.success) {
      return NextResponse.json({ error: 'Invalid event id' }, { status: 400 })
    }

    const sessionUser = await getSessionUser()
    const event = await getEventById(idResult.data)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const isAdmin = sessionUser?.role === 'admin'
    const isOwner = sessionUser?.id === event.organizerId

    if (!isAdmin && !isOwner) {
      if (event.status !== 'published') {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }

      if (event.visibility === 'private') {
        return NextResponse.json(
          { error: 'You do not have permission to view this event' },
          { status: sessionUser ? 403 : 404 },
        )
      }

      if (event.visibility === 'members' && !sessionUser) {
        return NextResponse.json(
          { error: 'Authentication required to view this event' },
          { status: 401 },
        )
      }
    }

    return NextResponse.json({ event: serializeEvent(event) })
  } catch (error) {
    console.error('Failed to load event', error)
    return NextResponse.json(
      { error: 'Failed to load event' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const idResult = idSchema.safeParse(context.params.eventId)
    if (!idResult.success) {
      return NextResponse.json({ error: 'Invalid event id' }, { status: 400 })
    }

    const user = await requireUser()
    const event = await getEventById(idResult.data)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    ensureOwnerOrAdmin(user, event.organizerId)

    const rateLimit = await checkRateLimit(user.id, RATE_LIMIT_ENDPOINT)
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 1000),
      )

      return NextResponse.json(
        {
          error: 'Too many event updates. Please try again later.',
          retryAfter: rateLimit.resetTime.toISOString(),
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSeconds) },
        },
      )
    }

    const body = await request.json()
    const parsed = eventUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const updated = await updateEvent(event, parsed.data)

    return NextResponse.json({ event: serializeEvent(updated) })
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

    console.error('Failed to update event', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const idResult = idSchema.safeParse(context.params.eventId)
    if (!idResult.success) {
      return NextResponse.json({ error: 'Invalid event id' }, { status: 400 })
    }

    const user = await requireUser()
    const event = await getEventById(idResult.data)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    ensureOwnerOrAdmin(user, event.organizerId)

    const rateLimit = await checkRateLimit(user.id, RATE_LIMIT_ENDPOINT)
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 1000),
      )

      return NextResponse.json(
        {
          error: 'Too many event updates. Please try again later.',
          retryAfter: rateLimit.resetTime.toISOString(),
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSeconds) },
        },
      )
    }

    await deleteEvent(event.id)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Failed to delete event', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 },
    )
  }
}
