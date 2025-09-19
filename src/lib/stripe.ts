/**
 * Stripe Integration Service
 * UiQ Community Platform - Payment Processing
 */

import Stripe from 'stripe'
import { db, stripe_customers, stripe_products, stripe_prices, stripe_subscriptions, users, businesses, memberships, business_subscriptions } from './db'
import { eq, and } from 'drizzle-orm'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
})

// Product definitions for UiQ Community Platform
export const PRODUCT_DEFINITIONS = {
  // Membership Products
  MEMBER_FREE: {
    name: 'Member_Free',
    description: 'Free community membership with basic features',
    type: 'membership',
    tier: 'free',
    price: 0,
    features: ['Community access', 'Basic profile', 'View listings', 'Join events']
  },
  MEMBER_PLUS: {
    name: 'Member_Plus',
    description: 'Enhanced membership with premium features',
    type: 'membership',
    tier: 'plus',
    monthlyPrice: 999, // $9.99 AUD
    yearlyPrice: 9999, // $99.99 AUD (2 months free)
    features: ['Everything in Free', 'Priority support', 'Advanced search filters', 'Direct messaging', 'Featured profile badge']
  },
  MEMBER_FAMILY: {
    name: 'Member_Family',
    description: 'Family membership for up to 4 family members',
    type: 'membership',
    tier: 'family',
    monthlyPrice: 1999, // $19.99 AUD
    yearlyPrice: 19999, // $199.99 AUD (2 months free)
    features: ['Everything in Plus', 'Up to 4 family members', 'Family event discounts', 'Shared listings']
  },

  // Business Products
  BIZ_BASIC: {
    name: 'Biz_Basic',
    description: 'Basic business listing with essential features',
    type: 'business',
    tier: 'basic',
    monthlyPrice: 2999, // $29.99 AUD
    yearlyPrice: 29999, // $299.99 AUD (2 months free)
    features: ['Business profile', 'Contact information', '5 photos', 'Basic analytics', 'Customer reviews']
  },
  BIZ_STANDARD: {
    name: 'Biz_Standard',
    description: 'Standard business plan with enhanced visibility',
    type: 'business',
    tier: 'standard',
    monthlyPrice: 5999, // $59.99 AUD
    yearlyPrice: 59999, // $599.99 AUD (2 months free)
    features: ['Everything in Basic', 'Featured placement', '15 photos', 'Advanced analytics', 'Direct lead collection', 'Social media integration']
  },
  BIZ_PREMIUM: {
    name: 'Biz_Premium',
    description: 'Premium business plan with maximum exposure',
    type: 'business',
    tier: 'premium',
    monthlyPrice: 9999, // $99.99 AUD
    yearlyPrice: 99999, // $999.99 AUD (2 months free)
    features: ['Everything in Standard', 'Top listing placement', 'Unlimited photos', 'Priority support', 'Custom branding', 'API access', 'WhatsApp integration']
  },

  // One-time Products
  LISTING_BOOST: {
    name: 'Listing_Boost',
    description: '7-day featured placement for your listing',
    type: 'listing_boost',
    tier: 'boost',
    price: 1999, // $19.99 AUD
    features: ['7 days featured placement', 'Higher search ranking', 'Badge highlighting', 'Email notifications']
  }
} as const

// Note: Main initializeStripeProducts function is defined later in the file

