// UiQ Latest Announcements Section (Bereavements Pinned)
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

// Mock data using our sample announcements from database
const latestAnnouncements = [
  {
    id: 'ann1',
    title: 'Remembering Mama Jane Kasozi',
    slug: 'remembering-mama-jane-kasozi',
    type: 'bereavement',
    content: 'It is with heavy hearts that we announce the passing of our beloved community elder, Mama Jane Kasozi, who peacefully passed away on September 5th. Mama Jane was a pillar of our UiQ community, always ready with wisdom, kindness, and the best stories of home.',
    contributionUrl: 'https://gofundme.com/mama-jane-kasozi-memorial',
    featured: true,
    verified: true,
    createdAt: '2024-09-05'
  },
  {
    id: 'ann3',
    title: 'Congratulations to Dr. Patricia Nambi!',
    slug: 'congratulations-dr-patricia-nambi',
    type: 'achievement',
    content: 'Big congratulations to our very own Dr. Patricia Nambi for completing her PhD in Public Health at UQ! She is the first in her family to achieve this milestone. We are so proud of your achievement, Patricia!',
    featured: true,
    verified: true,
    createdAt: '2024-09-03'
  },
  {
    id: 'ann2',
    title: 'UiQ Community WhatsApp Groups Updated',
    slug: 'uiq-whatsapp-groups-updated',
    type: 'notice',
    content: 'We have reorganized our community WhatsApp groups for better communication! New groups include: Business Network, Cultural Events, Housing & Roommates, and Emergency Support.',
    featured: false,
    verified: true,
    createdAt: '2024-09-01'
  }
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-AU', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  })
}

function getAnnouncementIcon(type: string): string {
  switch (type) {
    case 'bereavement': return '🕊️'
    case 'achievement': return '🎉'
    case 'wedding': return '💒'
    case 'birth': return '👶'
    case 'notice': return '📢'
    default: return '📣'
  }
}

function getAnnouncementColor(type: string): string {
  switch (type) {
    case 'bereavement': return 'text-accent-700 bg-accent-50'
    case 'achievement': return 'text-success-700 bg-success-50'
    case 'wedding': return 'text-primary-700 bg-primary-50'
    case 'birth': return 'text-secondary-700 bg-secondary-50'
    case 'notice': return 'text-info-700 bg-info-50'
    default: return 'text-accent-700 bg-accent-50'
  }
}

export function LatestAnnouncements() {
  // Sort with bereavements pinned to top
  const sortedAnnouncements = [...latestAnnouncements].sort((a, b) => {
    if (a.type === 'bereavement' && b.type !== 'bereavement') return -1
    if (b.type === 'bereavement' && a.type !== 'bereavement') return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <section className="py-16 bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-h2 font-bold text-accent-900 mb-4">
              Community Announcements
            </h2>
            <p className="text-body-lg text-accent-600 max-w-2xl">
              Stay updated with our community news, celebrations, and important notices
            </p>
          </div>
          <Link 
            href="/announcements"
            className="hidden md:inline-flex items-center px-6 py-3 text-body-md font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            View All Announcements
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Announcements Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAnnouncements.map((announcement, index) => (
            <Link 
              key={announcement.id}
              href={`/announcements/${announcement.slug}`}
              className="group block"
            >
              <article className={`
                bg-white border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-card-hover
                ${announcement.type === 'bereavement' 
                  ? 'border-accent-200 bg-gradient-to-br from-white to-accent-50' 
                  : 'border-surface-200 hover:border-primary-300'
                }
              `}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getAnnouncementIcon(announcement.type)}
                    </div>
                    <div>
                      <span className={`
                        inline-flex items-center px-3 py-1 text-caption-sm font-semibold rounded-full
                        ${getAnnouncementColor(announcement.type)}
                      `}>
                        {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex gap-2">
                    {announcement.type === 'bereavement' && (
                      <div className="bg-accent-800 text-white px-2 py-1 text-caption-xs rounded-full font-medium">
                        PINNED
                      </div>
                    )}
                    {announcement.featured && (
                      <Badge variant="featured" size="sm">Featured</Badge>
                    )}
                    {announcement.verified && (
                      <Badge variant="verified" size="sm">Verified</Badge>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-h4 font-semibold text-accent-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                  {announcement.title}
                </h3>

                {/* Content Preview */}
                <p className="text-body-sm text-accent-600 leading-relaxed mb-4 line-clamp-3">
                  {announcement.content}
                </p>

                {/* Special Actions for Bereavement */}
                {announcement.type === 'bereavement' && announcement.contributionUrl && (
                  <div className="mb-4 p-3 bg-accent-100 rounded-lg border border-accent-200">
                    <div className="flex items-center justify-between">
                      <span className="text-caption-md text-accent-700 font-medium">
                        💝 Support the family
                      </span>
                      <span className="text-caption-sm text-accent-600">
                        Contribution link available
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-caption-md text-accent-500">
                    {formatDate(announcement.createdAt)}
                  </span>
                  <div className="flex items-center text-primary-600 group-hover:text-primary-700 transition-colors">
                    <span className="text-caption-md font-medium mr-1">Read More</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-12 text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <Link 
              href="/announcements/bereavements"
              className="flex-1 px-6 py-3 text-body-md font-medium text-accent-700 bg-accent-50 hover:bg-accent-100 rounded-xl transition-colors border border-accent-200"
            >
              <span className="mr-2">🕊️</span>
              Bereavements & Support
            </Link>
            <Link 
              href="/announcements/celebrations"
              className="flex-1 px-6 py-3 text-body-md font-medium text-success-700 bg-success-50 hover:bg-success-100 rounded-xl transition-colors border border-success-200"
            >
              <span className="mr-2">🎉</span>
              Celebrations & Achievements
            </Link>
          </div>

          {/* View All (Mobile) */}
          <div className="md:hidden">
            <Link 
              href="/announcements"
              className="inline-flex items-center px-8 py-4 text-body-lg font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors duration-200"
            >
              <span className="mr-2">📢</span>
              View All Announcements
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}