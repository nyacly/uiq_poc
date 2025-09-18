import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'

interface SearchPageProps {
  searchParams: { q?: string }
}

async function searchContent(query: string) {
  if (!query || query.trim().length < 2) {
    return { businesses: [], events: [], announcements: [], listings: [] }
  }

  const searchTerm = query.trim()

  try {
    const [businesses, events, announcements, listings] = await Promise.all([
      prisma.business.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { description: { contains: searchTerm } },
            { category: { contains: searchTerm } },
          ]
        },
        include: { owner: true },
        take: 20
      }),
      prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } },
            { category: { contains: searchTerm } },
          ]
        },
        include: { organiser: true },
        take: 20
      }),
      prisma.announcement.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm } },
            { body: { contains: searchTerm } },
          ]
        },
        include: { author: true },
        take: 20
      }),
      prisma.listing.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } },
            { type: { contains: searchTerm } },
          ]
        },
        include: { owner: true },
        take: 20
      })
    ])

    return { businesses, events, announcements, listings }
  } catch (error) {
    console.error('Search query failed when reading from Prisma. Returning empty results.', error)
    return { businesses: [], events: [], announcements: [], listings: [] }
  }
}

function SearchResults({ query }: { query: string }) {
  return (
    <Suspense fallback={<div>Searching...</div>}>
      <SearchResultsContent query={query} />
    </Suspense>
  )
}

async function SearchResultsContent({ query }: { query: string }) {
  const { businesses, events, announcements, listings } = await searchContent(query)
  
  const totalResults = businesses.length + events.length + announcements.length + listings.length

  if (totalResults === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No results found</h2>
        <p className="text-gray-600 mb-8">
          Try adjusting your search terms or browse our categories below.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/directory">
            <Button variant="outline">Browse Directory</Button>
          </Link>
          <Link href="/events">
            <Button variant="outline">View Events</Button>
          </Link>
          <Link href="/classifieds">
            <Button variant="outline">Browse Classifieds</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Businesses */}
      {businesses.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Businesses ({businesses.length})
          </h2>
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
      )}

      {/* Events */}
      {events.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Events ({events.length})
          </h2>
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
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Announcements ({announcements.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Listings */}
      {listings.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Listings ({listings.length})
          </h2>
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
      )}
    </div>
  )
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ''

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {query ? `Search Results for "${query}"` : 'Search'}
        </h1>
        
        {/* Search Bar */}
        <form action="/search" method="GET" className="max-w-2xl">
          <div className="flex">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search businesses, events, listings..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <Button type="submit" className="px-6 py-3 rounded-r-lg rounded-l-none">
              Search
            </Button>
          </div>
        </form>
      </div>

      <SearchResults query={query} />
    </div>
  )
}

