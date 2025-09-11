// UiQ WhatsApp Community CTA
import Link from 'next/link'

// Mock WhatsApp groups data
const whatsappGroups = [
  {
    name: 'UiQ General Community',
    description: 'Main community discussions and updates',
    members: 350,
    category: 'General'
  },
  {
    name: 'Business Network',
    description: 'Connect with entrepreneurs and professionals',
    members: 120,
    category: 'Business'
  },
  {
    name: 'Cultural Events',
    description: 'Stay updated on cultural celebrations and activities',
    members: 200,
    category: 'Events'
  },
  {
    name: 'Housing & Roommates',
    description: 'Find housing and connect with roommates',
    members: 180,
    category: 'Housing'
  },
  {
    name: 'Emergency Support',
    description: 'Community support for urgent situations',
    members: 280,
    category: 'Support'
  },
  {
    name: 'New Arrivals Welcome',
    description: 'Support and guidance for new community members',
    members: 95,
    category: 'Welcome'
  }
]

export function WhatsAppCTA() {
  return (
    <section className="py-16 bg-gradient-to-br from-success-50 to-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main CTA */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success-500 rounded-2xl mb-6">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.785"/>
            </svg>
          </div>
          
          <h2 className="text-h2 font-bold text-accent-900 mb-4">
            Join Our WhatsApp Community
          </h2>
          <p className="text-body-lg text-accent-600 max-w-3xl mx-auto mb-8">
            Connect instantly with fellow Ugandans across Queensland. Get real-time updates, find support, 
            and stay connected with our vibrant community through our organized WhatsApp groups.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
            <Link 
              href="/whatsapp-groups"
              className="flex-1 px-8 py-4 bg-success-600 text-white text-body-lg font-semibold rounded-xl hover:bg-success-700 transition-all duration-200 shadow-card hover:shadow-card-hover focus:outline-none focus:ring-4 focus:ring-success-200"
            >
              <span className="mr-2">📱</span>
              Join Groups
            </Link>
            <Link 
              href="/whatsapp-groups/guidelines"
              className="flex-1 px-8 py-4 bg-white text-success-600 text-body-lg font-semibold rounded-xl border-2 border-success-200 hover:bg-success-50 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-success-200"
            >
              <span className="mr-2">📋</span>
              View Guidelines
            </Link>
          </div>
        </div>

        {/* WhatsApp Groups Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {whatsappGroups.map((group, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-surface-200 hover:border-success-300 hover:shadow-card transition-all duration-300"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-success-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.785"/>
                    </svg>
                  </div>
                  <span className="px-3 py-1 text-caption-sm font-semibold text-success-700 bg-success-100 rounded-full">
                    {group.category}
                  </span>
                </div>
                <div className="text-caption-sm text-accent-500 font-medium">
                  {group.members} members
                </div>
              </div>

              {/* Group Info */}
              <h3 className="text-h5 font-semibold text-accent-900 mb-2">
                {group.name}
              </h3>
              <p className="text-body-sm text-accent-600 leading-relaxed mb-4">
                {group.description}
              </p>

              {/* Join Button */}
              <button className="w-full px-4 py-3 bg-success-50 text-success-700 font-semibold rounded-lg hover:bg-success-100 transition-colors border border-success-200 focus:outline-none focus:ring-2 focus:ring-success-500">
                Request to Join
              </button>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl p-8 border border-surface-200">
          <h3 className="text-h3 font-semibold text-accent-900 mb-6 text-center">
            Why Join Our WhatsApp Community?
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '⚡',
                title: 'Real-time Updates',
                description: 'Get instant notifications about events, opportunities, and community news'
              },
              {
                icon: '🤝',
                title: 'Mutual Support',
                description: 'Connect with fellow community members for advice, help, and friendship'
              },
              {
                icon: '🏠',
                title: 'Housing & Services',
                description: 'Find roommates, housing, and connect with trusted service providers'
              },
              {
                icon: '🎉',
                title: 'Cultural Connection',
                description: 'Stay connected to Ugandan culture and celebrate together in Queensland'
              }
            ].map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl mb-3">
                  {benefit.icon}
                </div>
                <h4 className="text-h5 font-semibold text-accent-900 mb-2">
                  {benefit.title}
                </h4>
                <p className="text-body-sm text-accent-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Community Guidelines Preview */}
        <div className="mt-12 text-center">
          <p className="text-caption-lg text-accent-600 mb-4">
            Our WhatsApp groups follow community guidelines to ensure a respectful and supportive environment for everyone.
          </p>
          <Link 
            href="/community-guidelines"
            className="text-primary-600 hover:text-primary-700 font-medium text-body-md transition-colors underline"
          >
            Read Community Guidelines →
          </Link>
        </div>
      </div>
    </section>
  )
}