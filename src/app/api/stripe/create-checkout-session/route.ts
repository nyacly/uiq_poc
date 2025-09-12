import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'
import { auth } from '@/lib/auth'
import { db, stripePrices, businesses } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Skip rate limiting for now to avoid database table dependency
    // TODO: Implement proper rate limiting after rate_limits table is added
    // const rateLimitResult = await createRateLimitMiddleware('api_general', {
    //   windowMs: 60 * 1000, // 1 minute
    //   maxRequests: 10, // 10 checkout sessions per minute
    // })(request, new Response(), () => {})

    // if (!rateLimitResult.allowed) {
    //   return NextResponse.json(
    //     { error: 'Too many requests. Please try again later.' },
    //     { status: 429 }
    //   )
    // }

    const body = await request.json()
    const { 
      priceId, 
      businessId, 
      mode = 'subscription',
      trialPeriodDays,
      successUrl,
      cancelUrl,
      metadata = {}
    } = body

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Server-side validation: verify priceId exists and is active
    const price = await db
      .select()
      .from(stripePrices)
      .where(and(
        eq(stripePrices.stripePriceId, priceId),
        eq(stripePrices.isActive, true)
      ))
      .limit(1)

    if (price.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or inactive price' },
        { status: 400 }
      )
    }

    // If businessId is provided, verify the user owns this business
    if (businessId) {
      const business = await db
        .select()
        .from(businesses)
        .where(and(
          eq(businesses.id, businessId),
          eq(businesses.ownerRef, session.user.id)
        ))
        .limit(1)

      if (business.length === 0) {
        return NextResponse.json(
          { error: 'Business not found or unauthorized' },
          { status: 403 }
        )
      }
    }

    // Create default URLs if not provided
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const defaultSuccessUrl = successUrl || `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`
    const defaultCancelUrl = cancelUrl || `${baseUrl}/billing/cancel`

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      businessId,
      priceId,
      successUrl: defaultSuccessUrl,
      cancelUrl: defaultCancelUrl,
      mode,
      trialPeriodDays,
      metadata: {
        userId: session.user.id,
        businessId: businessId || '',
        ...metadata
      }
    })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session', message: errorMessage },
      { status: 500 }
    )
  }
}