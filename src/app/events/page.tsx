import Image from 'next/image'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { sampleEvents } from '@/data/sample-content'

export default function EventsPage() {
  const categories = Array.from(new Set(sampleEvents.map((event) => event.category)))

  return (
    <MainLayout className="bg-neutral-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-secondary-700 via-secondary-600 to-secondary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="featured" size="sm" className="mb-4 bg-white/10 text-white border-white/20">
                UiQ Events & Gatherings
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Celebrate, connect, and grow together</h1>
              <p className="text-lg text-secondary-100 mb-8">
                Discover cultural celebrations, professional meetups, and family-friendly gatherings hosted by the Ugandan
                community across Queensland.
              </p>

              <div className="flex flex-wrap gap-4 text-secondary-100">
                <div>
                  <p className="text-3xl font-semibold text-white">{sampleEvents.length}</p>
                  <p className="text-sm uppercase tracking-wide">Upcoming events</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-white">{categories.length}</p>
                  <p className="text-sm uppercase tracking-wide">Themes & focus areas</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-white">100%</p>
                  <p className="text-sm uppercase tracking-wide">Community-led</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {sampleEvents.slice(0, 2).map((event) => (
                  <div key={event.id} className="bg-white/10 rounded-2xl p-4 backdrop-blur">
                    <div className="relative h-36 rounded-xl overflow-hidden mb-4">
                      <Image src={event.image} alt={event.title} fill className="object-cover" />
                    </div>
                    <p className="text-sm uppercase text-secondary-200 font-semibold">{event.category}</p>
                    <p className="font-semibold text-white">{event.title}</p>
                    <p className="text-sm text-secondary-100">{formatDate(event.startAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Category filters */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Explore by interest</h2>
              <p className="text-gray-600 mt-1">Events tailored for professionals, families, students, and creatives.</p>
            </div>
            <Link href="/announcements" className="text-secondary-700 font-semibold">
              Submit an event →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category}
                className="px-4 py-2 rounded-full border border-secondary-200 text-secondary-700 bg-secondary-50 text-sm font-medium"
              >
                {category}
              </span>
            ))}
          </div>
        </section>

        {/* Events grid */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Upcoming gatherings</h2>
              <p className="text-gray-600 mt-2">
                Save your spot, invite friends, and be part of the Ugandan heartbeat in Queensland.
              </p>
            </div>
            <Link href="/groups">
              <Button variant="outline">Start a community group</Button>
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {sampleEvents.map((event) => (
              <Card key={event.id} hoverable>
                <div className="relative h-56 w-full overflow-hidden rounded-t-2xl">
                  <Image src={event.image} alt={event.title} fill className="object-cover" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg px-4 py-2 text-center">
                    <p className="text-xl font-semibold text-secondary-700">
                      {new Date(event.startAt).toLocaleDateString('en-AU', { day: '2-digit' })}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-secondary-500">
                      {new Date(event.startAt).toLocaleDateString('en-AU', { month: 'short' })}
                    </p>
                  </div>
                  {event.priceCents === 0 ? (
                    <Badge variant="featured" className="absolute top-4 right-4">
                      Free
                    </Badge>
                  ) : (
                    <div className="absolute top-4 right-4 bg-secondary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {formatCurrency(event.priceCents)}
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="border-secondary-200 text-secondary-700">
                      {event.category}
                    </Badge>
                    <span className="text-sm text-gray-500">Hosted by {event.organiser}</span>
                  </div>
                  <CardTitle className="text-2xl leading-snug">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">{event.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                    <div>
                      <p className="font-semibold text-gray-800">Date & time</p>
                      <p>{formatDateTime(event.startAt)}</p>
                      <p>{formatDateTime(event.endAt)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Location</p>
                      <p>{event.venue}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-gray-500">Doors open 30 minutes before start time</span>
                    <Link href={`/events/${event.slug}`} className="inline-flex items-center text-secondary-700 font-semibold">
                      View details
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section className="bg-secondary-700 text-white rounded-3xl px-8 py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-3">Host a gathering with UiQ support</h2>
            <p className="text-secondary-100 max-w-2xl">
              Planning a meetup, workshop, or celebration? Share the details with us and we will help promote it across the
              UiQ community.
            </p>
          </div>
          <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
            Submit event details
          </Button>
        </section>
      </div>
    </MainLayout>
  )
}

