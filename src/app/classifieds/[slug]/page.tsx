import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { prisma } from '@/lib/db'
import { buildPageMetadata } from '@/lib/metadata'
import { formatCurrency, formatDate } from '@/lib/utils'
import { sampleListings } from '@/data/sample-content'

interface ListingPageParams {
  params: { slug: string }
}

interface ListingRecord {
  id: string
  slug: string
  title: string
  description: string
  priceCents: number
  location: string
  type: string
  postedAt: string
  image?: string
}

const FALLBACK_LISTING_IMAGE = 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=900&h=600&fit=crop&auto=format'

async function getListing(slug: string): Promise<ListingRecord | null> {
  try {
    const listing = await prisma.listing.findUnique({
      where: { slug }
    })

    if (listing) {
      return {
        id: listing.id,
        slug: listing.slug,
        title: listing.title,
        description: listing.description,
        priceCents: listing.priceCents,
        location: listing.location,
        type: listing.type,
        postedAt: listing.createdAt.toISOString(),
        image: FALLBACK_LISTING_IMAGE
      }
    }
  } catch (error) {
    console.error('Failed to fetch listing from database, falling back to sample data', error)
  }

  const sample = sampleListings.find((listing) => listing.slug === slug)
  if (!sample) {
    return null
  }

  return {
    id: sample.id,
    slug: sample.slug,
    title: sample.title,
    description: sample.description,
    priceCents: sample.priceCents,
    location: sample.location,
    type: sample.type,
    postedAt: sample.postedAt,
    image: sample.image
  }
}

export async function generateMetadata({ params }: ListingPageParams): Promise<Metadata> {
  const listing = await getListing(params.slug)

  if (!listing) {
    return {
      title: 'Listing not found',
      description: 'The requested listing could not be located in the UiQ classifieds.',
      robots: {
        index: false,
        follow: false
      }
    }
  }

  return buildPageMetadata({
    title: listing.title,
    description: listing.description,
    path: `/classifieds/${params.slug}`,
    keywords: [listing.title, listing.type, 'Ugandan classifieds', 'Queensland marketplace'],
    category: 'Marketplace'
  })
}

export async function generateStaticParams() {
  return sampleListings.map((listing) => ({ slug: listing.slug }))
}

export default async function ListingDetailPage({ params }: ListingPageParams) {
  const listing = await getListing(params.slug)

  if (!listing) {
    notFound()
  }

  return (
    <div className="bg-neutral-50 min-h-screen">
      <section className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
          <span className="inline-flex px-3 py-1 rounded-full bg-white/10 text-sm uppercase tracking-wide">
            {listing.type}
          </span>
          <h1 className="text-4xl font-bold leading-tight">{listing.title}</h1>
          <p className="text-lg text-amber-100 max-w-3xl">{listing.description}</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-[2fr,1fr] gap-10">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="relative h-72">
              <Image
                src={listing.image ?? FALLBACK_LISTING_IMAGE}
                alt={`Photo of ${listing.title}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            </div>
            <div className="p-6 space-y-4">
              <p className="text-3xl font-bold text-amber-700">{formatCurrency(listing.priceCents)}</p>
              <p className="text-neutral-700 leading-relaxed">{listing.description}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Listing details</h2>
            <dl className="space-y-3 text-neutral-700">
              <div>
                <dt className="font-medium text-neutral-900">Location</dt>
                <dd>{listing.location}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-900">Posted</dt>
                <dd>{formatDate(listing.postedAt)}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-900">Category</dt>
                <dd className="capitalize">{listing.type}</dd>
              </div>
            </dl>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Chat with the seller</h3>
            <p className="text-neutral-700 mb-4">
              Reach out via the UiQ messaging centre to organise viewing or pickup arrangements.
            </p>
            <Link
              href="/messages"
              className="inline-flex items-center justify-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              Open messages
            </Link>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-amber-900 mb-2">Stay safe</h3>
            <ul className="list-disc list-inside text-amber-800 space-y-1">
              <li>Meet in public places</li>
              <li>Use secure payment methods</li>
              <li>Report suspicious listings</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
