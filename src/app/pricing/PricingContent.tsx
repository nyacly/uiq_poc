'use client'

import { useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { PricingTable } from '@/components/billing/PricingTable'
import { CheckoutButton } from '@/components/billing/CheckoutButton'
import { BillingPortalButton } from '@/components/billing/BillingPortalButton'
import { useToast } from '@/hooks/use-toast'

export function PricingContent() {
  const [loading, setLoading] = useState(false)
  const [membershipPrices, setMembershipPrices] = useState<Record<string, { monthly?: string; yearly?: string; name: string }>>({})
  const { data: session } = useSession()
  const { toast } = useToast()

  const handleSelectPlan = async (priceId: string, productName: string, tier?: string) => {
    try {
      setLoading(true)

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceId,
          metadata: {
            productName,
            ...(tier ? { membershipTier: tier.toUpperCase() } : {})
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout process. Please try again.'
      console.error('Checkout error:', error)
      toast({
        title: 'Checkout Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePricesLoaded = (products: Array<{ tier: string; name: string; prices: Array<{ interval: string | null; stripePriceId: string }> }>) => {
    const next: Record<string, { monthly?: string; yearly?: string; name: string }> = {}

    for (const product of products) {
      if (product.prices.length === 0) continue
      const monthly = product.prices.find((price) => price.interval === 'month')
      const yearly = product.prices.find((price) => price.interval === 'year')
      next[product.tier] = {
        monthly: monthly?.stripePriceId,
        yearly: yearly?.stripePriceId,
        name: product.name,
      }
    }

    setMembershipPrices(next)
  }

  const membershipTierValue = (session?.user as { membershipTier?: string } | undefined)?.membershipTier
  const currentTier = useMemo(() => membershipTierValue?.toLowerCase(), [membershipTierValue])
  const plusPriceId = membershipPrices['plus']?.monthly ?? null
  const familyPriceId = membershipPrices['family']?.monthly ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Membership plans that grow with you
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Support the UiQ community, unlock premium exposure for your business, and access member-only events.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <CheckoutButton
                priceId={plusPriceId ?? ''}
                productName={membershipPrices['plus']?.name ?? 'Member_Plus'}
                metadata={{ membershipTier: 'PLUS' }}
                disabled={!plusPriceId || loading}
                className="min-w-[220px]"
              >
                Upgrade to Plus
              </CheckoutButton>
              <CheckoutButton
                priceId={familyPriceId ?? ''}
                productName={membershipPrices['family']?.name ?? 'Member_Family'}
                metadata={{ membershipTier: 'FAMILY' }}
                variant="secondary"
                disabled={!familyPriceId || loading}
                className="min-w-[220px]"
              >
                Upgrade to Family
              </CheckoutButton>
              {session && (
                <BillingPortalButton variant="outline" size="sm" className="min-w-[220px]">
                  Manage subscription
                </BillingPortalButton>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PricingTable
          loading={loading}
          onSelectPlan={handleSelectPlan}
          currentTier={currentTier}
          onPricesLoaded={handlePricesLoaded}
        />
      </div>
    </div>
  )
}
