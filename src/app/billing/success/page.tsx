"use client"

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AccessibleButton } from '@/components/ui/AccessibleButton'
import { BillingPortalButton } from '@/components/billing/BillingPortalButton'
import Link from 'next/link'

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Processing your payment...</p>
          </div>
        </div>
      }
    >
      <BillingSuccessContent />
    </Suspense>
  )
}

function BillingSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [syncState, setSyncState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function confirmSubscription() {
      if (!sessionId) {
        setLoading(false)
        return
      }

      setSyncState('processing')
      setSyncError(null)

      try {
        const response = await fetch('/api/stripe/checkout/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          const message =
            payload && typeof payload === 'object' && 'error' in payload
              ? String(payload.error)
              : 'We could not finalise your subscription. The Stripe webhook will retry shortly.'
          throw new Error(message)
        }

        if (!cancelled) {
          setSyncState('success')
        }
      } catch (error) {
        if (!cancelled) {
          setSyncState('error')
          setSyncError(
            error instanceof Error
              ? error.message
              : 'Unable to confirm your subscription yet. Please refresh in a moment.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void confirmSubscription()

    return () => {
      cancelled = true
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        {syncState === 'processing' && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Activating your membership. This usually takes just a moment.
          </div>
        )}

        {syncState === 'success' && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Your subscription is active. A confirmation email is on the way.
          </div>
        )}

        {syncState === 'error' && syncError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {syncError}
          </div>
        )}

        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h1>

        <p className="text-gray-600 mb-8">
          Thank you for your subscription to the UiQ Community Platform. Your payment has been processed successfully and your
          account has been upgraded.
        </p>

        {sessionId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
            <p className="text-sm font-mono text-gray-800 break-all">{sessionId}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="text-left">
            <h3 className="text-sm font-medium text-gray-900 mb-3">What&apos;s next?</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                You&apos;ll receive a receipt via email
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Your premium features are now active
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Manage your subscription anytime in billing settings
              </li>
            </ul>
          </div>

          <div className="space-y-3 pt-4">
            <Link href="/dashboard" className="block">
              <AccessibleButton variant="primary" className="w-full">
                Go to Dashboard
              </AccessibleButton>
            </Link>

            <Link href="/billing" className="block">
              <AccessibleButton variant="outline" className="w-full">
                Manage Billing
              </AccessibleButton>
            </Link>

            <BillingPortalButton variant="outline" size="sm" className="w-full">
              Open customer portal
            </BillingPortalButton>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Need help? <a href="/contact" className="text-blue-600 hover:underline">Contact our support team</a>
          </p>
        </div>
      </div>
    </div>
  )
}