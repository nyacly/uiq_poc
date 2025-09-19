import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limiting'
import {
  checkQuota,
  getUsageCount,
  getUserSubscriptionTier,
  incrementUsage,
} from '@server/usage'
import { HttpError, getSessionUser, requireUser } from '@server/auth'
import type { SubscriptionPlan } from '@shared/schema'
import {
  announcementCreateSchema,
  createAnnouncement,
  listAnnouncements,
  serializeAnnouncement,
} from '@server/announcements'

const RATE_LIMIT_ENDPOINT: Parameters<typeof checkRateLimit>[1] = 'post_announcement'

export async function GET() {
  try {
    const sessionUser = await getSessionUser()
    const announcements = await listAnnouncements({ sessionUser })

    return NextResponse.json({
      announcements: announcements.map(serializeAnnouncement),
    })
  } catch (error) {
    console.error('Failed to list announcements', error)
    return NextResponse.json(
      { error: 'Failed to load announcements' },
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
          error: 'Too many announcements submitted. Please try again later.',
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
      quota = checkQuota(subscriptionTier, 'announcements')

      if (quota.limit !== null) {
        const currentUsage = await getUsageCount(user.id, quota.period, 'announcements')

        if (currentUsage >= quota.limit) {
          return NextResponse.json(
            {
              error: 'You have reached your monthly announcement limit on the Free plan.',
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
    const parsed = announcementCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const announcement = await createAnnouncement(parsed.data, user)

    if (user.role !== 'admin' && quota) {
      await incrementUsage(user.id, quota.period, 'announcements')
    }

    return NextResponse.json(
      { announcement: serializeAnnouncement(announcement) },
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

    console.error('Failed to create announcement', error)
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 },
    )
  }
}
