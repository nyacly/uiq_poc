'use client'

import { useState } from 'react'
import { AccessibleModal } from '@/components/ui/AccessibleModal'
import { AccessibleButton } from '@/components/ui/AccessibleButton'

interface CommunityGuidelinesProps {
  isOpen: boolean
  onClose: () => void
}

export function CommunityGuidelines({ isOpen, onClose }: CommunityGuidelinesProps) {
  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Community Guidelines"
      size="lg"
    >
      <div className="prose prose-sm max-w-none">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Welcome to the UiQ Community
          </h2>
          <p className="text-gray-700 mb-4">
            Our community is built on respect, authenticity, and mutual support. These guidelines help ensure 
            a safe and welcoming environment for all Ugandans in Queensland.
          </p>
        </div>

        <div className="space-y-6">
          {/* Be Respectful */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                1
              </span>
              Be Respectful and Kind
            </h3>
            <ul className="text-gray-700 space-y-2 ml-9">
              <li>• Treat all community members with dignity and respect</li>
              <li>• Use inclusive language and avoid discriminatory comments</li>
              <li>• Respect different opinions and engage in constructive dialogue</li>
              <li>• No harassment, bullying, or personal attacks</li>
            </ul>
          </section>

          {/* Keep it Authentic */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                2
              </span>
              Keep it Authentic
            </h3>
            <ul className="text-gray-700 space-y-2 ml-9">
              <li>• Use your real name and provide accurate information</li>
              <li>• Only post about legitimate businesses and services</li>
              <li>• Be honest in reviews and recommendations</li>
              <li>• Verify your phone number and email for account security</li>
            </ul>
          </section>

          {/* No Spam or Scams */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                3
              </span>
              No Spam or Scams
            </h3>
            <ul className="text-gray-700 space-y-2 ml-9">
              <li>• No get-rich-quick schemes or pyramid marketing</li>
              <li>• No fake investment opportunities or financial scams</li>
              <li>• No repeated posting of the same content</li>
              <li>• No suspicious links or phishing attempts</li>
              <li>• Report suspicious activities immediately</li>
            </ul>
          </section>

          {/* Appropriate Content */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                4
              </span>
              Share Appropriate Content
            </h3>
            <ul className="text-gray-700 space-y-2 ml-9">
              <li>• Keep content family-friendly and appropriate for all ages</li>
              <li>• No explicit, violent, or offensive images</li>
              <li>• No illegal activities or prohibited services</li>
              <li>• Respect intellectual property and copyright</li>
            </ul>
          </section>

          {/* Business Listings */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                5
              </span>
              Business Listing Standards
            </h3>
            <ul className="text-gray-700 space-y-2 ml-9">
              <li>• Provide accurate business information and contact details</li>
              <li>• Use high-quality, relevant images</li>
              <li>• Clearly describe your services and pricing</li>
              <li>• Respond professionally to customer inquiries</li>
              <li>• Honor advertised prices and service commitments</li>
            </ul>
          </section>

          {/* Privacy and Safety */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                6
              </span>
              Privacy and Safety
            </h3>
            <ul className="text-gray-700 space-y-2 ml-9">
              <li>• Don&apos;t share personal information publicly (addresses, phone numbers)</li>
              <li>• Use the platform&apos;s messaging system for initial contact</li>
              <li>• Meet in public places for in-person transactions</li>
              <li>• Trust your instincts and report suspicious behavior</li>
            </ul>
          </section>

          {/* Consequences */}
          <section className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              ⚠️ Violations and Consequences
            </h3>
            <div className="text-gray-700 space-y-2">
              <p><strong>First violation:</strong> Warning and content removal</p>
              <p><strong>Repeated violations:</strong> Temporary account suspension</p>
              <p><strong>Serious violations:</strong> Permanent account ban</p>
              <p><strong>Illegal activity:</strong> Immediate ban and reporting to authorities</p>
            </div>
          </section>

          {/* Reporting */}
          <section className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🛡️ How to Report Issues
            </h3>
            <div className="text-gray-700 space-y-2">
              <p>If you encounter inappropriate content or behavior:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Use the &quot;Report&quot; button on any post or profile</li>
                <li>Block users who are bothering you</li>
                <li>Contact our moderation team for urgent issues</li>
                <li>Provide screenshots or evidence when reporting</li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📞 Need Help?
            </h3>
            <div className="text-gray-700">
              <p>Our community moderators are here to help:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Email: moderation@uiq-community.com</li>
                <li>Emergency issues: Use the urgent report function</li>
                <li>General questions: Contact us through the platform</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            By using the UiQ Community Platform, you agree to follow these guidelines. 
            Guidelines may be updated periodically to improve our community experience.
          </p>
          <p className="text-sm text-gray-500 text-center mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <AccessibleButton
          onClick={onClose}
          variant="primary"
        >
          I Understand
        </AccessibleButton>
      </div>
    </AccessibleModal>
  )
}

// Compact guidelines display component
export function GuidelinesCard() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Community Guidelines
            </h3>
            <p className="text-gray-600 mb-4">
              Help keep our community safe, respectful, and spam-free. Learn about our community standards and reporting tools.
            </p>
            <AccessibleButton
              onClick={() => setIsOpen(true)}
              variant="outline"
              size="sm"
            >
              Read Full Guidelines
            </AccessibleButton>
          </div>
        </div>
      </div>

      <CommunityGuidelines 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  )
}