import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limiting'
import {
  deleteProvider,
  getProviderById,
  providerUpdateSchema,
  updateProvider,
} from '@server/providers'
import {
  ensureOwnerOrAdmin,
  getSessionUser,
  requireUser,
  HttpError,
} from '@server/auth'

const RATE_LIMIT_ENDPOINT: Parameters<typeof checkRateLimit>[1] = 'post_provider'

type RouteParams = {
  params: { id: string }
}

const buildRateLimitResponse = (resetTime: Date) => {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))

  return NextResponse.json(
    {
      error: 'Too many modifications. Please try again later.',
      retryAfter: resetTime.toISOString(),
    },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds) },
    },
  )
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const provider = await getProviderById(params.id)

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const sessionUser = await getSessionUser()
    const isOwner = sessionUser && sessionUser.id === provider.userId
    const isAdmin = sessionUser?.role === 'admin'

    if (!provider.isVerified && !isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    return NextResponse.json({ provider })
  } catch (error) {
    console.error('Failed to load provider detail', error)
    return NextResponse.json(
      { error: 'Failed to load provider' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser()
    const provider = await getProviderById(params.id)

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    ensureOwnerOrAdmin(user, provider.userId)

    const rateLimit = await checkRateLimit(user.id, RATE_LIMIT_ENDPOINT)
    if (!rateLimit.allowed) {
      return buildRateLimitResponse(rateLimit.resetTime)
    }

    const body = await request.json()
    const parsed = providerUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    if (parsed.data.isVerified !== undefined && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can verify providers' },
        { status: 403 },
      )
    }

    const hasUpdates = Object.values(parsed.data).some((value) => value !== undefined)
    if (!hasUpdates) {
      return NextResponse.json(
        { error: 'No changes supplied' },
        { status: 400 },
      )
    }

    const updated = await updateProvider(params.id, parsed.data)

    return NextResponse.json({ provider: updated })
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

    console.error('Failed to update provider', error)
    return NextResponse.json(
      { error: 'Failed to update provider' },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser()
    const provider = await getProviderById(params.id)

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    ensureOwnerOrAdmin(user, provider.userId)

    const rateLimit = await checkRateLimit(user.id, RATE_LIMIT_ENDPOINT)
    if (!rateLimit.allowed) {
      return buildRateLimitResponse(rateLimit.resetTime)
    }

    await deleteProvider(params.id)

    return new Response(null, { status: 204 })
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Failed to delete provider', error)
    return NextResponse.json(
      { error: 'Failed to delete provider' },
      { status: 500 },
    )
  }
}
