/**
 * Stripe Products Initialization API
 * UiQ Community Platform - Production-ready Stripe setup with real IDs
 */

import { NextResponse } from 'next/server'
import { initializeStripeProducts } from '@/lib/stripe'
import { requireUser, isAdmin, HttpError } from '../../../../../../server/auth'

export async function POST() {
  try {
    const user = await requireUser()

    if (!isAdmin(user)) {
      throw new HttpError(403, 'Admin access required')
    }

    console.log('Starting Stripe products initialization...')
    await initializeStripeProducts()
    console.log('Stripe products initialization completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Stripe products have been initialized with real Stripe IDs'
    })
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    console.error('Error initializing Stripe products:', error)
    return NextResponse.json(
      {
        error: 'Failed to initialize Stripe products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}