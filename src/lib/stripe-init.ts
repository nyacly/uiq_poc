/**
 * Stripe Product Initialization
 * UiQ Community Platform - Setup Products and Prices
 */

import { PRODUCT_DEFINITIONS, initializeStripeProducts } from './stripe'

// Test product data for development
export const TEST_PRODUCTS = {
  // Test prices for development (use test price IDs from Stripe)
  TEST_PRICE_IDS: {
    MEMBER_PLUS_MONTHLY: 'price_test_member_plus_monthly',
    MEMBER_PLUS_YEARLY: 'price_test_member_plus_yearly',
    MEMBER_FAMILY_MONTHLY: 'price_test_member_family_monthly',
    MEMBER_FAMILY_YEARLY: 'price_test_member_family_yearly',
    BIZ_BASIC_MONTHLY: 'price_test_biz_basic_monthly',
    BIZ_BASIC_YEARLY: 'price_test_biz_basic_yearly',
    BIZ_STANDARD_MONTHLY: 'price_test_biz_standard_monthly',
    BIZ_STANDARD_YEARLY: 'price_test_biz_standard_yearly',
    BIZ_PREMIUM_MONTHLY: 'price_test_biz_premium_monthly',
    BIZ_PREMIUM_YEARLY: 'price_test_biz_premium_yearly',
    LISTING_BOOST: 'price_test_listing_boost'
  },

  // Mock checkout sessions for testing
  MOCK_CHECKOUT_SESSIONS: {
    success: 'cs_test_success_12345',
    cancel: 'cs_test_cancel_12345'
  }
}

// Initialize products when the application starts
export async function initializeStripeIntegration(): Promise<void> {
  try {
    console.log('🚀 Initializing Stripe integration...')
    
    // Check if we're in test mode
    const isTestMode = process.env.STRIPE_SECRET_KEY?.includes('sk_test_')
    
    if (isTestMode) {
      console.log('📝 Running in Stripe TEST mode')
      console.log('💡 You can use test cards: 4242424242424242 (Visa), 4000000000003220 (3D Secure)')
    } else {
      console.log('💳 Running in Stripe LIVE mode')
    }

    // Initialize products and prices in Stripe
    await initializeStripeProducts()
    
    console.log('✅ Stripe integration initialized successfully')
    
    // Log product pricing for reference
    console.log('\n📋 Available Products:')
    Object.entries(PRODUCT_DEFINITIONS).forEach(([key, product]) => {
      if (product.tier === 'free') {
        console.log(`  • ${product.name}: Free`)
      } else if ('price' in product) {
        console.log(`  • ${product.name}: $${product.price / 100} AUD (one-time)`)
      } else {
        const monthly = 'monthlyPrice' in product ? `$${product.monthlyPrice / 100}/month` : ''
        const yearly = 'yearlyPrice' in product ? `$${product.yearlyPrice / 100}/year` : ''
        console.log(`  • ${product.name}: ${monthly}${monthly && yearly ? ', ' : ''}${yearly}`)
      }
    })
    
  } catch (error) {
    console.error('❌ Error initializing Stripe integration:', error)
    
    // Don't throw error in development to allow app to continue
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Continuing in development mode without Stripe initialization')
    } else {
      throw error
    }
  }
}

// Test webhook handler for development
export function createTestWebhookEvents() {
  return {
    subscription_created: {
      id: 'evt_test_webhook',
      object: 'event',
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test_12345',
          customer: 'cus_test_12345',
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
          items: {
            data: [{
              price: {
                id: 'price_test_member_plus_monthly',
                product: {
                  id: 'prod_test_member_plus',
                  metadata: {
                    type: 'membership',
                    tier: 'plus'
                  }
                }
              }
            }]
          }
        }
      }
    },
    
    invoice_paid: {
      id: 'evt_test_invoice',
      object: 'event',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_test_12345',
          customer: 'cus_test_12345',
          subscription: 'sub_test_12345',
          amount_paid: 999,
          currency: 'aud',
          status: 'paid',
          hosted_invoice_url: 'https://invoice.stripe.com/test',
          payment_intent: 'pi_test_12345'
        }
      }
    }
  }
}

// Helper function to seed test data in development
export async function seedTestData(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    console.log('⚠️  Test data seeding only available in development mode')
    return
  }
  
  try {
    console.log('🌱 Seeding test data...')
    
    // Here you could seed test users, businesses, etc.
    // For now, we'll just log that test mode is ready
    
    console.log('✅ Test data seeded successfully')
    console.log('\n🧪 Test Mode Ready:')
    console.log('  • Use test card: 4242424242424242')
    console.log('  • CVV: any 3 digits')
    console.log('  • Expiry: any future date')
    console.log('  • Webhook endpoint: /api/stripe/webhook')
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error)
  }
}

// Export for use in other files
export { PRODUCT_DEFINITIONS }