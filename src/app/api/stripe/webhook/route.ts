import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

import {
  db,
  prisma,
  subscriptions,
  users,
  subscriptionStatuses,
  membershipTiers,
  type SubscriptionStatus,
  type MembershipTier
} from '@/lib/db'

type SubscriptionEventType =
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'

type ExistingSubscriptionRecord = {
  id: string
  userId: string | null
  businessId: string | null
  currentPeriodStart: Date
  currentPeriodEnd: Date
  providerCustomerId: string | null
  metadata: Record<string, string>
}

const SUPPORTED_EVENTS: ReadonlySet<SubscriptionEventType> = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted'
])

const baseEventSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.unknown()
  })
})

const metadataSchema = z.record(z.string()).optional()

const priceProductSchema = z
  .object({
    metadata: z.record(z.string()).optional()
  })
  .partial()

const priceSchema = z
  .object({
    metadata: z.record(z.string()).optional(),
    product: z.union([z.string(), priceProductSchema]).optional()
  })
  .partial()

const subscriptionItemSchema = z.object({
  price: priceSchema.optional()
})

const subscriptionPayloadSchema = z.object({
  id: z.string(),
  status: z.string().optional(),
  customer: z.union([z.string(), z.object({ id: z.string() })]).optional(),
  metadata: metadataSchema,
  items: z
    .object({
      data: z.array(subscriptionItemSchema)
    })
    .optional(),
  current_period_start: z.number().optional(),
  current_period_end: z.number().optional(),
  cancel_at: z.number().nullable().optional(),
  canceled_at: z.number().nullable().optional(),
  trial_end: z.number().nullable().optional()
})

type StripeSubscriptionPayload = z.infer<typeof subscriptionPayloadSchema>

const membershipTierSchema = z.enum(membershipTiers)
const subscriptionStatusSchema = z.enum(subscriptionStatuses)

// TODO: verify Stripe webhook signatures when secrets are available
export async function POST(request: NextRequest) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch (error) {
    console.error('Stripe webhook: failed to parse JSON body', error)
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const baseParse = baseEventSchema.safeParse(payload)
  if (!baseParse.success) {
    return NextResponse.json({ error: 'Malformed Stripe event' }, { status: 400 })
  }

  const { type, data } = baseParse.data

  if (!SUPPORTED_EVENTS.has(type as SubscriptionEventType)) {
    return NextResponse.json({ received: true })
  }

  const subscriptionParse = subscriptionPayloadSchema.safeParse(data.object)
  if (!subscriptionParse.success) {
    console.error('Stripe webhook: invalid subscription payload', subscriptionParse.error.flatten())
    return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 })
  }

  const eventType = type as SubscriptionEventType
  const subscription = subscriptionParse.data

  try {
    await handleSubscriptionEvent(eventType, subscription)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook: failed to process subscription event', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriptionEvent(
  eventType: SubscriptionEventType,
  subscription: StripeSubscriptionPayload
) {
  const [existing] = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      businessId: subscriptions.businessId,
      currentPeriodStart: subscriptions.currentPeriodStart,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      providerCustomerId: subscriptions.providerCustomerId,
      metadata: subscriptions.metadata
    })
    .from(subscriptions)
    .where(eq(subscriptions.providerSubscriptionId, subscription.id))
    .limit(1)

  const existingRecord: ExistingSubscriptionRecord | null = existing
    ? {
        id: existing.id,
        userId: existing.userId,
        businessId: existing.businessId,
        currentPeriodStart: existing.currentPeriodStart,
        currentPeriodEnd: existing.currentPeriodEnd,
        providerCustomerId: existing.providerCustomerId,
        metadata: (existing.metadata as Record<string, string>) ?? {}
      }
    : null

  const userId = await resolveUserId(subscription, existingRecord)
  if (!userId) {
    throw new Error(`Unable to resolve user for subscription ${subscription.id}`)
  }

  const targetTier = eventType === 'customer.subscription.deleted'
    ? 'FREE'
    : resolveTier(subscription)

  const targetStatus = eventType === 'customer.subscription.deleted'
    ? 'canceled'
    : resolveStatus(subscription.status)

  const stripeCustomerId = getStripeId(subscription.customer) ?? existingRecord?.providerCustomerId ?? null

  const currentPeriodStart = toDate(subscription.current_period_start, existingRecord?.currentPeriodStart)
  const currentPeriodEnd = toDate(subscription.current_period_end, existingRecord?.currentPeriodEnd ?? currentPeriodStart)
  const cancelAt = toDate(subscription.cancel_at)
  const canceledAt = toDate(subscription.canceled_at)
  const trialEndsAt = toDate(subscription.trial_end)
  const metadata = { ...(existingRecord?.metadata ?? {}), ...(subscription.metadata ?? {}) }

  if (existingRecord) {
    await db
      .update(subscriptions)
      .set({
        currentTier: targetTier,
        status: targetStatus,
        providerCustomerId: stripeCustomerId,
        currentPeriodStart: currentPeriodStart ?? existingRecord.currentPeriodStart,
        currentPeriodEnd: currentPeriodEnd ?? existingRecord.currentPeriodEnd,
        cancelAt,
        canceledAt,
        trialEndsAt,
        metadata,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, existingRecord.id))
  } else {
    const periodStart = currentPeriodStart ?? new Date()
    const periodEnd = currentPeriodEnd ?? periodStart

    await db.insert(subscriptions).values({
      userId,
      businessId: null,
      currentTier: targetTier,
      status: targetStatus,
      provider: 'stripe',
      providerCustomerId: stripeCustomerId,
      providerSubscriptionId: subscription.id,
      trialEndsAt,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAt,
      canceledAt,
      metadata
    })
  }

  await updateUserMembership(userId, targetTier)
}

