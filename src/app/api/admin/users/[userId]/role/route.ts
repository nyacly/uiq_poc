import { NextResponse } from 'next/server'
import { z } from 'zod'

import { checkRateLimit } from '@/lib/rate-limiting'
import { updateUserRole } from '@server/admin'
import { HttpError, requireUser, UnauthorizedError } from '@server/auth'
import { userRoles } from '@shared/schema'

const idSchema = z.string().uuid()
const bodySchema = z.object({
  role: z.enum(userRoles),
})

type RouteContext = {
  params: { userId: string }
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

    const idResult = idSchema.safeParse(context.params.userId)

    if (!idResult.success) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
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

    await updateUserRole(idResult.data, payload.data.role)

    return NextResponse.json({ success: true })
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

    console.error('Failed to update user role', error)
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
  }
}
