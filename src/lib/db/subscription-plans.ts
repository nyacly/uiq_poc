// Database functions for subscription plans
import { db, subscription_plans, type SubscriptionPlan } from './index'
import { eq, and } from 'drizzle-orm'

// Get all active subscription plans by type
export async function getSubscriptionPlansByType(planType: string): Promise<SubscriptionPlan[]> {
  try {
    const plans = await db
      .select()
      .from(subscription_plans)
      .where(
        and(
          eq(subscription_plans.plan_type, planType),
          eq(subscription_plans.is_active, true)
        )
      )
      .orderBy(subscription_plans.display_order)

    return plans
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return []
  }
}

// Fallback business plans data (matches database structure)
const fallbackBusinessPlans: SubscriptionPlan[] = [
  {
    id: 'basic-business',
    name: 'Basic',
    slug: 'basic-business',
    plan_type: 'business',
    description: 'Essential business listing to get started',
    price_cents: 2900,
    billing_period: 'monthly',
    currency: 'AUD',
    features: [
      'Basic business profile',
      'Contact information display', 
      'Operating hours & location',
      'Up to 3 photos',
      'Customer reviews',
      'WhatsApp group access'
    ],
    is_popular: false,
    is_active: true,
    display_order: 1,
    button_text: 'Start Basic Plan',
    button_style: 'outline',
    max_usage: null,
    stripe_price_id: null,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'featured-business',
    name: 'Featured',
    slug: 'featured-business',
    plan_type: 'business',
    description: 'Stand out with enhanced visibility',
    price_cents: 5900,
    billing_period: 'monthly',
    currency: 'AUD',
    features: [
      'Everything in Basic',
      'Featured placement in search',
      'Unlimited photos & gallery',
      'Detailed service descriptions',
      'Priority in category listings',
      'Business performance analytics'
    ],
    is_popular: true,
    is_active: true,
    display_order: 2,
    button_text: 'Go Featured',
    button_style: 'primary',
    max_usage: null,
    stripe_price_id: null,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'premium-business',
    name: 'Premium',
    slug: 'premium-business',
    plan_type: 'business',
    description: 'Maximum exposure and lead generation',
    price_cents: 9900,
    billing_period: 'monthly',
    currency: 'AUD',
    features: [
      'Everything in Featured',
      'Direct customer contact collection',
      'Email lead capture forms',
      'Premium badge & verification',
      'Homepage carousel placement',
      'Dedicated account support',
      'Promotional events & ads'
    ],
    is_popular: false,
    is_active: true,
    display_order: 3,
    button_text: 'Get Premium',
    button_style: 'secondary',
    max_usage: null,
    stripe_price_id: null,
    created_at: new Date(),
    updated_at: new Date()
  }
]

// Get active business subscription plans with fallback
export async function getBusinessSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    // Try to fetch from database first
    const plans = await getSubscriptionPlansByType('business')
    if (plans && plans.length > 0) {
      return plans
    }
  } catch (error) {
    console.error('Database fetch failed, using fallback plans:', error)
  }
  
  // Return fallback plans if database fails
  return fallbackBusinessPlans
}

// Get a specific plan by slug
export async function getSubscriptionPlanBySlug(slug: string): Promise<SubscriptionPlan | null> {
  try {
    const result = await db
      .select()
      .from(subscription_plans)
      .where(
        and(
          eq(subscription_plans.slug, slug),
          eq(subscription_plans.is_active, true)
        )
      )
      .limit(1)

    return result[0] || null
  } catch (error) {
    console.error('Error fetching subscription plan:', error)
    return null
  }
}

// Helper function to format price for display
export function formatPrice(priceCents: number, currency: string = 'AUD'): string {
  const price = priceCents / 100
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

// Helper function to get button style classes
export function getButtonStyleClasses(buttonStyle: string): string {
  switch (buttonStyle) {
    case 'primary':
      return 'bg-primary-600 text-white hover:bg-primary-700'
    case 'secondary':
      return 'border-2 border-secondary-400 text-secondary-700 hover:bg-secondary-50'
    case 'outline':
      return 'border-2 border-primary-200 text-primary-600 hover:bg-primary-50'
    default:
      return 'bg-primary-600 text-white hover:bg-primary-700'
  }
}