import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { prisma } from '@/lib/db'
import { buildPageMetadata } from '@/lib/metadata'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { sampleEvents } from '@/data/sample-content'

interface EventPageParams {
  params: { eventId: string }
}

interface EventRecord {
  id: string
  title: string
  description: string
  category: string
  startAt: string
  endAt?: string | null
  venue: string
  priceCents: number
  organiser?: string
}

async function getEvent(eventId: string): Promise<EventRecord | null> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organiser: { select: { name: true } }
      }
    })

    if (event) {
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt?.toISOString(),
        venue: event.venue,
        priceCents: event.priceCents,
        organiser: event.organiser?.name
      }
    }
  } catch (error) {
    console.error('Failed to fetch event from database, falling back to sample data', error)
  }

  const sample = sampleEvents.find((event) => event.id === eventId || event.slug === eventId)
  if (!sample) {
    return null
  }

  return {
    id: sample.id,
    title: sample.title,
    description: sample.description,
    category: sample.category,
    startAt: sample.startAt,
    endAt: sample.endAt,
    venue: sample.venue,
    priceCents: sample.priceCents,
    organiser: sample.organiser
  }
}

export async function generateMetadata({ params }: EventPageParams): Promise<Metadata> {
  const event = await getEvent(params.eventId)

  if (!event) {
    return {
      title: 'Event not found',
      description: 'The requested event could not be located in the UiQ calendar.',
      robots: {
        index: false,
        follow: false
      }
    }
  }

  return buildPageMetadata({
    title: event.title,
    description: event.description,
    path: `/events/${params.eventId}`,
    keywords: [event.title, event.category, 'Ugandan events', 'Queensland'],
    category: event.category
  })
}

export async function generateStaticParams() {
  return sampleEvents.map((event) => ({ eventId: event.id }))
}

export default async function EventDetailPage({ params }: EventPageParams) {
  const event = await getEvent(params.eventId)

  if (!event) {
    notFound()
  }

  const hasTicketCost = event.priceCents > 0

  return (
    <div className="bg-neutral-50 min-h-screen">
      <section className="bg-gradient-to-r from-secondary-700 via-secondary-600 to-secondary-500 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
          <span className="inline-flex px-3 py-1 rounded-full bg-white/10 text-sm uppercase tracking-wide">
            {event.category}
          </span>
          <h1 className="text-4xl font-bold leading-tight">{event.title}</h1>
          <p className="text-lg text-secondary-100 max-w-3xl">{event.description}</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-[2fr,1fr] gap-10">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">When</h2>
              <p className="text-neutral-700">
                {formatDateTime(event.startAt)}
                {event.endAt && (
                  <>
                    {' '}– {formatDateTime(event.endAt)}
                  </>
                )}
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Where</h2>
              <p className="text-neutral-700">{event.venue}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Cost</h2>
              <p className="text-neutral-700">
                {hasTicketCost ? formatCurrency(event.priceCents) : 'Free for the community'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Program highlights</h2>
            <ul className="list-disc list-inside text-neutral-700 space-y-2">
              <li>Community networking and support</li>
              <li>Authentic Ugandan cuisine and music</li>
              <li>Opportunities to connect with organisers</li>
            </ul>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Organised by</h3>
            <p className="text-neutral-700">{event.organiser ?? 'UiQ Community'}</p>
            <Link href="/events" className="inline-flex mt-4 text-secondary-700 font-semibold">
              View all events
            </Link>
          </div>

          <div className="bg-secondary-50 border border-secondary-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">Invite friends</h3>
            <p className="text-secondary-700 mb-4">
              Share this event with the community and bring someone new along.
            </p>
            <Link
              href={`mailto:?subject=${encodeURIComponent(`Join me at ${event.title}`)}&body=${encodeURIComponent(`Check out this UiQ event: https://uiq-community.com/events/${event.id}`)}`}
              className="inline-flex items-center justify-center px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700"
            >
              Send email invite
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
