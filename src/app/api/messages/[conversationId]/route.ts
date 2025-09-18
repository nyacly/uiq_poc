import { NextResponse } from 'next/server'
import { z } from 'zod'

import { checkRateLimit } from '@/lib/rate-limiting'
import { HttpError, requireUser } from '@server/auth'
import {
  addMessageToConversation,
  getConversationMessages,
  messageCreateSchema,
  serializeConversation,
  serializeMessage,
} from '@server/messages'

const RATE_LIMIT_ENDPOINT: Parameters<typeof checkRateLimit>[1] = 'post_message'

const conversationIdSchema = z.string().uuid()

type RouteContext = {
  params: { conversationId: string }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const idResult = conversationIdSchema.safeParse(context.params.conversationId)

    if (!idResult.success) {
      return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 })
    }

    const user = await requireUser()
    const result = await getConversationMessages(idResult.data, user)

    return NextResponse.json({
      conversation: serializeConversation(result.conversation),
      messages: result.messages.map(serializeMessage),
      unreadCount: result.unreadCount,
    })
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Failed to load messages', error)
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const idResult = conversationIdSchema.safeParse(context.params.conversationId)

    if (!idResult.success) {
      return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 })
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
    const parsed = messageCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const result = await addMessageToConversation(idResult.data, parsed.data, user)

    return NextResponse.json(
      {
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

    console.error('Failed to send message', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