// Get or create Stripe customer
export async function getOrCreateStripeCustomer(userId: string, businessId?: string): Promise<string> {
  try {
    const [account] = await db
      .select({
        id: users.id,
        email: users.email,
        stripeCustomerId: users.stripeCustomerId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!account) {
      throw new Error(`User ${userId} not found while creating Stripe customer`)
    }

    if (account.stripeCustomerId) {
      return account.stripeCustomerId
    }

    const stripeCustomer = await stripe.customers.create({
      email: account.email ?? undefined,
      metadata: {
        userId,
        businessId: businessId || '',
        platform: 'uiq_community',
      },
    })

    await db
      .update(users)
      .set({ stripeCustomerId: stripeCustomer.id, updatedAt: new Date() })
      .where(eq(users.id, userId))

    console.log(`Created Stripe customer: ${stripeCustomer.id} for user: ${userId}`)
    return stripeCustomer.id
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    throw error
  }
}

// Create checkout session
export async function createCheckoutSession(params: {
  userId: string
  businessId?: string
  priceId: string
  successUrl: string
  cancelUrl: string
  mode?: 'subscription' | 'payment'
  trialPeriodDays?: number
  metadata?: Record<string, string>
}): Promise<Stripe.Checkout.Session> {
  try {
    const customerId = await getOrCreateStripeCustomer(params.userId, params.businessId)

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: params.priceId,
        quantity: 1,
      }],
      mode: params.mode || 'subscription',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      subscription_data: params.mode === 'subscription' ? {
        trial_period_days: params.trialPeriodDays,
        metadata: params.metadata || {}
      } : undefined,
      payment_intent_data: params.mode === 'payment' ? {
        metadata: params.metadata || {}
      } : undefined,
      metadata: {
        userId: params.userId,
        businessId: params.businessId || '',
        ...params.metadata
      }
    })

    return session
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

// Create billing portal session
export async function createBillingPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return session
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    throw error
  }
}

// Grant entitlements based on subscription
export async function grantEntitlements(subscriptionId: string): Promise<void> {
  try {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product']
    }) as Stripe.Subscription

    const price = subscription.items.data[0]?.price
    if (!price?.product) return

    const product = price.product as Stripe.Product
    const metadata = product.metadata

    // Find our database records
    const stripeCustomer = await db
      .select()
      .from(stripe_customers)
      .where(eq(stripe_customers.stripe_customer_id, subscription.customer as string))
      .limit(1)

    if (stripeCustomer.length === 0) return

    const customer = stripeCustomer[0]
    const targetUserId = customer.user_id
    const targetBusinessId = customer.business_id

    if (!targetUserId && !targetBusinessId) return

    // Store subscription record
    await db.insert(stripe_subscriptions).values({
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      stripe_price_id: price.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      metadata: subscription.metadata
    }).onConflictDoUpdate({
      target: stripe_subscriptions.stripe_subscription_id,
      set: {
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date()
      }
    })

    // Grant entitlements based on product type
    const entitlementType = metadata.type
    const entitlementValue = metadata.tier

    if (entitlementType && entitlementValue && targetUserId) {
      await db.insert(memberships).values({
        user_id: targetUserId,
        tier: entitlementValue,
        status: subscription.status === 'active' ? 'active' : 'inactive',
        stripe_subscription_id: subscription.id,
        end_date: new Date(subscription.current_period_end * 1000),
        auto_renew: !subscription.cancel_at_period_end
      }).onConflictDoUpdate({
        target: memberships.user_id,
        set: {
          tier: entitlementValue,
          stripe_subscription_id: subscription.id,
          end_date: new Date(subscription.current_period_end * 1000),
          status: subscription.status === 'active' ? 'active' : 'inactive',
          updated_at: new Date()
        }
      })

      // Update user membership tier if it's a membership subscription
      if (entitlementType === 'membership' && targetUserId) {
        await db
          .update(users)
          .set({
            membership_tier: entitlementValue,
            updated_at: new Date()
          })
          .where(eq(users.id, targetUserId))
      }

      // Update business plan if it's a business subscription
      if (entitlementType === 'business' && targetBusinessId) {
        await db
          .update(businesses)
          .set({
            subscription_tier: entitlementValue,
            updated_at: new Date()
          })
          .where(eq(businesses.id, targetBusinessId))
      }
    }

    console.log(`Entitlements granted for subscription ${subscriptionId}`)
  } catch (error) {
    console.error('Error granting entitlements:', error)
    throw error
  }
}

