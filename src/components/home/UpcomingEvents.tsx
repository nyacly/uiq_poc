// UiQ Upcoming Events Section
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'

// Mock data using our sample events from database
const upcomingEvents = [
  {
    id: 'evt1',
    title: 'Uganda Independence Day Celebration 2024',
    slug: 'uganda-independence-day-2024',
    category: 'Cultural',
    startDate: '2024-10-09',
    startTime: '14:00',
    endTime: '20:00',
    location: 'Musgrave Park',
    address: 'Musgrave Park, South Brisbane QLD',
    description: 'Join us for a spectacular celebration of Uganda\'s Independence Day! Traditional music, dance performances, authentic food stalls, and cultural activities for the whole family.',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop&auto=format',
    attendees: 245,
    maxAttendees: 500,
    price: 'Free',
    featured: true
  },
  {
    id: 'evt2', 
    title: 'UiQ Business Networking Mixer',
    slug: 'uiq-business-networking-mixer',
    category: 'Business',
    startDate: '2024-09-20',
    startTime: '18:00',
    endTime: '21:00',
    location: 'Brisbane Convention Centre',
    address: 'Cnr Merivale & Glenelg Streets, South Brisbane QLD',
    description: 'Monthly networking event for Ugandan business owners and professionals in Queensland. Great opportunity to connect, share experiences, and grow your network.',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&h=400&fit=crop&auto=format',
    attendees: 67,
    maxAttendees: 100,
    price: '$25',
    featured: false
  },
  {
    id: 'evt3',
    title: 'Education Workshop: Australian School System',
    slug: 'education-workshop-school-system',
    category: 'Education',
    startDate: '2024-09-15',
    startTime: '10:00',
    endTime: '15:00',
    location: 'Brisbane City Library',
    address: '266 George Street, Brisbane QLD',
    description: 'Free workshop for Ugandan families navigating the Australian education system. Topics include school applications, NAPLAN, university pathways, and scholarship opportunities.',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9d1?w=600&h=400&fit=crop&auto=format',
    attendees: 32,
    maxAttendees: 50,
    price: 'Free',
    featured: false
  }
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-AU', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric'
  })
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export function UpcomingEvents() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-h2 font-bold text-accent-900 mb-4">
              Upcoming Events
            </h2>
            <p className="text-body-lg text-accent-600 max-w-2xl">
              Join our vibrant community gatherings, cultural celebrations, and professional development events
            </p>
          </div>
          <Link 
            href="/events"
            className="hidden md:inline-flex items-center px-6 py-3 text-body-md font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            View All Events
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {upcomingEvents.map((event) => (
            <Link 
              key={event.id}
              href={`/events/${event.slug}`}
              className="group block"
            >
              <article className="bg-white border border-surface-200 rounded-2xl overflow-hidden hover:shadow-card-hover hover:border-primary-300 transition-all duration-300">
                {/* Event Image */}
                <div className="relative h-48 bg-surface-200">
                  <Image
                    src={event.image}
                    alt={event.title}
                    layout="fill"
                    objectFit="cover"
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Date Badge */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 text-center shadow-card">
                    <div className="text-h4 font-bold text-primary-600">
                      {new Date(event.startDate).getDate()}
                    </div>
                    <div className="text-caption-sm text-accent-600 font-medium">
                      {new Date(event.startDate).toLocaleDateString('en-AU', { month: 'short' })}
                    </div>
                  </div>

                  {/* Featured Badge */}
                  {event.featured && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="featured" size="sm">Featured</Badge>
                    </div>
                  )}

                  {/* Price Badge */}
                  <div className="absolute bottom-4 right-4 bg-accent-900/90 text-white px-3 py-1 rounded-full text-caption-md font-semibold">
                    {event.price}
                  </div>
                </div>

                {/* Event Content */}
                <div className="p-6">
                  {/* Category */}
                  <span className="inline-block px-3 py-1 text-caption-sm font-semibold text-secondary-700 bg-secondary-100 rounded-full mb-3">
                    {event.category}
                  </span>

                  {/* Title */}
                  <h3 className="text-h4 font-semibold text-accent-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {event.title}
                  </h3>

                  {/* Description */}
                  <p className="text-body-sm text-accent-600 leading-relaxed mb-4 line-clamp-3">
                    {event.description}
                  </p>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    {/* Date and Time */}
                    <div className="flex items-center text-caption-md text-accent-600">
                      <svg className="w-4 h-4 mr-2 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {formatDate(event.startDate)} • {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center text-caption-md text-accent-600">
                      <svg className="w-4 h-4 mr-2 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="line-clamp-1">{event.location}</span>
                    </div>

                    {/* Attendees */}
                    <div className="flex items-center text-caption-md text-accent-600">
                      <svg className="w-4 h-4 mr-2 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>
                        {event.attendees} attending
                        {event.maxAttendees && (
                          <span className="text-accent-500"> • {event.maxAttendees - event.attendees} spots left</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* RSVP Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-primary-600 font-semibold group-hover:text-primary-700 transition-colors">
                      View Details
                    </span>
                    <div className="flex items-center text-caption-sm text-accent-500">
                      <span className="mr-1">RSVP</span>
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* View All Events (Mobile) */}
        <div className="text-center mt-12 md:hidden">
          <Link 
            href="/events"
            className="inline-flex items-center px-8 py-4 text-body-lg font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors duration-200"
          >
            <span className="mr-2">📅</span>
            View All Events
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}