'use client'

import { useState } from 'react'
import { AccessibleButton } from '@/components/ui/AccessibleButton'
import { useToast } from '@/hooks/use-toast'

interface CheckoutButtonProps {
  priceId: string
  productName: string
  businessId?: string
  mode?: 'subscription' | 'payment'
  trialPeriodDays?: number
  className?: string
  children?: React.ReactNode
  metadata?: Record<string, string>
}

export function CheckoutButton({
  priceId,
  productName,
  businessId,
  mode = 'subscription',
  trialPeriodDays,
  className,
  children,
  metadata = {}
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleCheckout = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          businessId,
          mode,
          trialPeriodDays,
          metadata: {
            productName,
            ...metadata
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout process. Please try again.'
      console.error('Checkout error:', error)
      toast({
        title: "Checkout Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AccessibleButton
      onClick={handleCheckout}
      disabled={loading}
      className={className}
    >
      {loading ? 'Starting checkout...' : children || `Subscribe to ${productName}`}
    </AccessibleButton>
  )
}

// Quick checkout button for listing boosts
export function ListingBoostButton({ listingId, className }: { listingId: string, className?: string }) {
  return (
    <CheckoutButton
      priceId="price_listing_boost" // This will be set during product initialization
      productName="Listing Boost"
      mode="payment"
      className={className}
      metadata={{
        productType: 'listing_boost',
        listingId
      }}
    >
      Boost Listing - $19.99
    </CheckoutButton>
  )
}