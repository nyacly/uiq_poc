import { NextRequest, NextResponse } from 'next/server'
import { createBillingPortalSession } from '@/lib/stripe'
import { db, stripeCustomers, businesses, users } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireUser, ensureOwnerOrAdmin, HttpError } from '../../../../../server/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()

    const body = await request.json()
    const { businessId, returnUrl } = body

    // Find the Stripe customer ID
    let stripeCustomerId: string | null = null

    if (businessId) {
      // Business billing portal - verify user owns the business first
      const [business] = await db
        .select({
          id: businesses.id,
          ownerId: businesses.ownerId
        })
        .from(businesses)
        .where(eq(businesses.id, businessId))
        .limit(1)

      if (!business) {
        throw new HttpError(403, 'Business not found or unauthorized')
      }

      ensureOwnerOrAdmin(user, business.ownerId)

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
      const [account] = await db
        .select({ stripeCustomerId: users.stripeCustomerId })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)

      if (account?.stripeCustomerId) {
        stripeCustomerId = account.stripeCustomerId
      }

      if (!stripeCustomerId) {
        const customer = await db
          .select()
          .from(stripeCustomers)
          .where(eq(stripeCustomers.userId, user.id))
          .limit(1)

        if (customer.length > 0) {
          stripeCustomerId = customer[0].stripeCustomerId
        }
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

  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating billing portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create billing portal session' , message: errorMessage},
      { status: 500 }
    )
  }
}