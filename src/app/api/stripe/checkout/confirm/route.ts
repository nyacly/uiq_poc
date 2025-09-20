import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type Stripe from 'stripe'
import { eq } from 'drizzle-orm'

import { stripe } from '@/lib/stripe'
import { db, subscriptions, users, type MembershipTier } from '@/lib/db'
import { requireUser } from '../../../../../../server/auth'

const payloadSchema = z.object({
  sessionId: z.string().min(1),
})

const VALID_TIERS: MembershipTier[] = ['FREE', 'PLUS', 'FAMILY']

function resolveTier(subscription: Stripe.Subscription, session: Stripe.Checkout.Session): MembershipTier {
  const potential =
    session.metadata?.membershipTier ??
    subscription.metadata?.membershipTier ??
    subscription.metadata?.tier ??
    subscription.items.data[0]?.price?.metadata?.tier ??
    (typeof subscription.items.data[0]?.price?.product === 'object'
      ? (subscription.items.data[0]?.price?.product.metadata?.tier as string | undefined)
      : undefined)

  const normalised = typeof potential === 'string' ? potential.trim().toUpperCase() : 'FREE'
  return (VALID_TIERS.includes(normalised as MembershipTier) ? normalised : 'FREE') as MembershipTier
}

function resolveStatus(status: Stripe.Subscription.Status | undefined) {
  switch (status) {
    case 'active':
    case 'trialing':
    case 'past_due':
    case 'canceled':
    case 'incomplete':
      return status
    default:
      return 'active'
  }
}

function toDate(value: number | null | undefined) {
  return typeof value === 'number' ? new Date(value * 1000) : null
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const payload = await request.json().catch(() => ({}))
    const parsed = payloadSchema.safeParse(payload)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(parsed.data.sessionId, {
      expand: ['subscription', 'subscription.items.data.price.product', 'customer'],
    })

    if (!session.subscription) {
      return NextResponse.json({ error: 'No subscription associated with session' }, { status: 400 })
    }

    const subscription =
      typeof session.subscription === 'string'
        ? await stripe.subscriptions.retrieve(session.subscription, {
            expand: ['items.data.price.product'],
          })
        : session.subscription

    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id ?? (typeof subscription.customer === 'string' ? subscription.customer : null)

    if (!customerId) {
      return NextResponse.json({ error: 'Missing Stripe customer' }, { status: 400 })
    }

    const potentialOwnerIds = [
      session.metadata?.userId,
      session.metadata?.user_id,
      session.client_reference_id,
      typeof subscription.metadata?.userId === 'string' ? subscription.metadata.userId : undefined,
      typeof subscription.metadata?.user_id === 'string' ? subscription.metadata.user_id : undefined,
    ]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value): value is string => value.length > 0)

    if (!potentialOwnerIds.includes(user.id)) {
      return NextResponse.json({ error: 'Checkout session does not belong to this user' }, { status: 403 })
    }

    const membershipTier = resolveTier(subscription, session)
    const status = resolveStatus(subscription.status)
    const periodStart = toDate(subscription.current_period_start) ?? new Date()
    const periodEnd = toDate(subscription.current_period_end) ?? periodStart
    const trialEndsAt = toDate(subscription.trial_end)
    const cancelAt = toDate(subscription.cancel_at)
    const canceledAt = toDate(subscription.canceled_at)

    await db
      .update(users)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(users.id, user.id))

    const [existing] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.providerSubscriptionId, subscription.id))
      .limit(1)

    const metadata = {
      ...(subscription.metadata ?? {}),
      ...(session.metadata ?? {}),
    }

    if (existing) {
      await db
        .update(subscriptions)
        .set({
          currentTier: membershipTier,
          status,
          providerCustomerId: customerId,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAt,
          canceledAt,
          trialEndsAt,
          metadata,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existing.id))
    } else {
      await db.insert(subscriptions).values({
        userId: user.id,
        businessId: null,
        currentTier: membershipTier,
        status,
        provider: 'stripe',
        providerCustomerId: customerId,
        providerSubscriptionId: subscription.id,
        trialEndsAt,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAt,
        canceledAt,
        metadata,
      })
    }

    return NextResponse.json({ ok: true, customerId, tier: membershipTier })
  } catch (error) {
    console.error('Failed to confirm checkout session', error)
    return NextResponse.json({ error: 'Failed to confirm checkout' }, { status: 500 })
  }
}
