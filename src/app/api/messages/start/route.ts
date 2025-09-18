import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limiting'
import { HttpError, requireUser } from '@server/auth'
import {
  serializeConversation,
  serializeMessage,
  startConversation,
  startConversationSchema,
} from '@server/messages'

const RATE_LIMIT_ENDPOINT: Parameters<typeof checkRateLimit>[1] = 'post_message'

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
          error: 'Too many messages. Please try again later.',
          retryAfter: rateLimit.resetTime.toISOString(),
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSeconds) },
        },
      )
    }

    const body = await request.json()
    const parsed = startConversationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const result = await startConversation(parsed.data, user)

    return NextResponse.json(
      {
        conversation: serializeConversation(result.conversation),
        message: serializeMessage(result.message),
        unreadCount: result.unreadCount,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    console.error('Failed to start conversation', error)
    return NextResponse.json(
      { error: 'Failed to start conversation' },
      { status: 500 },
    )
  }
}
