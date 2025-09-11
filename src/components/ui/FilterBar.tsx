'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, Star, Shield, DollarSign, X, ChevronDown } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

// Filter state interface
export interface FilterState {
  location?: string
  radius?: number
  categories?: string[]
  competences?: string[]
  minRating?: number
  verified?: boolean
  minPrice?: number
  maxPrice?: number
}

// Location autocomplete item
interface LocationOption {
  id: string
  name: string
  suburb: string
  postcode: string
  coordinates?: [number, number]
}

// Sample Queensland locations for autocomplete
const qldLocations: LocationOption[] = [
  { id: 'bris-city', name: 'Brisbane City', suburb: 'Brisbane', postcode: '4000' },
  { id: 'gold-coast', name: 'Gold Coast', suburb: 'Surfers Paradise', postcode: '4217' },
  { id: 'sunshine-coast', name: 'Sunshine Coast', suburb: 'Maroochydore', postcode: '4558' },
  { id: 'toowoomba', name: 'Toowoomba', suburb: 'Toowoomba City', postcode: '4350' },
  { id: 'cairns', name: 'Cairns', suburb: 'Cairns City', postcode: '4870' },
  { id: 'townsville', name: 'Townsville', suburb: 'Townsville City', postcode: '4810' },
  { id: 'ipswich', name: 'Ipswich', suburb: 'Ipswich City', postcode: '4305' },
  { id: 'redlands', name: 'Redlands', suburb: 'Cleveland', postcode: '4163' },
  { id: 'logan', name: 'Logan', suburb: 'Logan Central', postcode: '4114' },
  { id: 'moreton-bay', name: 'Moreton Bay', suburb: 'Caboolture', postcode: '4510' }
]

// Business categories for UiQ platform
const businessCategories = [
  'Food & Restaurants', 'Professional Services', 'Health & Wellness', 
  'Beauty & Personal Care', 'Home & Garden', 'Automotive', 
  'Education & Training', 'Technology', 'Real Estate', 
  'Finance & Legal', 'Entertainment', 'Retail & Shopping'
]

// Competence/skill tags
const competenceTags = [
  'Digital Marketing', 'Accounting', 'Legal Services', 'Web Development',
  'Graphic Design', 'Photography', 'Catering', 'Event Planning',
  'Consulting', 'Translation', 'Tutoring', 'Fitness Training',
  'Hair & Beauty', 'Car Repairs', 'Home Cleaning', 'Construction'
]

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void
  className?: string
}

