import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  sampleAnnouncements,
  sampleBusinesses,
  sampleEvents,
  sampleListings
} from '@/data/sample-content'

async function getFeaturedData() {
  try {
    const [businesses, events, announcements, listings] = await Promise.all([
      prisma.business.findMany({
        where: { verified: true },
        include: { owner: true },
        orderBy: { ratingAvg: 'desc' },
        take: 6
      }),
      prisma.event.findMany({
        where: {
          startAt: { gte: new Date() }
        },
        include: { organiser: true },
        orderBy: { startAt: 'asc' },
        take: 4
      }),
      prisma.announcement.findMany({
        where: {
          type: 'BEREAVEMENT',
          featured: true
        },
        include: { author: true },
        orderBy: { createdAt: 'desc' },
        take: 3
      }),
      prisma.listing.findMany({
        where: { status: 'active' },
        include: { owner: true },
        orderBy: { createdAt: 'desc' },
        take: 6
      })
    ])

    const hasContent =
      businesses.length > 0 ||
      events.length > 0 ||
      announcements.length > 0 ||
      listings.length > 0

    if (hasContent) {
      return { businesses, events, announcements, listings }
    }
  } catch (error) {
    console.error('Failed to load featured content from Prisma. Returning empty collections.', error)
  }

  // Fallback to curated sample content so the homepage never renders empty
  return {
    businesses: sampleBusinesses.map((business) => ({
      ...business,
      owner: { name: 'UiQ Community' }
    })),
    events: sampleEvents.map((event) => ({
      ...event,
      organiser: { name: event.organiser }
    })),
    announcements: sampleAnnouncements.map((announcement) => ({
      ...announcement,
      author: { name: announcement.author }
    })),
    listings: sampleListings.map((listing) => ({
      ...listing,
      owner: { name: 'UiQ Community' }
    }))
  }
}

export default async function HomePage() {
  const { businesses, events, announcements, listings } = await getFeaturedData()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to UiQ Community Hub
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Connecting Ugandans in Queensland through shared experiences, services, and opportunities
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <form action="/search" method="GET" className="flex">
                <input
                  type="search"
                  name="q"
                  placeholder="Search businesses, events, listings..."
                  className="flex-1 px-6 py-4 text-gray-900 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
                <Button type="submit" className="px-8 py-4 bg-white text-primary-600 hover:bg-gray-100 rounded-r-lg rounded-l-none">
                  Search
                </Button>
              </form>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/directory">
                <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Browse Directory
                </Button>
              </Link>
              <Link href="/events">
                <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  View Events
                </Button>
              </Link>
              <Link href="/classifieds">
                <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Classifieds
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Featured Businesses */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Businesses</h2>
            <Link href="/directory">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <Card key={business.id} hoverable>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{business.name}</CardTitle>
                    {business.verified && <Badge variant="verified">Verified</Badge>}
                  </div>
                  <p className="text-sm text-gray-600">{business.category}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4 line-clamp-2">{business.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-yellow-400">★</span>
                      <span className="ml-1 text-sm text-gray-600">
                        {business.ratingAvg.toFixed(1)} ({business.ratingCount})
                      </span>
                    </div>
                    <Link href={`/directory/${business.slug}`}>
                      <Button size="sm">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
            <Link href="/events">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <Card key={event.id} hoverable>
                <CardHeader>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <p className="text-sm text-gray-600">{event.category}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4 line-clamp-2">{event.description}</p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>📅 {formatDate(event.startAt)}</p>
                    <p>📍 {event.venue}</p>
                    {event.priceCents > 0 && (
                      <p>💰 {formatCurrency(event.priceCents)}</p>
                    )}
                  </div>
                  <div className="mt-4">
                    <Link href={`/events/${event.id}`}>
                      <Button size="sm">Learn More</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Community Announcements */}
        {announcements.length > 0 && (
          <section className="mb-16">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Community Announcements</h2>
              <Link href="/announcements">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className="border-l-4 border-l-gray-400">
                  <CardHeader>
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    <p className="text-sm text-gray-600">By {announcement.author.name}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4 line-clamp-3">{announcement.body}</p>
                    <Link href={`/announcements/${announcement.id}`}>
                      <Button size="sm" variant="outline">Read More</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Latest Listings */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Latest Listings</h2>
            <Link href="/classifieds">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card key={listing.id} hoverable>
                <CardHeader>
                  <CardTitle className="text-lg">{listing.title}</CardTitle>
                  <p className="text-sm text-gray-600 capitalize">{listing.type}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary-600 mb-2">
                    {formatCurrency(listing.priceCents)}
                  </p>
                  <p className="text-gray-700 mb-4 line-clamp-2">{listing.description}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">📍 {listing.location}</p>
                    <Link href={`/classifieds/${listing.slug}`}>
                      <Button size="sm">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}