// Revoke entitlements when subscription is canceled/expired
export async function revokeEntitlements(subscriptionId: string): Promise<void> {
  try {
    // Deactivate entitlements
    await db
      .update(memberships)
      .set({
        status: 'inactive',
        updated_at: new Date()
      })
      .where(eq(memberships.stripe_subscription_id, subscriptionId))

    // Find affected users and businesses
    const subscription = await db
      .select()
      .from(stripe_subscriptions)
      .where(eq(stripe_subscriptions.stripe_subscription_id, subscriptionId))
      .limit(1)

    if (subscription.length === 0) return

    const customer = await db
      .select()
      .from(stripe_customers)
      .where(eq(stripe_customers.stripe_customer_id, subscription[0].stripe_customer_id))
      .limit(1)

    if (customer.length === 0) return

    // Reset user to free tier
    if (customer[0].user_id) {
      await db
        .update(users)
        .set({
          membership_tier: 'free',
          updated_at: new Date()
        })
        .where(eq(users.id, customer[0].user_id))
    }

    // Reset business to basic plan
    if (customer[0].business_id) {
      await db
        .update(businesses)
        .set({
          subscription_tier: 'Basic',
          updated_at: new Date()
        })
        .where(eq(businesses.id, customer[0].business_id))
    }

    console.log(`Entitlements revoked for subscription ${subscriptionId}`)
  } catch (error) {
    console.error('Error revoking entitlements:', error)
    throw error
  }
}

// Get user's current entitlements
export async function getUserEntitlements(userId: string): Promise<typeof memberships.$inferSelect[]> {
  try {
    return await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.user_id, userId),
          eq(memberships.status, 'active')
        )
      )
  } catch (error) {
    console.error('Error getting user entitlements:', error)
    return []
  }
}

// Get business entitlements
export async function getBusinessEntitlements(businessId: string): Promise<typeof business_subscriptions.$inferSelect[]> {
  try {
    return await db
      .select()
      .from(business_subscriptions)
      .where(
        and(
          eq(business_subscriptions.business_id, businessId),
          eq(business_subscriptions.status, 'active')
        )
      )
  } catch (error) {
    console.error('Error getting business entitlements:', error)
    return []
  }
}

/**
 * Initialize Stripe products and prices with real Stripe API integration
 * This creates actual Stripe products/prices and syncs them to the database
 */
