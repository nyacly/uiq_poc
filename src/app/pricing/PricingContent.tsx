'use client'

import { useState } from 'react'
import { PricingTable } from '@/components/billing/PricingTable'
import { useToast } from '@/hooks/use-toast'

export function PricingContent() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSelectPlan = async (priceId: string, productName: string) => {
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
            productName
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PricingTable loading={loading} onSelectPlan={handleSelectPlan} />
      </div>
    </div>
  )
}
