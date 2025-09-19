import { NextResponse } from 'next/server'
import { z } from 'zod'

import { checkRateLimit } from '@/lib/rate-limiting'
import { setClassifiedVisibility } from '@server/admin'
import { HttpError, requireUser, UnauthorizedError } from '@server/auth'

const idSchema = z.string().uuid()
const bodySchema = z.object({ hidden: z.boolean() })

type RouteContext = {
  params: { classifiedId: string }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser()

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rateLimit = await checkRateLimit(user.id, 'admin_action')

    if (!rateLimit.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 1000))
      return NextResponse.json(
        {
          error: 'Too many admin actions. Please slow down.',
          retryAfter: rateLimit.resetTime.toISOString(),
        },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      )
    }

    const idResult = idSchema.safeParse(context.params.classifiedId)

    if (!idResult.success) {
      return NextResponse.json({ error: 'Invalid classified id' }, { status: 400 })
    }

    const payload = bodySchema.safeParse(await request.json())

    if (!payload.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: payload.error.flatten(),
        },
        { status: 400 },
      )
    }

    const status = await setClassifiedVisibility(idResult.data, payload.data.hidden)

    return NextResponse.json({ status })
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

    console.error('Failed to update classified visibility', error)
    return NextResponse.json({ error: 'Failed to update classified visibility' }, { status: 500 })
  }
}