export async function initializeStripeProducts(): Promise<void> {
  console.log('Starting Stripe products initialization...')
  
  try {
    const productDefinitions = [
      // Membership Products
      {
        stripeProductId: 'prod_member_free',
        name: 'Member_Free',
        description: 'Free community membership with basic features',
        type: 'membership',
        metadata: { tier: 'free' },
        prices: []
      },
      {
        stripeProductId: 'prod_member_plus',
        name: 'Member_Plus', 
        description: 'Enhanced membership with premium features',
        type: 'membership',
        metadata: { tier: 'plus' },
        prices: [
          {
            stripePriceId: 'price_member_plus_monthly',
            unitAmount: 999, // $9.99 AUD
            currency: 'aud',
            recurringInterval: 'month',
            recurringIntervalCount: 1
          },
          {
            stripePriceId: 'price_member_plus_yearly',
            unitAmount: 9999, // $99.99 AUD
            currency: 'aud',
            recurringInterval: 'year',
            recurringIntervalCount: 1
          }
        ]
      },
      {
        stripeProductId: 'prod_member_family',
        name: 'Member_Family',
        description: 'Family membership for up to 4 family members',
        type: 'membership',
        metadata: { tier: 'family' },
        prices: [
          {
            stripePriceId: 'price_member_family_monthly',
            unitAmount: 1999, // $19.99 AUD
            currency: 'aud',
            recurringInterval: 'month',
            recurringIntervalCount: 1
          },
          {
            stripePriceId: 'price_member_family_yearly',
            unitAmount: 19999, // $199.99 AUD
            currency: 'aud',
            recurringInterval: 'year',
            recurringIntervalCount: 1
          }
        ]
      },
      // Business Products
      {
        stripeProductId: 'prod_biz_basic',
        name: 'Biz_Basic',
        description: 'Basic business listing with essential features',
        type: 'business',
        metadata: { tier: 'basic' },
        prices: [
          {
            stripePriceId: 'price_biz_basic_monthly',
            unitAmount: 2999, // $29.99 AUD
            currency: 'aud',
            recurringInterval: 'month',
            recurringIntervalCount: 1
          },
          {
            stripePriceId: 'price_biz_basic_yearly',
            unitAmount: 29999, // $299.99 AUD
            currency: 'aud',
            recurringInterval: 'year',
            recurringIntervalCount: 1
          }
        ]
      },
      {
        stripeProductId: 'prod_biz_standard',
        name: 'Biz_Standard',
        description: 'Standard business plan with enhanced visibility',
        type: 'business',
        metadata: { tier: 'standard' },
        prices: [
          {
            stripePriceId: 'price_biz_standard_monthly',
            unitAmount: 5999, // $59.99 AUD
            currency: 'aud',
            recurringInterval: 'month',
            recurringIntervalCount: 1
          },
          {
            stripePriceId: 'price_biz_standard_yearly',
            unitAmount: 59999, // $599.99 AUD
            currency: 'aud',
            recurringInterval: 'year',
            recurringIntervalCount: 1
          }
        ]
      },
      {
        stripeProductId: 'prod_biz_premium',
        name: 'Biz_Premium',
        description: 'Premium business plan with maximum exposure',
        type: 'business',
        metadata: { tier: 'premium' },
        prices: [
          {
            stripePriceId: 'price_biz_premium_monthly',
            unitAmount: 9999, // $99.99 AUD
            currency: 'aud',
            recurringInterval: 'month',
            recurringIntervalCount: 1
          },
          {
            stripePriceId: 'price_biz_premium_yearly',
            unitAmount: 99999, // $999.99 AUD
            currency: 'aud',
            recurringInterval: 'year',
            recurringIntervalCount: 1
          }
        ]
      },
      // Listing Boost Product
      {
        stripeProductId: 'prod_listing_boost',
        name: 'Listing_Boost',
        description: '7-day featured placement for your listing',
        type: 'listing',
        metadata: { boost_days: '7' },
        prices: [
          {
            stripePriceId: 'price_listing_boost',
            unitAmount: 1999, // $19.99 AUD
            currency: 'aud',
            recurringInterval: null,
            recurringIntervalCount: null
          }
        ]
      }
    ]

    // Create real Stripe products and prices, then sync to database
    for (const productDef of productDefinitions) {
      let stripeProduct
      
      try {
        // Try to retrieve existing product by metadata lookup
        const existingProducts = await stripe.products.list({
          limit: 100,
          active: true
        })
        
        stripeProduct = existingProducts.data.find(p => 
          p.metadata?.lookup_key === productDef.name
        )
        
        if (!stripeProduct) {
          // Create new Stripe product
          stripeProduct = await stripe.products.create({
            name: productDef.name,
            description: productDef.description,
            metadata: {
              lookup_key: productDef.name,
              type: productDef.type,
              tier: productDef.metadata.tier || ''
            }
          })
          console.log(`Created Stripe product: ${stripeProduct.id} for ${productDef.name}`)
        } else {
          console.log(`Found existing Stripe product: ${stripeProduct.id} for ${productDef.name}`)
        }
      } catch (error) {
        console.error(`Error creating/finding Stripe product for ${productDef.name}:`, error)
        continue
      }

      // Insert/update product in database
      await db.insert(stripe_products).values({
        stripe_product_id: stripeProduct.id,
        name: productDef.name,
        description: productDef.description,
        type: productDef.type,
        tier: productDef.metadata.tier,
        features: [],
        is_active: true,
        display_order: 0
      }).onConflictDoUpdate({
        target: stripe_products.stripe_product_id,
        set: {
          name: productDef.name,
          description: productDef.description,
          is_active: true,
          updated_at: new Date()
        }
      })

      // Create prices for this product
      for (const priceDef of productDef.prices) {
        let stripePrice
        
        try {
          // Try to find existing price by lookup_key
          const existingPrices = await stripe.prices.list({
            product: stripeProduct.id,
            active: true,
            limit: 100
          })
          
          const lookupKey = `${productDef.name}_${priceDef.recurringInterval || 'one_time'}`
          stripePrice = existingPrices.data.find(p => 
            p.metadata?.lookup_key === lookupKey
          )
          
          if (!stripePrice) {
            // Create new Stripe price
            const priceParams: Stripe.PriceCreateParams = {
              product: stripeProduct.id,
              unit_amount: priceDef.unitAmount,
              currency: priceDef.currency,
              metadata: {
                lookup_key: lookupKey,
                tier: productDef.metadata.tier || ''
              }
            }
            
            if (priceDef.recurringInterval) {
              priceParams.recurring = {
                interval: priceDef.recurringInterval,
                interval_count: priceDef.recurringIntervalCount || 1
              }
            }
            
            stripePrice = await stripe.prices.create(priceParams)
            console.log(`Created Stripe price: ${stripePrice.id} for ${lookupKey}`)
          } else {
            console.log(`Found existing Stripe price: ${stripePrice.id} for ${lookupKey}`)
          }
        } catch (error) {
          console.error(`Error creating/finding Stripe price for ${priceDef.stripePriceId}:`, error)
          continue
        }

        // Insert/update price in database
        await db.insert(stripe_prices).values({
          stripe_price_id: stripePrice.id,
          stripe_product_id: stripeProduct.id,
          amount: priceDef.unitAmount,
          currency: priceDef.currency,
          interval: priceDef.recurringInterval,
          interval_count: priceDef.recurringIntervalCount,
          is_active: true
        }).onConflictDoUpdate({
          target: stripe_prices.stripe_price_id,
          set: {
            amount: priceDef.unitAmount,
            is_active: true,
            updated_at: new Date()
          }
        })
      }
    }

    console.log('Stripe products initialization completed successfully')
  } catch (error) {
    console.error('Error initializing Stripe products:', error)
    throw error
  }
}

