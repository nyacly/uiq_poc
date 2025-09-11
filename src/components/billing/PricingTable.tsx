'use client'

import { useState, useEffect, useCallback } from 'react'
import { AccessibleButton } from '@/components/ui/AccessibleButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface Price {
  id: string
  stripePriceId: string
  amount: number
  currency: string
  interval: string | null
  intervalCount: number
}

interface Product {
  id: string
  stripeProductId: string
  name: string
  description: string
  type: string
  tier: string
  features: string[]
  prices: Price[]
}

interface PricingTableProps {
  type: 'membership' | 'business'
  onSelectPlan: (priceId: string, productName: string) => void
  currentTier?: string
  loading?: boolean
}

export function PricingTable({ type, onSelectPlan, currentTier, loading }: PricingTableProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')
  const [loadingProducts, setLoadingProducts] = useState(true)

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true)
      const response = await fetch(`/api/stripe/products?type=${type}`)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }, [type])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const formatPrice = (price: Price) => {
    const amount = price.amount / 100
    if (price.interval) {
      return `$${amount}/${price.interval === 'year' ? 'year' : 'month'}`
    }
    return `$${amount}`
  }

  const getYearlySavings = (product: Product) => {
    const monthlyPrice = product.prices.find(p => p.interval === 'month')
    const yearlyPrice = product.prices.find(p => p.interval === 'year')
    
    if (monthlyPrice && yearlyPrice) {
      const monthlyCost = (monthlyPrice.amount * 12) / 100
      const yearlyCost = yearlyPrice.amount / 100
      const savings = monthlyCost - yearlyCost
      return savings > 0 ? savings : 0
    }
    return 0
  }

  const getPriceForInterval = (product: Product, interval: 'month' | 'year') => {
    return product.prices.find(p => p.interval === interval) || product.prices[0]
  }

  const isCurrentPlan = (tier: string) => {
    return currentTier === tier
  }

  const getButtonText = (tier: string, price: Price | undefined) => {
    if (loading) return 'Processing...'
    if (isCurrentPlan(tier)) return 'Current Plan'
    if (tier === 'free') return 'Current Plan' // Free is always current until they upgrade
    if (!price) return 'Contact Us'
    return 'Upgrade Now'
  }

  const getButtonVariant = (tier: string) => {
    if (isCurrentPlan(tier)) return 'outline' as const
    if (tier === 'premium' || tier === 'family') return 'primary' as const
    return 'secondary' as const
  }

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
        <span className="ml-3 text-gray-600">Loading plans...</span>
      </div>
    )
  }

  // Add free tier for membership
  const allProducts = type === 'membership' ? [
    {
      id: 'free',
      stripeProductId: '',
      name: 'Member_Free',
      description: 'Free community membership with basic features',
      type: 'membership',
      tier: 'free',
      features: ['Community access', 'Basic profile', 'View listings', 'Join events'],
      prices: []
    },
    ...products
  ] : products

  return (
    <div className="space-y-8">
      {/* Billing Toggle for Subscriptions */}
      {type === 'membership' && products.some(p => p.prices.some(price => price.interval)) && (
        <div className="flex justify-center">
          <div className="bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === 'year'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-1 text-xs text-green-600 font-bold">Save 17%</span>
            </button>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {allProducts.map((product) => {
          const price = getPriceForInterval(product, billingInterval)
          const yearlySavings = getYearlySavings(product)
          const isPopular = product.tier === 'plus' || product.tier === 'standard'

          return (
            <div
              key={product.id}
              className={`relative rounded-lg border-2 bg-white p-8 shadow-sm ${
                isPopular
                  ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20'
                  : 'border-gray-200'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 text-xs font-medium rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.name.replace('_', ' ')}
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  {product.description}
                </p>

                <div className="mb-6">
                  {product.tier === 'free' ? (
                    <div className="text-4xl font-bold text-gray-900">Free</div>
                  ) : price ? (
                    <div>
                      <div className="text-4xl font-bold text-gray-900">
                        {formatPrice(price)}
                      </div>
                      {billingInterval === 'year' && yearlySavings > 0 && (
                        <div className="text-sm text-green-600 font-medium mt-1">
                          Save ${yearlySavings.toFixed(0)} per year
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-lg text-gray-600">Contact us</div>
                  )}
                </div>

                <AccessibleButton
                  onClick={() => price && onSelectPlan(price.stripePriceId, product.name)}
                  variant={getButtonVariant(product.tier)}
                  disabled={loading || isCurrentPlan(product.tier) || product.tier === 'free'}
                  className="w-full mb-6"
                >
                  {getButtonText(product.tier, price)}
                </AccessibleButton>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Features included:</h4>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="ml-3 text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}
      </div>

      {/* Additional Info */}
      <div className="text-center text-sm text-gray-500">
        <p>All plans include 30-day money-back guarantee.</p>
        <p className="mt-1">Prices in Australian Dollars (AUD). Taxes may apply.</p>
      </div>
    </div>
  )
}