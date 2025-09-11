// UiQ Featured Businesses Carousel
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

// Mock data using our sample businesses from database
const featuredBusinesses = [
  {
    id: 'biz1',
    name: "Nakato's African Cuisine",
    slug: 'nakatos-african-cuisine',
    category: 'Restaurant',
    description: 'Authentic Ugandan and East African dishes made with love. Specializing in matoke, posho, groundnut stew, and rolex.',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop&auto=format',
    rating: 4.9,
    reviewCount: 24,
    location: 'South Brisbane',
    tags: ['African Cuisine', 'Ugandan Food', 'Halal'],
    verified: true,
    plan: 'Premium'
  },
  {
    id: 'biz2',
    name: 'Mukasa Auto Services',
    slug: 'mukasa-auto-services',
    category: 'Automotive',
    description: 'Professional automotive repair and maintenance services. Specializing in pre-purchase inspections and roadworthy certificates.',
    image: 'https://images.unsplash.com/photo-1632823471565-1ecdf2df44b2?w=600&h=400&fit=crop&auto=format',
    rating: 4.8,
    reviewCount: 18,
    location: 'Toowoomba',
    tags: ['Auto Repair', 'Roadworthy', 'Trusted'],
    verified: true,
    plan: 'Standard'
  },
  {
    id: 'biz3',
    name: 'Uganda Tech Solutions',
    slug: 'uganda-tech-solutions',
    category: 'Technology',
    description: 'IT support and digital solutions for small businesses and individuals. Computer repairs, website development, and tech consulting.',
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&h=400&fit=crop&auto=format',
    rating: 4.7,
    reviewCount: 15,
    location: 'Brisbane',
    tags: ['IT Support', 'Web Development', 'Tech Consulting'],
    verified: true,
    plan: 'Standard'
  }
]

export function FeaturedBusinesses() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlay) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredBusinesses.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlay])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredBusinesses.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredBusinesses.length) % featuredBusinesses.length)
  }

  return (
    <section className="py-16 bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-h2 font-bold text-accent-900 mb-4">
            Featured Businesses
          </h2>
          <p className="text-body-lg text-accent-600 max-w-2xl mx-auto">
            Discover trusted Ugandan-owned businesses that our community recommends
          </p>
        </div>

        {/* Carousel */}
        <div 
          className="relative"
          onMouseEnter={() => setIsAutoPlay(false)}
          onMouseLeave={() => setIsAutoPlay(true)}
        >
          {/* Business Cards */}
          <div className="overflow-hidden rounded-2xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {featuredBusinesses.map((business) => (
                <div key={business.id} className="w-full flex-shrink-0">
                  <Link 
                    href={`/directory/${business.slug}`}
                    className="block group"
                  >
                    <div className="grid md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
                      {/* Image */}
                      <div className="relative h-64 md:h-80 bg-surface-200">
                        <Image
                          src={business.image}
                          alt={business.name}
                          layout="fill"
                          objectFit="cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex gap-2">
                          {business.verified && (
                            <Badge variant="verified" size="sm">Verified</Badge>
                          )}
                          {business.plan === 'Premium' && (
                            <Badge variant="premium" size="sm">Premium</Badge>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-8 flex flex-col justify-center">
                        <div className="mb-4">
                          <span className="text-caption-md text-primary-600 font-semibold mb-2 block">
                            {business.category}
                          </span>
                          <h3 className="text-h3 font-bold text-accent-900 mb-3 group-hover:text-primary-600 transition-colors">
                            {business.name}
                          </h3>
                          <p className="text-body-md text-accent-600 leading-relaxed mb-4">
                            {business.description}
                          </p>
                        </div>

                        {/* Rating and Location */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-1">
                            <div className="flex text-secondary-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <svg 
                                  key={i} 
                                  className={cn(
                                    "w-4 h-4",
                                    i < Math.floor(business.rating) ? "fill-current" : "fill-surface-300"
                                  )}
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-caption-md text-accent-600 ml-1">
                              {business.rating} ({business.reviewCount} reviews)
                            </span>
                          </div>
                          <span className="text-caption-md text-accent-500">
                            📍 {business.location}
                          </span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          {business.tags.slice(0, 3).map((tag) => (
                            <span 
                              key={tag}
                              className="px-3 py-1 text-caption-sm text-accent-600 bg-surface-100 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* CTA */}
                        <div className="flex items-center text-primary-600 font-semibold group-hover:text-primary-700 transition-colors">
                          <span className="mr-2">View Business</span>
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-card hover:shadow-card-hover transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-200"
            aria-label="Previous business"
          >
            <svg className="w-5 h-5 text-accent-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-card hover:shadow-card-hover transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-200"
            aria-label="Next business"
          >
            <svg className="w-5 h-5 text-accent-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {featuredBusinesses.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-200",
                  index === currentSlide 
                    ? "bg-primary-600 scale-125" 
                    : "bg-surface-300 hover:bg-surface-400"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* View All CTA */}
        <div className="text-center mt-12">
          <Link 
            href="/directory"
            className="inline-flex items-center px-8 py-4 text-body-lg font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-primary-200"
          >
            <span className="mr-2">🏢</span>
            View All Businesses
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}