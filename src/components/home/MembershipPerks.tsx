// UiQ Business Listing Plans - CMS Configurable
import Link from 'next/link'
import { getBusinessSubscriptionPlans, formatPrice, getButtonStyleClasses } from '@/lib/db/subscription-plans'
import type { SubscriptionPlan } from '@/lib/db'

// Server component to fetch plans from database
export async function MembershipPerks() {
  const businessPlans = await getBusinessSubscriptionPlans()
  return (
    <section className="py-16 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-h2 font-bold text-accent-900 mb-4">
            Business Listing Plans
          </h2>
          <p className="text-body-lg text-accent-600 max-w-2xl mx-auto">
            Get your business discovered by the UiQ community. Choose the plan that best fits your growth goals.
          </p>
        </div>

        {/* Business Plan Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {businessPlans.map((plan) => {
            const features = Array.isArray(plan.features) ? plan.features : []
            const periodDisplay = plan.billingPeriod === 'monthly' ? '/month' : 
                                 plan.billingPeriod === 'yearly' ? '/year' : ''
            
            return (
              <div
                key={plan.id}
                className={`
                  relative rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-card-hover
                  ${plan.isPopular 
                    ? 'border-primary-300 bg-gradient-to-br from-primary-50 to-white scale-105' 
                    : 'border-surface-200 bg-white hover:border-primary-200'
                  }
                `}
              >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary-600 text-white px-6 py-2 rounded-full text-caption-md font-bold shadow-card">
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-h3 font-bold text-accent-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center mb-4">
                    <span className="text-4xl font-bold text-primary-600">
                      {formatPrice(plan.priceCents, plan.currency)}
                    </span>
                    <span className="text-body-md text-accent-600 ml-1">
                      {periodDisplay}
                    </span>
                  </div>
                  <p className="text-body-sm text-accent-600">
                    {plan.description}
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-4 mb-8">
                  {features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <svg className="w-5 h-5 text-success-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-body-sm text-accent-700">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  href={`/business/subscribe/${plan.slug}`}
                  className={`
                    block w-full px-6 py-4 text-center text-body-md font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-200
                    ${getButtonStyleClasses(plan.buttonStyle || 'primary')}
                  `}
                >
                  {plan.buttonText || 'Get Started'}
                </Link>
              </div>
            )
          })}
        </div>

        {/* Business Benefits Highlight */}
        <div className="bg-white rounded-2xl p-8 border border-surface-200 shadow-card">
          <div className="text-center mb-8">
            <h3 className="text-h3 font-semibold text-accent-900 mb-3">
              Why List Your Business with UiQ?
            </h3>
            <p className="text-body-md text-accent-600 max-w-2xl mx-auto">
              Connect with 500+ active community members actively seeking trusted Ugandan businesses and services in Queensland
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '🎯',
                title: 'Targeted Audience',
                description: 'Reach Ugandans who actively support community businesses'
              },
              {
                icon: '📈',
                title: 'Business Growth',
                description: 'Increase visibility and customer base within our trusted network'
              },
              {
                icon: '💬',
                title: 'Direct Communication',
                description: 'Connect with customers through WhatsApp and direct contact forms'
              },
              {
                icon: '🏆',
                title: 'Community Trust',
                description: 'Build credibility through reviews and community recommendations'
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

        {/* Money-back Guarantee */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center px-6 py-3 bg-success-50 border border-success-200 rounded-lg">
            <svg className="w-5 h-5 text-success-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-success-700 font-medium text-body-sm">
              30-day free trial • Cancel anytime • No setup fees • Community support guaranteed
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}