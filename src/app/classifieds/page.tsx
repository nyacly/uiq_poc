import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/MainLayout'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { sampleListings, type SampleListing } from '@/data/sample-content'
import { buildPageMetadata } from '@/lib/metadata'
import { ClassifiedSubmissionForm } from '@/components/forms/ClassifiedSubmissionForm'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Classifieds',
    description:
      'Browse community listings for housing, items for sale, and short-term gigs shared by Ugandans living in Queensland.',
    path: '/classifieds',
    keywords: ['community marketplace', 'housing', 'gigs', 'Ugandan classifieds', 'Queensland'],
    category: 'Marketplace'
  })
}

const listingTypeLabels: Record<string, { label: string; description: string }> = {
  housing: {
    label: 'Housing & accommodation',
    description: 'Rooms, flat shares, and temporary stays within trusted households.'
  },
  sale: {
    label: 'For sale',
    description: 'Furniture, cultural items, catering packages, and community resources.'
  },
  gig: {
    label: 'Gigs & services',
    description: 'Short-term work, event entertainment, and specialist skills.'
  }
}

export default function ClassifiedsPage() {
  const listingsByType = sampleListings.reduce<Record<string, SampleListing[]>>((acc, listing) => {
    acc[listing.type] = acc[listing.type] ? [...acc[listing.type], listing] : [listing]
    return acc
  }, {})

  return (
    <MainLayout className="bg-neutral-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="featured" size="sm" className="mb-4 bg-white/10 text-white border-white/20">
                UiQ Community Marketplace
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Buy, sell, and support within the community</h1>
              <p className="text-lg text-amber-100 mb-8">
                Find housing, discover cultural experiences, and hire trusted professionals who understand Ugandan life in
                Queensland.
              </p>

              <div className="flex flex-wrap gap-6 text-amber-100">
                <div>
                  <p className="text-3xl font-semibold text-white">{sampleListings.length}</p>
                  <p className="text-sm uppercase tracking-wide">Active listings</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-white">{Object.keys(listingsByType).length}</p>
                  <p className="text-sm uppercase tracking-wide">Categories</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-white">24/7</p>
                  <p className="text-sm uppercase tracking-wide">Community support</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {sampleListings.slice(0, 4).map((listing) => (
                  <div key={listing.id} className="bg-white/10 rounded-2xl p-4 backdrop-blur">
                    <div className="relative h-32 rounded-xl overflow-hidden mb-4">
                      <Image src={listing.image} alt={listing.title} fill className="object-cover" />
                    </div>
                    <p className="text-sm uppercase text-amber-200 font-semibold">{listingTypeLabels[listing.type].label}</p>
                    <p className="font-semibold text-white">{listing.title}</p>
                    <p className="text-sm text-amber-100">{formatCurrency(listing.priceCents)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Post listing CTA */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <ClassifiedSubmissionForm />
        </section>

        {/* Listings by category */}
        {Object.entries(listingsByType).map(([type, listings]) => (
          <section key={type} className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{listingTypeLabels[type].label}</h2>
                <p className="text-gray-600 mt-2">{listingTypeLabels[type].description}</p>
              </div>
              <Link href="/pricing" className="text-amber-700 font-semibold">
                Boost this listing →
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <Card key={listing.id} hoverable>
                  <div className="relative h-48 w-full overflow-hidden rounded-t-2xl">
                    <Image src={listing.image} alt={listing.title} fill className="object-cover" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-amber-700">
                      {listingTypeLabels[listing.type].label}
                    </div>
                    <div className="absolute bottom-4 right-4 bg-amber-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {formatCurrency(listing.priceCents)}
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl leading-snug">{listing.title}</CardTitle>
                    <p className="text-sm text-gray-500">{formatRelativeTime(listing.postedAt)}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700 line-clamp-3">{listing.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>📍 {listing.location}</span>
                      <span>Secure payments available</span>
                    </div>
                    <Link href={`/classifieds/${listing.slug}`} className="inline-flex items-center text-amber-700 font-semibold">
                      View listing
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}

        {/* Safety tips */}
        <section className="bg-white border border-gray-200 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Community marketplace safety</h2>
              <p className="text-gray-600 mt-1">
                Every listing is moderated to keep members safe. Follow these tips when meeting buyers or sellers.
              </p>
            </div>
            <Link href="/community" className="text-amber-700 font-semibold">
              View all guidelines →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="font-semibold text-amber-800 mb-2">Meet in safe, public places</p>
              <p>Prefer daytime meetups and let a friend or family member know your plans.</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="font-semibold text-amber-800 mb-2">Verify payments before handing over items</p>
              <p>Use secure bank transfers or cash and confirm receipt before completing the exchange.</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="font-semibold text-amber-800 mb-2">Report suspicious behaviour</p>
              <p>Flag listings or users that seem fraudulent so moderators can keep everyone safe.</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="font-semibold text-amber-800 mb-2">Respect cultural values</p>
              <p>Be kind, punctual, and honour commitments to strengthen trust in our marketplace.</p>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  )
}

