// UiQ Newsletter Signup
'use client'
import { useState } from 'react'

export function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }

    try {
      // Simulate API call - replace with actual newsletter service
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStatus('success')
      setMessage('Thank you for subscribing! Check your email for confirmation.')
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <section className="py-16 bg-accent-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <h2 className="text-h2 font-bold text-white mb-4">
              Stay Connected with UiQ
            </h2>
            <p className="text-body-lg text-neutral-300 max-w-2xl mx-auto">
              Get the latest community news, event updates, and opportunities delivered straight to your inbox. 
              Join over 1,000 community members staying informed.
            </p>
          </div>

          {/* Newsletter Benefits */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: '📅',
                title: 'Event Updates',
                description: 'Be the first to know about cultural events, workshops, and community gatherings'
              },
              {
                icon: '💼',
                title: 'Opportunities',
                description: 'Get notified about job openings, scholarships, grants, and business opportunities'
              },
              {
                icon: '🏢',
                title: 'Business Spotlights',
                description: 'Discover new Ugandan businesses and service providers in your area'
              }
            ].map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl mb-3">
                  {benefit.icon}
                </div>
                <h3 className="text-h4 font-semibold text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-body-sm text-neutral-300 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          {/* Signup Form */}
          <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto shadow-card">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="newsletter-email" className="block text-h4 font-semibold text-accent-900 mb-4">
                  Join Our Newsletter
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    id="newsletter-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading'}
                    className="flex-1 px-4 py-4 border-2 border-surface-300 rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading' || !email.trim()}
                    className="px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                  >
                    {status === 'loading' ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Subscribing...
                      </div>
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                </div>
              </div>

              {/* Status Message */}
              {message && (
                <div className={`
                  p-4 rounded-lg text-body-sm font-medium
                  ${status === 'success' 
                    ? 'bg-success-50 text-success-700 border border-success-200' 
                    : 'bg-error-50 text-error-700 border border-error-200'
                  }
                `}>
                  {message}
                </div>
              )}

              {/* Privacy Notice */}
              <p className="text-caption-md text-accent-500 leading-relaxed">
                We respect your privacy. Unsubscribe at any time. 
                <br className="hidden sm:block" />
                Read our{' '}
                <a href="/privacy-policy" className="text-primary-600 hover:text-primary-700 underline">
                  Privacy Policy
                </a>{' '}
                for more information.
              </p>
            </form>
          </div>

          {/* Social Proof */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8">
            <div className="flex items-center text-neutral-300">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-body-sm">1,000+ subscribers</span>
            </div>
            <div className="flex items-center text-neutral-300">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-body-sm">Weekly updates</span>
            </div>
            <div className="flex items-center text-neutral-300">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-body-sm">No spam, ever</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}