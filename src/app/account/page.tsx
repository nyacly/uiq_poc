import type { Metadata } from 'next'
import Link from 'next/link'
import { eq } from 'drizzle-orm'

import { requireUser } from '@server/auth'
import { db, profiles, users } from '@/lib/db'
import { BillingPortalButton } from '@/components/billing/BillingPortalButton'
import { AccessibleButton } from '@/components/ui/AccessibleButton'
import { buildPageMetadata } from '@/lib/metadata'

const tierDescriptions: Record<string, string> = {
  FREE: 'Free members can explore community listings and events with limited posting allowances.',
  PLUS: 'Plus unlocks unlimited classifieds, announcements, and direct messaging with priority support.',
  FAMILY: 'Family includes everything in Plus and extends premium access to your household.',
}

const friendlyTier = (tier: string) => {
  const normalized = tier.toUpperCase()
  if (normalized === 'PLUS') return 'Plus'
  if (normalized === 'FAMILY') return 'Family'
  return 'Free'
}

export const metadata: Metadata = buildPageMetadata({
  title: 'Account overview',
  description: 'Manage your UiQ membership, profile settings, and billing preferences.',
  path: '/account',
  category: 'Account',
})

export default async function AccountPage() {
  const user = await requireUser()

  const [profile] = await db
    .select({
      displayName: profiles.displayName,
      location: profiles.location,
    })
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1)

  const [account] = await db
    .select({
      email: users.email,
      createdAt: users.createdAt,
      stripeCustomerId: users.stripeCustomerId,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  const membershipTier = user.membershipTier ?? 'FREE'
  const tierCopy = tierDescriptions[membershipTier] ?? tierDescriptions.FREE

  return (
    <div className="bg-gray-50 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Account</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">
            {profile?.displayName ?? 'Community member'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Keep your membership details current so you never miss community updates and premium perks.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Membership tier</h2>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
              {friendlyTier(membershipTier)}
            </p>
            <p className="mt-4 text-sm text-gray-600">{tierCopy}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/pricing" className="inline-flex">
                <AccessibleButton variant="secondary" size="sm">
                  View membership plans
                </AccessibleButton>
              </Link>
              <BillingPortalButton variant="outline" size="sm" className="inline-flex">
                Manage subscription
              </BillingPortalButton>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Account details</h2>
            <dl className="mt-4 space-y-3 text-sm text-gray-700">
              <div>
                <dt className="font-medium text-gray-900">Email</dt>
                <dd>{account?.email ?? 'Not provided'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Member since</dt>
                <dd>{account?.createdAt ? new Date(account.createdAt).toLocaleDateString() : '—'}</dd>
              </div>
              {profile?.location && (
                <div>
                  <dt className="font-medium text-gray-900">Location</dt>
                  <dd>{profile.location}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>
      </div>
    </div>
  )
}
