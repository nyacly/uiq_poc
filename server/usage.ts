import { and, desc, eq, inArray } from 'drizzle-orm'

import { db, subscriptions, usage, type SubscriptionPlan, type SubscriptionStatus } from '@/lib/db'

export type UsagePeriod = 'day' | 'month'
export type UsageKind = 'classifieds' | 'announcements' | 'messages'

type UsageQuota = {
  period: UsagePeriod
  limit: number | null
}

type UsageConfig = {
  feature: string
  action: string
  period: UsagePeriod
  limits: Record<SubscriptionPlan, number | null>
}

const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ['active', 'trialing']

const USAGE_CONFIG: Record<UsageKind, UsageConfig> = {
  classifieds: {
    feature: 'classifieds',
    action: 'create',
    period: 'month',
    limits: {
      free: 2,
      plus: null,
      family: null,
    },
  },
  announcements: {
    feature: 'announcements',
    action: 'create',
    period: 'month',
    limits: {
      free: 1,
      plus: null,
      family: null,
    },
  },
  messages: {
    feature: 'messages',
    action: 'send',
    period: 'day',
    limits: {
      free: 200,
      plus: null,
      family: null,
    },
  },
}

const DEFAULT_SUBSCRIPTION_TIER: SubscriptionPlan = 'free'

const startOfDayUtc = (reference: Date) => {
  const start = new Date(reference)
  start.setUTCHours(0, 0, 0, 0)
  return start
}

const startOfMonthUtc = (reference: Date) => {
  const start = new Date(reference)
  start.setUTCDate(1)
  start.setUTCHours(0, 0, 0, 0)
  return start
}

const resolveWindowBounds = (period: UsagePeriod, reference = new Date()) => {
  if (period === 'day') {
    const windowStart = startOfDayUtc(reference)
    const windowEnd = new Date(windowStart)
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 1)
    return { windowStart, windowEnd }
  }

  const windowStart = startOfMonthUtc(reference)
  const windowEnd = new Date(windowStart)
  windowEnd.setUTCMonth(windowEnd.getUTCMonth() + 1)
  return { windowStart, windowEnd }
}

const getUsageConfig = (kind: UsageKind): UsageConfig => {
  return USAGE_CONFIG[kind]
}

export function checkQuota(tier: SubscriptionPlan, kind: UsageKind): UsageQuota {
  const config = getUsageConfig(kind)
  return {
    period: config.period,
    limit: config.limits[tier] ?? null,
  }
}

export async function getUserSubscriptionTier(userId: string): Promise<SubscriptionPlan> {
  const [subscription] = await db
    .select({ plan: subscriptions.plan })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        inArray(subscriptions.status, ACTIVE_SUBSCRIPTION_STATUSES),
      ),
    )
    .orderBy(desc(subscriptions.currentPeriodEnd))
    .limit(1)

  return subscription?.plan ?? DEFAULT_SUBSCRIPTION_TIER
}

export async function getUsageCount(
  userId: string,
  period: UsagePeriod,
  kind: UsageKind,
): Promise<number> {
  const config = getUsageConfig(kind)
  const { windowStart } = resolveWindowBounds(period)

  const [record] = await db
    .select({ count: usage.count })
    .from(usage)
    .where(
      and(
        eq(usage.scope, 'user'),
        eq(usage.userId, userId),
        eq(usage.feature, config.feature),
        eq(usage.action, config.action),
        eq(usage.windowStart, windowStart),
      ),
    )
    .limit(1)

  return record?.count ?? 0
}

export async function incrementUsage(
  userId: string,
  period: UsagePeriod,
  kind: UsageKind,
): Promise<number> {
  const config = getUsageConfig(kind)
  const { windowStart, windowEnd } = resolveWindowBounds(period)

  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: usage.id, count: usage.count })
      .from(usage)
      .where(
        and(
          eq(usage.scope, 'user'),
          eq(usage.userId, userId),
          eq(usage.feature, config.feature),
          eq(usage.action, config.action),
          eq(usage.windowStart, windowStart),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      const nextCount = existing[0].count + 1

      await tx
        .update(usage)
        .set({ count: nextCount, windowEnd })
        .where(eq(usage.id, existing[0].id))

      return nextCount
    }

    const [inserted] = await tx
      .insert(usage)
      .values({
        scope: 'user',
        userId,
        businessId: null,
        feature: config.feature,
        action: config.action,
        count: 1,
        windowStart,
        windowEnd,
      })
      .returning({ count: usage.count })

    return inserted?.count ?? 1
  })
}