/**
 * Legacy seed function for development - uses placeholder IDs
 * @deprecated Use initializeStripeProducts() for production-ready setup
 */
export async function seedStripeProducts(): Promise<void> {
  console.log('Starting legacy Stripe products seeding...')
  
  try {
    const productDefinitions = [
      {
        stripeProductId: 'prod_member_free',
        name: 'Member_Free',
        description: 'Free community membership with basic features',
        type: 'membership',
        metadata: { tier: 'free' },
        prices: []
      },
      {
        stripeProductId: 'prod_member_plus',
        name: 'Member_Plus', 
        description: 'Enhanced membership with premium features',
        type: 'membership',
        metadata: { tier: 'plus' },
        prices: [
          {
            stripePriceId: 'price_member_plus_monthly',
            unitAmount: 999,
            currency: 'aud',
            recurringInterval: 'month',
            recurringIntervalCount: 1
          },
          {
            stripePriceId: 'price_member_plus_yearly',
            unitAmount: 9999,
            currency: 'aud',
            recurringInterval: 'year',
            recurringIntervalCount: 1
          }
        ]
      }
    ]

    // Simple database seeding with placeholder IDs for development
    for (const productDef of productDefinitions) {
      await db.insert(stripe_products).values({
        stripe_product_id: productDef.stripeProductId,
        name: productDef.name,
        description: productDef.description,
        type: productDef.type,
        tier: productDef.metadata.tier,
        features: [],
        is_active: true,
        display_order: 0
      }).onConflictDoNothing()

      for (const priceDef of productDef.prices) {
        await db.insert(stripe_prices).values({
          stripe_price_id: priceDef.stripePriceId,
          stripe_product_id: productDef.stripeProductId,
          amount: priceDef.unitAmount,
          currency: priceDef.currency,
          interval: priceDef.recurringInterval,
          interval_count: priceDef.recurringIntervalCount,
          is_active: true
        }).onConflictDoNothing()
      }
    }

    console.log('Legacy Stripe products seeding completed successfully')
  } catch (error) {
    console.error('Error seeding Stripe products:', error)
    throw error
  }
}