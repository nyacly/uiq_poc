/**
 * Stripe Products Seeding API
 * UiQ Community Platform - Populate Stripe Products Database
 */

import { NextResponse } from 'next/server'
import { seedStripeProducts } from '@/lib/stripe'

export async function POST() {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Seeding is only allowed in development' },
        { status: 403 }
      )
    }

    console.log('Starting Stripe products seeding...')
    await seedStripeProducts()
    console.log('Stripe products seeding completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Stripe products have been seeded successfully'
    })
  } catch (error) {
    console.error('Error seeding Stripe products:', error)
    return NextResponse.json(
      { 
        error: 'Failed to seed Stripe products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}