// UiQ Programs & Opportunities Highlights
import Link from 'next/link'

interface Opportunity {
  id: string;
  title: string;
  org: string;
  type: 'grant' | 'job' | 'scholarship';
  deadline: string;
  amount?: string;
  description: string;
  isUrgent: boolean;
  location?: string;
}

// Mock data using our sample programs and opportunities
const opportunities: Opportunity[] = [
  {
    id: 'prog1',
    title: 'Queensland Government Multicultural Business Grant',
    org: 'Queensland Government',
    type: 'grant',
    deadline: '2024-11-30',
    amount: '$10,000',
    description: 'Grants for multicultural entrepreneurs to start or expand their businesses in Queensland.',
    isUrgent: false
  },
  {
    id: 'opp1',
    title: 'Community Health Worker - Multicultural Communities',
    org: 'Queensland Health',
    type: 'job',
    deadline: '2024-09-30',
    location: 'Brisbane, QLD',
    description: 'Join Queensland Health focusing on multicultural communities health education and support.',
    isUrgent: true
  },
  {
    id: 'prog2',
    title: 'Australia Awards Scholarships',
    org: 'Department of Foreign Affairs',
    type: 'scholarship',
    deadline: '2024-10-15',
    amount: 'Full scholarship',
    description: 'Full scholarships for postgraduate study at Australian universities.',
    isUrgent: false
  },
  {
    id: 'opp4',
    title: 'Ugandan Women\'s Leadership Development Grant',
    org: 'Queensland Women',
    type: 'grant',
    deadline: '2024-11-20',
    amount: 'Various amounts',
    description: 'Training and development grants for Ugandan women looking to advance their careers.',
    isUrgent: false
  }
]

function formatDeadline(deadline: string): string {
  const date = new Date(deadline)
  const now = new Date()
  const timeDiff = date.getTime() - now.getTime()
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
  
  if (daysDiff < 0) return 'Expired'
  if (daysDiff === 0) return 'Due today'
  if (daysDiff === 1) return 'Due tomorrow'
  if (daysDiff <= 7) return `${daysDiff} days left`
  if (daysDiff <= 30) return `${Math.ceil(daysDiff / 7)} weeks left`
  return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'grant': return '💰'
    case 'scholarship': return '🎓'
    case 'job': return '💼'
    case 'training': return '📚'
    case 'volunteer': return '🤝'
    default: return '🎯'
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'grant': return 'text-success-700 bg-success-50 border-success-200'
    case 'scholarship': return 'text-info-700 bg-info-50 border-info-200'
    case 'job': return 'text-primary-700 bg-primary-50 border-primary-200'
    case 'training': return 'text-secondary-700 bg-secondary-50 border-secondary-200'
    case 'volunteer': return 'text-accent-700 bg-accent-50 border-accent-200'
    default: return 'text-accent-700 bg-accent-50 border-accent-200'
  }
}

export function ProgramsOpportunities() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-h2 font-bold text-accent-900 mb-4">
            Programs & Opportunities
          </h2>
          <p className="text-body-lg text-accent-600 max-w-2xl mx-auto">
            Discover scholarships, grants, job opportunities, and programs designed to help our community thrive
          </p>
        </div>

        {/* Opportunities Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {opportunities.map((opportunity) => {
            const daysDiff = Math.ceil((new Date(opportunity.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
            const isUrgent = daysDiff <= 7 || opportunity.isUrgent
            
            return (
              <Link 
                key={opportunity.id}
                href={`/opportunities/${opportunity.id}`}
                className="group block"
              >
                <article className={`
                  relative p-6 border-2 rounded-2xl transition-all duration-300 hover:shadow-card-hover
                  ${isUrgent 
                    ? 'border-warning-300 bg-gradient-to-br from-warning-50 to-white' 
                    : 'border-surface-200 hover:border-primary-300 bg-white'
                  }
                `}>
                  {/* Urgent Badge */}
                  {isUrgent && (
                    <div className="absolute top-4 right-4 bg-warning-500 text-white px-3 py-1 text-caption-xs rounded-full font-bold">
                      URGENT
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-3xl">
                      {getTypeIcon(opportunity.type)}
                    </div>
                    <div className="flex-1">
                      <span className={`
                        inline-flex items-center px-3 py-1 text-caption-sm font-semibold rounded-full border mb-2
                        ${getTypeColor(opportunity.type)}
                      `}>
                        {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
                      </span>
                      <h3 className="text-h4 font-semibold text-accent-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {opportunity.title}
                      </h3>
                    </div>
                  </div>

                  {/* Organization */}
                  <div className="text-caption-md text-primary-600 font-medium mb-3">
                    {opportunity.org}
                  </div>

                  {/* Description */}
                  <p className="text-body-sm text-accent-600 leading-relaxed mb-4 line-clamp-2">
                    {opportunity.description}
                  </p>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    {/* Amount/Value */}
                    {opportunity.amount && (
                      <div className="flex items-center text-caption-md">
                        <svg className="w-4 h-4 mr-2 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span className="text-success-700 font-semibold">
                          {opportunity.amount}
                        </span>
                      </div>
                    )}

                    {/* Location */}
                    {opportunity.location && (
                      <div className="flex items-center text-caption-md text-accent-600">
                        <svg className="w-4 h-4 mr-2 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {opportunity.location}
                      </div>
                    )}

                    {/* Deadline */}
                    <div className={`flex items-center text-caption-md ${isUrgent ? 'text-warning-700' : 'text-accent-600'}`}>
                      <svg className="w-4 h-4 mr-2 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={isUrgent ? 'font-semibold' : ''}>
                        Deadline: {formatDeadline(opportunity.deadline)}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between">
                    <span className="text-primary-600 font-semibold group-hover:text-primary-700 transition-colors">
                      Learn More & Apply
                    </span>
                    <svg className="w-4 h-4 text-primary-600 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>

        {/* Quick Categories */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          {[
            { type: 'scholarships', icon: '🎓', label: 'Scholarships' },
            { type: 'grants', icon: '💰', label: 'Grants' },
            { type: 'jobs', icon: '💼', label: 'Jobs' },
            { type: 'training', icon: '📚', label: 'Training' },
            { type: 'volunteer', icon: '🤝', label: 'Volunteer' }
          ].map((category) => (
            <Link
              key={category.type}
              href={`/opportunities?type=${category.type}`}
              className="text-center p-4 bg-surface-50 hover:bg-primary-50 rounded-xl transition-colors group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                {category.icon}
              </div>
              <div className="text-caption-md font-medium text-accent-700 group-hover:text-primary-600 transition-colors">
                {category.label}
              </div>
            </Link>
          ))}
        </div>

        {/* Newsletter Signup for Opportunities */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-8 text-center border border-primary-200">
          <h3 className="text-h3 font-semibold text-accent-900 mb-3">
            Never Miss an Opportunity
          </h3>
          <p className="text-body-md text-accent-600 mb-6 max-w-xl mx-auto">
            Get notified about new scholarships, grants, and job opportunities that match your interests
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors">
              Subscribe
            </button>
          </div>
        </div>

        {/* View All CTA */}
        <div className="text-center mt-12">
          <Link 
            href="/opportunities"
            className="inline-flex items-center px-8 py-4 text-body-lg font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors duration-200"
          >
            <span className="mr-2">🎯</span>
            View All Opportunities
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}