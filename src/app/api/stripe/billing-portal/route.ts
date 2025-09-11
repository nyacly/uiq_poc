import { NextRequest, NextResponse } from 'next/server'
import { createBillingPortalSession } from '@/lib/stripe'
import { auth } from '@/lib/auth'
import { db, stripeCustomers, users, businesses } from '@/lib/db'
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

    const body = await request.json()
    const { businessId, returnUrl } = body

    // Find the Stripe customer ID
    let stripeCustomerId: string | null = null

    if (businessId) {
      // Business billing portal - verify user owns the business first
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

      // Get Stripe customer for this business
      const customer = await db
        .select()
        .from(stripeCustomers)
        .where(eq(stripeCustomers.businessId, businessId))
        .limit(1)

      if (customer.length > 0) {
        stripeCustomerId = customer[0].stripeCustomerId
      }
    } else {
      // User billing portal
      const customer = await db
        .select()
        .from(stripeCustomers)
        .where(eq(stripeCustomers.userId, session.user.id))
        .limit(1)

      if (customer.length > 0) {
        stripeCustomerId = customer[0].stripeCustomerId
      }
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing information found. Please subscribe to a plan first.' },
        { status: 404 }
      )
    }

    // Create default return URL if not provided
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const defaultReturnUrl = returnUrl || `${baseUrl}/billing`

    // Create billing portal session
    const portalSession = await createBillingPortalSession(stripeCustomerId, defaultReturnUrl)

    return NextResponse.json({
      url: portalSession.url
    })

  } catch (error: any) {
    console.error('Error creating billing portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}