async function resolveUserId(
  subscription: StripeSubscriptionPayload,
  existing: ExistingSubscriptionRecord | null
): Promise<string | null> {
  const metadata = subscription.metadata ?? existing?.metadata ?? {}
  const metadataUserId =
    metadata.userId ||
    metadata.user_id ||
    metadata.userID ||
    metadata.USER_ID

  if (metadataUserId) {
    return metadataUserId
  }

  if (existing?.userId) {
    return existing.userId
  }

  const customerId = getStripeId(subscription.customer) ?? existing?.providerCustomerId
  if (!customerId) {
    return null
  }

  const [found] = await db
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.providerCustomerId, customerId))
    .limit(1)

  return found?.userId ?? null
}

function resolveTier(subscription: StripeSubscriptionPayload): MembershipTier {
  const metadataTier =
    subscription.metadata?.tier ??
    subscription.metadata?.Tier ??
    subscription.metadata?.membershipTier ??
    subscription.metadata?.membership_tier

  const priceTier = subscription.items?.data?.[0]?.price?.metadata?.tier
  const productTier =
    typeof subscription.items?.data?.[0]?.price?.product === 'object'
      ? subscription.items?.data?.[0]?.price?.product.metadata?.tier
      : undefined

  return normaliseTier(metadataTier ?? priceTier ?? productTier)
}

function normaliseTier(value: string | undefined | null): MembershipTier {
  if (!value) {
    return 'FREE'
  }

  const normalised = value.trim().toUpperCase()
  const parsed = membershipTierSchema.safeParse(normalised)
  return parsed.success ? parsed.data : 'FREE'
}

function resolveStatus(status: string | undefined | null): SubscriptionStatus {
  if (!status) {
    return 'incomplete'
  }

  const parsed = subscriptionStatusSchema.safeParse(status)
  return parsed.success ? parsed.data : 'incomplete'
}

function toDate(value: number | null | undefined, fallback?: Date | null): Date | null {
  if (typeof value === 'number') {
    return new Date(value * 1000)
  }

  return fallback ?? null
}

function getStripeId(
  value: StripeSubscriptionPayload['customer']
): string | null {
  if (!value) {
    return null
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && 'id' in value && typeof value.id === 'string') {
    return value.id
  }

  return null
}

async function updateUserMembership(userId: string, tier: MembershipTier) {
  const now = new Date()

  try {
    await db
      .update(users)
      .set({
        membershipTier: tier,
        updatedAt: now
      })
      .where(eq(users.id, userId))
  } catch (error) {
    console.error('Stripe webhook: failed to update membership in Postgres', error)
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { membershipTier: tier }
    })
  } catch (error) {
    console.error('Stripe webhook: failed to update membership in Prisma store', error)
  }
}
