// UiQ Quick Category Navigation Tiles
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CategoryTile {
  title: string
  description: string
  icon: string
  href: string
  color: string
  bgColor: string
  count?: string
}

const categories: CategoryTile[] = [
  {
    title: 'Business Directory',
    description: 'Discover trusted Ugandan-owned businesses and service providers',
    icon: '🏢',
    href: '/directory',
    color: 'text-primary-700',
    bgColor: 'bg-primary-50 hover:bg-primary-100',
    count: '100+'
  },
  {
    title: 'Cultural Events',
    description: 'Join community celebrations, workshops, and networking events',
    icon: '📅',
    href: '/events',
    color: 'text-secondary-800',
    bgColor: 'bg-secondary-50 hover:bg-secondary-100',
    count: '50+'
  },
  {
    title: 'Announcements',
    description: 'Community news, bereavements, celebrations, and important notices',
    icon: '📢',
    href: '/announcements',
    color: 'text-accent-700',
    bgColor: 'bg-accent-50 hover:bg-accent-100',
    count: 'New'
  },
  {
    title: 'Marketplace',
    description: 'Buy, sell, and find housing within our trusted community network',
    icon: '🏷️',
    href: '/classifieds',
    color: 'text-success-700',
    bgColor: 'bg-success-50 hover:bg-success-100',
    count: '200+'
  }
]

export function CategoryTiles() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-h2 font-bold text-accent-900 mb-4">
            Explore Our Community
          </h2>
          <p className="text-body-lg text-accent-600 max-w-2xl mx-auto">
            Everything you need to connect, discover, and thrive in the Ugandan community across Queensland
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={category.href}
              className={cn(
                "group relative p-6 rounded-2xl border-2 border-surface-200 transition-all duration-300",
                "hover:border-primary-300 hover:shadow-card-hover focus:outline-none focus:ring-4 focus:ring-primary-200",
                category.bgColor
              )}
            >
              {/* Icon */}
              <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                {category.icon}
              </div>

              {/* Count Badge */}
              {category.count && (
                <div className="absolute top-4 right-4">
                  <span className={cn(
                    "px-2 py-1 text-caption-sm font-semibold rounded-full",
                    category.count === 'New' 
                      ? "bg-primary-600 text-white" 
                      : "bg-white text-accent-600 border border-surface-300"
                  )}>
                    {category.count}
                  </span>
                </div>
              )}

              {/* Content */}
              <h3 className={cn(
                "text-h4 font-semibold mb-3 group-hover:text-primary-600 transition-colors",
                category.color
              )}>
                {category.title}
              </h3>
              
              <p className="text-body-sm text-accent-600 leading-relaxed mb-4">
                {category.description}
              </p>

              {/* Arrow Icon */}
              <div className="flex items-center text-caption-md font-medium text-accent-600 group-hover:text-primary-600 transition-colors">
                <span className="mr-2">Explore</span>
                <svg 
                  className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Additional Quick Links */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/programs" 
              className="px-6 py-3 text-body-md font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <span className="mr-2">🎯</span>
              Programs & Opportunities
            </Link>
            <Link 
              href="/whatsapp-groups" 
              className="px-6 py-3 text-body-md font-medium text-success-600 bg-success-50 hover:bg-success-100 rounded-lg transition-colors"
            >
              <span className="mr-2">💬</span>
              WhatsApp Groups
            </Link>
            <Link 
              href="/membership" 
              className="px-6 py-3 text-body-md font-medium text-secondary-800 bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors"
            >
              <span className="mr-2">⭐</span>
              Membership Plans
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}