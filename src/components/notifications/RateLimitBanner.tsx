'use client'

import Link from 'next/link'
import { AccessibleButton } from '@/components/ui/AccessibleButton'
import { cn } from '@/lib/utils'

export type RateLimitFeature = 'classifieds' | 'announcements' | 'messages'

const FEATURE_COPY: Record<RateLimitFeature, {
  heading: string
  description: string
  highlight: string
}> = {
  classifieds: {
    heading: "You've reached the classifieds limit",
    description:
      'Free members can publish up to two classifieds each month. Upgrade to Plus to unlock unlimited listings and faster approvals.',
    highlight: 'Plus members enjoy unlimited classifieds and priority placement.',
  },
  announcements: {
    heading: "You're at the announcement limit",
    description:
      'Free members can share one community announcement per month. Upgrading unlocks unlimited notices and priority moderator review.',
    highlight: 'Plus and Family plans include unlimited announcements.',
  },
  messages: {
    heading: "Daily messaging limit reached",
    description:
      'Free members can send up to 200 direct messages per day. Upgrade to keep conversations going without interruption.',
    highlight: 'Premium plans remove the daily messaging cap.',
  },
}

export interface RateLimitBannerProps {
  feature: RateLimitFeature
  onDismiss?: () => void
  className?: string
}

export function RateLimitBanner({ feature, onDismiss, className }: RateLimitBannerProps) {
  const copy = FEATURE_COPY[feature]

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-auto w-full max-w-xl rounded-xl border border-amber-200 bg-amber-50/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:backdrop-blur-md',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 9v4m0 4h.01" />
            <path d="M21 18v-6a9 9 0 10-18 0v6" />
            <path d="M5 21h14" />
          </svg>
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-amber-900">{copy.heading}</p>
            <p className="mt-1 text-sm text-amber-800">{copy.description}</p>
            <p className="mt-2 text-sm font-medium text-amber-900">{copy.highlight}</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <AccessibleButton
              size="sm"
              variant="primary"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              Explore upgrades
            </AccessibleButton>
            <Link
              href="/pricing"
              className="inline-flex items-center text-sm font-semibold text-amber-900 underline-offset-4 hover:underline"
            >
              View membership plans
            </Link>
          </div>
        </div>
        <AccessibleButton
          variant="text"
          size="sm"
          aria-label="Dismiss rate limit notice"
          onClick={onDismiss}
          className="-mr-1 mt-1 text-amber-700 hover:text-amber-900"
        >
          <span aria-hidden="true">×</span>
        </AccessibleButton>
      </div>
    </div>
  )
}
