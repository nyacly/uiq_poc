import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { prisma } from '@/lib/db'
import { buildPageMetadata } from '@/lib/metadata'
import { sampleBusinesses } from '@/data/sample-content'

interface BusinessPageParams {
  params: { slug: string }
}

interface BusinessRecord {
  slug: string
  name: string
  description: string
  category: string
  location?: string
  ratingAvg?: number
  ratingCount?: number
  verified?: boolean
  plan?: string
  ownerName?: string
  email?: string | null
  phone?: string | null
  image?: string
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&h=600&fit=crop&auto=format'

async function getBusiness(slug: string): Promise<BusinessRecord | null> {
  try {
    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        owner: { select: { name: true, email: true } }
      }
    })

    if (business) {
      return {
        slug: business.slug,
        name: business.name,
        description: business.description,
        category: business.category,
        location: business.address,
        ratingAvg: business.ratingAvg,
        ratingCount: business.ratingCount,
        verified: business.verified,
        plan: business.plan,
        ownerName: business.owner?.name ?? undefined,
        email: business.email ?? business.owner?.email ?? null,
        phone: business.phone ?? null,
        image: FALLBACK_IMAGE
      }
    }
  } catch (error) {
    console.error('Failed to fetch business from database, falling back to sample data', error)
  }

  const sample = sampleBusinesses.find((business) => business.slug === slug)
  if (!sample) {
    return null
  }

  return {
    slug: sample.slug,
    name: sample.name,
    description: sample.description,
    category: sample.category,
    location: sample.location,
    ratingAvg: sample.ratingAvg,
    ratingCount: sample.ratingCount,
    verified: sample.verified,
    plan: sample.plan,
    ownerName: 'UiQ Community',
    email: null,
    phone: null,
    image: sample.image
  }
}

export async function generateMetadata({ params }: BusinessPageParams): Promise<Metadata> {
  const business = await getBusiness(params.slug)

  if (!business) {
    return {
      title: 'Business not found',
      description: 'The requested business could not be located in the UiQ directory.',
      robots: {
        index: false,
        follow: false
      }
    }
  }

  return buildPageMetadata({
    title: business.name,
    description: business.description,
    path: `/directory/${params.slug}`,
    keywords: [business.name, business.category, 'Ugandan business', 'Queensland'],
    category: business.category,
    ogType: 'business.business'
  })
}

export async function generateStaticParams() {
  return sampleBusinesses.map((business) => ({ slug: business.slug }))
}

export default async function BusinessDetailPage({ params }: BusinessPageParams) {
  const business = await getBusiness(params.slug)

  if (!business) {
    notFound()
  }

  const ratingDisplay =
    business.ratingAvg !== undefined && business.ratingCount !== undefined
      ? `${business.ratingAvg.toFixed(1)} (${business.ratingCount} reviews)`
      : 'No reviews yet'

  return (
    <div className="bg-neutral-50 min-h-screen">
      <section className="bg-gradient-to-r from-primary-700 to-primary-500 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-[2fr,1fr] gap-10 items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 text-sm bg-white/10 rounded-full">{business.category}</span>
                {business.verified && (
                  <span className="px-3 py-1 text-sm bg-emerald-500/20 border border-emerald-200 text-white rounded-full">
                    Verified listing
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-4 text-white">{business.name}</h1>
              <p className="text-lg text-primary-100 leading-relaxed max-w-2xl">{business.description}</p>

              <div className="mt-8 grid sm:grid-cols-2 gap-4 text-sm text-primary-100">
                {business.location && (
                  <div>
                    <p className="font-semibold text-white">Location</p>
                    <p>{business.location}</p>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">Member plan</p>
                  <p>{business.plan ?? 'Community'}</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Rating</p>
                  <p>{ratingDisplay}</p>
                </div>
                {business.ownerName && (
                  <div>
                    <p className="font-semibold text-white">Listed by</p>
                    <p>{business.ownerName}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="relative h-64 rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={business.image ?? FALLBACK_IMAGE}
                alt={`Photo for ${business.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-[2fr,1fr] gap-10">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">About {business.name}</h2>
              <p className="text-neutral-700 leading-relaxed">{business.description}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-4">
              <h2 className="text-2xl font-semibold text-neutral-900">Popular services</h2>
              <ul className="list-disc list-inside text-neutral-700 space-y-2">
                <li>Community-focused service experience</li>
                <li>Support tailored for Ugandans in Queensland</li>
                <li>Flexible appointment scheduling</li>
              </ul>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Get in touch</h3>
              <ul className="space-y-3 text-neutral-700">
                {business.email && (
                  <li>
                    <Link href={`mailto:${business.email}`} className="text-primary-600 hover:underline">
                      {business.email}
                    </Link>
                  </li>
                )}
                {business.phone && <li>{business.phone}</li>}
                {business.location && <li>{business.location}</li>}
              </ul>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-primary-800 mb-2">Promote your business</h3>
              <p className="text-primary-700 mb-4">
                Feature your services, share updates, and reach Ugandans across Queensland.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
              >
                View membership plans
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Accepted payments</h3>
              <ul className="space-y-2 text-neutral-700">
                <li>Cash and EFTPOS</li>
                <li>Mobile money transfers</li>
                <li>Community member discounts</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
