'use client'

import { AccessibleButton } from '@/components/ui/AccessibleButton'
import Link from 'next/link'

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        {/* Cancel Icon */}
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        {/* Cancel Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Cancelled
        </h1>
        
        <p className="text-gray-600 mb-8">
          Your payment was cancelled and no charges were made. 
          You can try again anytime or explore our free features.
        </p>

        {/* Options */}
        <div className="space-y-4">
          <div className="text-left">
            <h3 className="text-sm font-medium text-gray-900 mb-3">What would you like to do?</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Continue exploring with free membership
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Try a different plan that fits your needs
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Contact us if you have questions
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Link href="/pricing" className="block">
              <AccessibleButton variant="primary" className="w-full">
                View Plans Again
              </AccessibleButton>
            </Link>
            
            <Link href="/dashboard" className="block">
              <AccessibleButton variant="outline" className="w-full">
                Continue with Free
              </AccessibleButton>
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Need Help Choosing?</h4>
            <p className="text-xs text-gray-600 mb-3">
              Our team is here to help you find the right plan for your needs.
            </p>
            <Link href="/contact">
              <AccessibleButton variant="outline" size="sm">
                Contact Support
              </AccessibleButton>
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6">
          <p className="text-xs text-gray-500">
            No charges were made to your account. You can upgrade anytime.
          </p>
        </div>
      </div>
    </div>
  )
}