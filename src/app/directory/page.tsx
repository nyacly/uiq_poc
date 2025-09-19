import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { formatRelativeTime } from '@/lib/utils'
import { sampleBusinesses, sampleEvents } from '@/data/sample-content'
import { buildPageMetadata } from '@/lib/metadata'
import { BusinessSubmissionForm } from '@/components/forms/BusinessSubmissionForm'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Business Directory',
    description:
      'Discover trusted Ugandan-owned businesses across Queensland and explore service categories tailored to our community.',
    path: '/directory',
    keywords: ['business directory', 'Ugandan businesses', 'Queensland services', 'verified businesses'],
    category: 'Business'
  })
}

export default function DirectoryPage() {
  const categories = Array.from(new Set(sampleBusinesses.map((business) => business.category))).sort()
  const featuredBusinesses = sampleBusinesses
  const upcomingEvents = sampleEvents.slice(0, 2)

  return (
    <MainLayout className="bg-neutral-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="featured" size="sm" className="mb-4 bg-white/10 text-white border-white/20">
                UiQ Business Directory
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Discover trusted Ugandan-owned businesses across Queensland
              </h1>
              <p className="text-lg text-primary-100 mb-8">
                Explore professional services, cultural experiences, and community-led organisations that understand our
                community.
              </p>

              <form action="/search" method="GET" className="bg-white/10 backdrop-blur rounded-xl p-2 flex flex-col sm:flex-row gap-2">
                <label htmlFor="directory-search" className="sr-only">
                  Search the UiQ business directory
                </label>
                <input
                  id="directory-search"
                  type="search"
                  name="q"
                  placeholder="Search by business name or service"
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none"
                />
                <Button type="submit" className="shrink-0">
                  Search directory
                </Button>
              </form>

              <div className="mt-8 flex flex-wrap gap-6 text-primary-100">
                <div>
                  <p className="text-3xl font-semibold text-white">{featuredBusinesses.length}</p>
                  <p className="text-sm uppercase tracking-wide">Verified businesses</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-white">{categories.length}</p>
                  <p className="text-sm uppercase tracking-wide">Service categories</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-white">{upcomingEvents.length}</p>
                  <p className="text-sm uppercase tracking-wide">Community meetups</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-6">
                {featuredBusinesses.slice(0, 4).map((business) => (
                  <div key={business.id} className="bg-white/10 rounded-2xl p-4 backdrop-blur">
                    <div className="relative h-32 rounded-xl overflow-hidden mb-4">
                      <Image src={business.image} alt={business.name} fill className="object-cover" />
                    </div>
                    <p className="text-sm uppercase text-primary-200 font-semibold">{business.category}</p>
                    <p className="font-semibold text-white">{business.name}</p>
                    <p className="text-sm text-primary-100">{business.location}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <BusinessSubmissionForm />
        </section>

        {/* Categories */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Browse by service</h2>
              <p className="text-gray-600 mt-2">
                From hospitality to home care, find providers who speak our language and understand our culture.
              </p>
            </div>
            <Link href="/groups" className="text-primary-600 font-semibold">
              Request a new category →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-card-hover transition">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                  <Badge variant="outline" className="text-primary-600 border-primary-200">
                    {featuredBusinesses.filter((business) => business.category === category).length} listed
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Trusted professionals ready to support Ugandan families and businesses across Queensland.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured businesses */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured businesses</h2>
              <p className="text-gray-600 mt-2">
                Handpicked members of our community delivering excellent service and cultural care.
              </p>
            </div>
            <Link href="/pricing">
              <Button variant="outline">List your business</Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredBusinesses.map((business) => (
              <Card key={business.id} hoverable>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden">
                      <Image src={business.image} alt={business.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{business.name}</CardTitle>
                      <p className="text-sm text-gray-600">{business.location}</p>
                    </div>
                    {business.verified && <Badge variant="verified">Verified</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm font-semibold text-primary-600">{business.category}</p>
                  <p className="text-gray-700 line-clamp-3">{business.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>⭐ {business.ratingAvg.toFixed(1)} ({business.ratingCount} reviews)</span>
                    <span>{business.plan} plan</span>
                  </div>
                  <Link href={`/directory/${business.slug}`} className="inline-flex items-center text-primary-600 font-semibold">
                    View profile
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Upcoming events */}
        <section className="bg-white border border-gray-200 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Meet the community offline</h2>
              <p className="text-gray-600 mt-2">
                Connect with other business owners and families at upcoming UiQ gatherings.
              </p>
            </div>
            <Link href="/events">
              <Button variant="outline">View all events</Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex gap-4 p-5 border border-gray-100 rounded-xl hover:border-primary-200 transition">
                <div className="flex-shrink-0 text-center bg-primary-50 rounded-xl px-4 py-3">
                  <p className="text-2xl font-bold text-primary-700">{new Date(event.startAt).getDate()}</p>
                  <p className="text-xs uppercase tracking-wider text-primary-600">
                    {new Date(event.startAt).toLocaleDateString('en-AU', { month: 'short' })}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-primary-600">{event.category}</p>
                  <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                  <div className="text-sm text-gray-500">
                    <p>📍 {event.venue}</p>
                    <p>⏰ {formatRelativeTime(event.startAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  )
}

