import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }

  const searchTerm = query.trim()

  try {
    // Search across multiple entities
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
        take: 5
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
        take: 5
      }),
      prisma.announcement.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm } },
            { body: { contains: searchTerm } },
          ]
        },
        include: { author: true },
        take: 5
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
        take: 5
      })
    ])

    const results = {
      businesses: businesses.map(business => ({
        id: business.id,
        type: 'business',
        title: business.name,
        description: business.description,
        category: business.category,
        url: `/directory/${business.slug}`,
        verified: business.verified,
        rating: business.ratingAvg
      })),
      events: events.map(event => ({
        id: event.id,
        type: 'event',
        title: event.title,
        description: event.description,
        category: event.category,
        url: `/events/${event.id}`,
        startAt: event.startAt,
        venue: event.venue
      })),
      announcements: announcements.map(announcement => ({
        id: announcement.id,
        type: 'announcement',
        title: announcement.title,
        description: announcement.body.substring(0, 150) + '...',
        category: announcement.type,
        url: `/announcements/${announcement.id}`,
        author: announcement.author.name
      })),
      listings: listings.map(listing => ({
        id: listing.id,
        type: 'listing',
        title: listing.title,
        description: listing.description,
        category: listing.type,
        url: `/classifieds/${listing.slug}`,
        price: listing.priceCents,
        location: listing.location
      }))
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

