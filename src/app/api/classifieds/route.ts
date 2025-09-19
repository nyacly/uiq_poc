import { NextResponse } from 'next/server'
import { z } from 'zod'

import { checkRateLimit } from '@/lib/rate-limiting'
import {
  checkQuota,
  getUsageCount,
  getUserSubscriptionTier,
  incrementUsage,
} from '@server/usage'
import {
  classifiedCreateSchema,
  createClassified,
  listClassifieds,
  serializeClassified,
} from '@server/classifieds'
import { HttpError, getSessionUser, requireUser } from '@server/auth'
import type { SubscriptionPlan } from '@shared/schema'

const querySchema = z.object({
  q: z.string().trim().min(2).max(255).optional(),
  category: z.string().trim().min(2).max(120).optional(),
})

const RATE_LIMIT_ENDPOINT: Parameters<typeof checkRateLimit>[1] = 'post_listing'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get('q')
    const rawCategory = searchParams.get('category')

    const parsed = querySchema.safeParse({
      q: rawQuery && rawQuery.trim().length > 0 ? rawQuery.trim() : undefined,
      category:
        rawCategory && rawCategory.trim().length > 0 ? rawCategory.trim() : undefined,
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
    const classifieds = await listClassifieds({
      query: parsed.data.q,
      category: parsed.data.category,
      sessionUser,
    })

    return NextResponse.json({
      classifieds: classifieds.map(serializeClassified),
    })
  } catch (error) {
    console.error('Failed to list classifieds', error)
    return NextResponse.json(
      { error: 'Failed to load classifieds' },
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
          error: 'Too many listing submissions. Please try again later.',
          retryAfter: rateLimit.resetTime.toISOString(),
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSeconds) },
        },
      )
    }

    let quota: ReturnType<typeof checkQuota> | null = null
    let subscriptionTier: SubscriptionPlan | null = null

    if (user.role !== 'admin') {
      subscriptionTier = await getUserSubscriptionTier(user.id)
      quota = checkQuota(subscriptionTier, 'classifieds')

      if (quota.limit !== null) {
        const currentUsage = await getUsageCount(user.id, quota.period, 'classifieds')

        if (currentUsage >= quota.limit) {
          return NextResponse.json(
            {
              error: 'You have reached your monthly classified limit on the Free plan.',
              limit: quota.limit,
              period: quota.period,
              tier: subscriptionTier,
            },
            { status: 429 },
          )
        }
      }
    }

    const body = await request.json()
    const parsed = classifiedCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const classified = await createClassified(parsed.data, user.id)

    if (user.role !== 'admin' && quota) {
      await incrementUsage(user.id, quota.period, 'classifieds')
    }

    return NextResponse.json(
      { classified: serializeClassified(classified) },
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

    console.error('Failed to create classified', error)
    return NextResponse.json(
      { error: 'Failed to create classified' },
      { status: 500 },
    )
  }
}