export function FilterBar({ onFilterChange, className = '' }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({})
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Autocomplete states
  const [locationQuery, setLocationQuery] = useState('')
  const [showLocationOptions, setShowLocationOptions] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [showCompetences, setShowCompetences] = useState(false)

  // Initialize filters from URL
  useEffect(() => {
    const urlFilters: FilterState = {}
    
    if (searchParams.get('location')) urlFilters.location = searchParams.get('location')!
    if (searchParams.get('radius')) urlFilters.radius = parseInt(searchParams.get('radius')!)
    if (searchParams.get('categories')) urlFilters.categories = searchParams.get('categories')!.split(',')
    if (searchParams.get('competences')) urlFilters.competences = searchParams.get('competences')!.split(',')
    if (searchParams.get('minRating')) urlFilters.minRating = parseInt(searchParams.get('minRating')!)
    if (searchParams.get('verified')) urlFilters.verified = searchParams.get('verified') === 'true'
    if (searchParams.get('minPrice')) urlFilters.minPrice = parseInt(searchParams.get('minPrice')!)
    if (searchParams.get('maxPrice')) urlFilters.maxPrice = parseInt(searchParams.get('maxPrice')!)
    
    setFilters(urlFilters)
    if (urlFilters.location) setLocationQuery(urlFilters.location)
  }, [searchParams])

  // Update URL when filters change
  const updateURL = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams()
    
    if (newFilters.location) params.set('location', newFilters.location)
    if (newFilters.radius) params.set('radius', newFilters.radius.toString())
    if (newFilters.categories?.length) params.set('categories', newFilters.categories.join(','))
    if (newFilters.competences?.length) params.set('competences', newFilters.competences.join(','))
    if (newFilters.minRating) params.set('minRating', newFilters.minRating.toString())
    if (newFilters.verified) params.set('verified', 'true')
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice.toString())
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice.toString())
    
    const queryString = params.toString()
    router.push(queryString ? `?${queryString}` : window.location.pathname, { scroll: false })
  }, [router])

  // Handle filter updates
  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    updateURL(updated)
    onFilterChange(updated)
  }

  // Reset all filters
  const resetFilters = () => {
    setFilters({})
    setLocationQuery('')
    updateURL({})
    onFilterChange({})
  }

  // Location autocomplete
  const filteredLocations = qldLocations.filter(loc =>
    loc.name.toLowerCase().includes(locationQuery.toLowerCase()) ||
    loc.suburb.toLowerCase().includes(locationQuery.toLowerCase()) ||
    loc.postcode.includes(locationQuery)
  )

  // Toggle category selection
  const toggleCategory = (category: string) => {
    const currentCategories = filters.categories || []
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category]
    updateFilters({ categories: newCategories.length ? newCategories : undefined })
  }

  // Toggle competence selection
  const toggleCompetence = (competence: string) => {
    const currentCompetences = filters.competences || []
    const newCompetences = currentCompetences.includes(competence)
      ? currentCompetences.filter(c => c !== competence)
      : [...currentCompetences, competence]
    updateFilters({ competences: newCompetences.length ? newCompetences : undefined })
  }

  // Rating stars component
  const RatingStars = ({ rating, onRatingChange }: { rating?: number, onRatingChange: (rating: number) => void }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRatingChange(star)}
          className={`p-1 rounded transition-colors ${
            (rating || 0) >= star 
              ? 'text-yellow-400 hover:text-yellow-500' 
              : 'text-gray-300 hover:text-gray-400'
          }`}
        >
          <Star className="w-4 h-4 fill-current" />
        </button>
      ))}
    </div>
  )

  return (
    <div className={cn("sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main filter row */}
        <div className="flex items-center gap-4 py-4 flex-wrap">
          {/* Location Picker */}
          <div className="relative flex-1 min-w-[280px]">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Location (suburb, postcode)"
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value)
                  setShowLocationOptions(true)
                }}
                onFocus={() => setShowLocationOptions(true)}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              {/* Radius selector */}
              <select
                value={filters.radius || 10}
                onChange={(e) => updateFilters({ radius: parseInt(e.target.value) })}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs bg-gray-50 border-l border-gray-300 px-2 py-1 rounded-r-lg"
              >
                <option value={5}>5km</option>
                <option value={10}>10km</option>
                <option value={25}>25km</option>
                <option value={50}>50km</option>
                <option value={100}>100km</option>
              </select>
            </div>
            
            {/* Location autocomplete dropdown */}
            {showLocationOptions && filteredLocations.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                {filteredLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => {
                      setLocationQuery(`${location.name}, ${location.postcode}`)
                      updateFilters({ location: `${location.name}, ${location.postcode}` })
                      setShowLocationOptions(false)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{location.name}</div>
                    <div className="text-sm text-gray-500">{location.suburb}, QLD {location.postcode}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick filters */}
          <div className="flex items-center gap-2">
            {/* More filters toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="whitespace-nowrap"
            >
              More Filters <ChevronDown className={`ml-1 w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>

            {/* Reset button */}
            {Object.keys(filters).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="text-gray-600 whitespace-nowrap"
              >
                <X className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Expanded filters */}
        {isExpanded && (
          <div className="pb-6 space-y-4 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Categories */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Categories</label>
                <div className="relative">
                  <button
                    onClick={() => setShowCategories(!showCategories)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-left"
                  >
                    <span className="text-sm text-gray-900">
                      {filters.categories?.length ? `${filters.categories.length} selected` : 'Any category'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  {showCategories && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                      {businessCategories.map((category) => (
                        <label key={category} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.categories?.includes(category) || false}
                            onChange={() => toggleCategory(category)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 mr-2"
                          />
                          <span className="text-sm text-gray-900">{category}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Competences */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Skills & Services</label>
                <div className="relative">
                  <button
                    onClick={() => setShowCompetences(!showCompetences)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-left"
                  >
                    <span className="text-sm text-gray-900">
                      {filters.competences?.length ? `${filters.competences.length} selected` : 'Any skill'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  {showCompetences && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                      {competenceTags.map((competence) => (
                        <label key={competence} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.competences?.includes(competence) || false}
                            onChange={() => toggleCompetence(competence)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 mr-2"
                          />
                          <span className="text-sm text-gray-900">{competence}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Rating Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Minimum Rating</label>
                <div className="flex items-center gap-2">
                  <RatingStars 
                    rating={filters.minRating} 
                    onRatingChange={(rating) => updateFilters({ minRating: rating })} 
                  />
                  <span className="text-sm text-gray-600">
                    {filters.minRating ? `${filters.minRating}+ stars` : 'Any rating'}
                  </span>
                </div>
              </div>

              {/* Verified Toggle */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.verified || false}
                    onChange={(e) => updateFilters({ verified: e.target.checked || undefined })}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Verified only</span>
                </label>
              </div>

              {/* Price Range */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Price Range (AUD)</label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice || ''}
                      onChange={(e) => updateFilters({ minPrice: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-24 pl-8 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <span className="text-gray-400">to</span>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice || ''}
                      onChange={(e) => updateFilters({ maxPrice: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-24 pl-8 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active filters display */}
        {Object.keys(filters).length > 0 && (
          <div className="pb-4 flex flex-wrap gap-2">
            {filters.location && (
              <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                <MapPin className="w-3 h-3 mr-1" />
                {filters.location}
                <button onClick={() => updateFilters({ location: undefined })} className="ml-1 hover:text-red-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.categories?.map((category) => (
              <span key={category} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {category}
                <button onClick={() => toggleCategory(category)} className="ml-1 hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.verified && (
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                <Shield className="w-3 h-3 mr-1" />
                Verified
                <button onClick={() => updateFilters({ verified: undefined })} className="ml-1 hover:text-green-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Click outside handlers */}
      {showLocationOptions && (
        <div className="fixed inset-0 z-30" onClick={() => setShowLocationOptions(false)} />
      )}
      {showCategories && (
        <div className="fixed inset-0 z-30" onClick={() => setShowCategories(false)} />
      )}
      {showCompetences && (
        <div className="fixed inset-0 z-30" onClick={() => setShowCompetences(false)} />
      )}
    </div>
  )
}