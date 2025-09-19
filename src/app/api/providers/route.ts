import { NextResponse } from 'next/server'
import { z } from 'zod'

import { checkRateLimit } from '@/lib/rate-limiting'
import { geocodeAddress } from '@/lib/geocode'
import { createProvider, listProviders, providerCreateSchema } from '@server/providers'
import { getSessionUser, requireUser, HttpError } from '@server/auth'

const querySchema = z.object({
  q: z.string().trim().min(2).max(120).optional(),
  suburb: z.string().trim().min(2).max(120).optional(),
  category: z.string().trim().min(2).max(120).optional(),
})

const RATE_LIMIT_ENDPOINT: Parameters<typeof checkRateLimit>[1] = 'post_provider'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const suburb = searchParams.get('suburb')?.trim()
    const category = searchParams.get('category')?.trim()

    const parsed = querySchema.safeParse({
      q: query && query.length > 0 ? query : undefined,
      suburb: suburb && suburb.length > 0 ? suburb : undefined,
      category: category && category.length > 0 ? category : undefined,
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
    const providers = await listProviders({
      query: parsed.data.q,
      suburb: parsed.data.suburb,
      category: parsed.data.category,
      sessionUser,
    })

    return NextResponse.json({ providers })
  } catch (error) {
    console.error('Failed to load providers directory', error)
    return NextResponse.json(
      { error: 'Failed to load providers' },
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
          error: 'Too many provider submissions. Please try again later.',
          retryAfter: rateLimit.resetTime.toISOString(),
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSeconds) },
        },
      )
    }

    const body = await request.json()
    const parsed = providerCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const shouldGeocode =
      typeof mapboxToken === 'string' && mapboxToken.trim().length > 0 &&
      typeof parsed.data.baseLocation === 'string'

    const geocoded = shouldGeocode
      ? await geocodeAddress(parsed.data.baseLocation!, mapboxToken)
      : null

    const providerInput = {
      ...parsed.data,
      suburb: geocoded?.suburb ?? parsed.data.suburb,
    }

    const provider = await createProvider(providerInput, user.id, geocoded)

    return NextResponse.json({ provider }, { status: 201 })
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

    console.error('Failed to create provider', error)
    return NextResponse.json(
      { error: 'Failed to create provider' },
      { status: 500 },
    )
  }
}
