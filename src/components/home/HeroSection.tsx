// UiQ Hero Section with Global Search
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 py-16 lg:py-24 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Ugandan Flag Colors Accent */}
        <div className="flex justify-center mb-8">
          <div className="flex h-2 w-32 rounded-full overflow-hidden shadow-sm">
            <div className="w-1/3 bg-accent-900"></div>
            <div className="w-1/3 bg-secondary-400"></div>
            <div className="w-1/3 bg-primary-600"></div>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-accent-900 mb-6 text-balance">
          Karibu to{' '}
          <span className="text-primary-600">UiQ</span>
        </h1>
        
        {/* Subtitle */}
        <h2 className="text-xl md:text-2xl lg:text-3xl text-secondary-700 font-semibold mb-4">
          Ugandans in Queensland
        </h2>
        
        {/* Description */}
        <p className="text-lg md:text-xl text-accent-700 mb-12 max-w-4xl mx-auto text-balance leading-relaxed">
          Your digital home connecting our vibrant Ugandan community across Queensland. 
          Discover trusted businesses, celebrate our culture, find opportunities, and build lasting friendships.
        </p>

        {/* Global Search */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="relative">
            <div className={cn(
              "relative transition-all duration-300 group",
              searchFocused && "transform scale-105"
            )}>
              <input
                type="search"
                placeholder="Search businesses, events, services, or opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={cn(
                  "w-full pl-14 pr-6 py-5 text-lg border-2 border-surface-300 rounded-2xl",
                  "bg-white/90 backdrop-blur-sm focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-200",
                  "placeholder-accent-500 transition-all duration-300 focus:outline-none",
                  "shadow-card hover:shadow-card-hover"
                )}
              />
              <div className="absolute left-5 top-1/2 transform -translate-y-1/2">
                <svg className="w-6 h-6 text-accent-500 group-focus-within:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-accent-500 hover:text-accent-700 rounded-full hover:bg-surface-100 transition-colors"
                  aria-label="Clear search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </form>

          {/* Popular Searches */}
          <div className="mt-6">
            <p className="text-caption-lg text-accent-600 mb-3">Popular searches:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'African restaurants',
                'Cultural events',
                'Housing',
                'Auto services',
                'Job opportunities',
                'WhatsApp groups'
              ].map((term) => (
                <button
                  key={term}
                  onClick={() => setSearchQuery(term)}
                  className="px-4 py-2 text-caption-md text-accent-600 bg-white/70 hover:bg-white border border-surface-200 rounded-full hover:border-primary-300 hover:text-primary-700 transition-all duration-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
          <Link 
            href="/directory" 
            className="flex-1 px-8 py-4 bg-primary-600 text-white text-body-lg font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-card hover:shadow-card-hover focus:outline-none focus:ring-4 focus:ring-primary-200"
          >
            <span className="mr-2">🏢</span>
            Explore Directory
          </Link>
          <Link 
            href="/events" 
            className="flex-1 px-8 py-4 bg-secondary-500 text-accent-900 text-body-lg font-semibold rounded-xl hover:bg-secondary-600 transition-all duration-200 shadow-card hover:shadow-card-hover focus:outline-none focus:ring-4 focus:ring-secondary-200"
          >
            <span className="mr-2">📅</span>
            View Events
          </Link>
        </div>

        {/* Community Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { number: '500+', label: 'Community Members' },
            { number: '100+', label: 'Local Businesses' },
            { number: '50+', label: 'Monthly Events' },
            { number: '20+', label: 'WhatsApp Groups' }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary-600 mb-1">
                {stat.number}
              </div>
              <div className="text-caption-lg text-accent-600">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}