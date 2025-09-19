// UiQ AppBar Component - Enhanced header with global search
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export interface AppBarProps {
  className?: string
  showSearch?: boolean
  onMenuClick?: () => void
  showMenuButton?: boolean
}

const AppBar = ({ 
  className, 
  showSearch = true, 
  onMenuClick,
  showMenuButton = false 
}: AppBarProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const { isAuthenticated, user, isLoading } = useAuth()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <header className={cn(
      "bg-white border-b border-surface-200 sticky top-0 z-50 shadow-sm",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left section */}
          <div className="flex items-center gap-4">
            {/* Menu button for mobile */}
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="p-2 rounded-lg text-accent-600 hover:text-accent-900 hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 lg:hidden"
                aria-label="Open navigation menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">UiQ</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-xl font-bold text-accent-900">UiQ</div>
                <div className="text-caption-sm text-accent-600 -mt-1">Ugandans in Queensland</div>
              </div>
            </Link>
          </div>

          {/* Center - Global Search */}
          {showSearch && (
            <div className="flex-1 max-w-2xl mx-8 hidden md:block">
              <form onSubmit={handleSearch} className="relative">
                <div className={cn(
                  "relative transition-all duration-200",
                  searchFocused && "transform scale-105"
                )}>
                  <label htmlFor="appbar-search" className="sr-only">
                    Search the UiQ community
                  </label>
                  <input
                    id="appbar-search"
                    type="search"
                    placeholder="Search businesses, events, services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className={cn(
                      "w-full pl-12 pr-4 py-3 border border-surface-300 rounded-xl",
                      "bg-surface-50 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-200",
                      "text-body-md placeholder-accent-500 transition-all duration-200",
                      "focus:outline-none"
                    )}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-accent-500 hover:text-accent-700 rounded-full hover:bg-surface-100"
                      aria-label="Clear search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Right section - Auth and Profile */}
          <div className="flex items-center gap-4">
            
            {/* Mobile search button */}
            <button className="p-2 rounded-lg text-accent-600 hover:text-accent-900 hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 md:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Notifications */}
            {isAuthenticated && (
              <button className="relative p-2 rounded-lg text-accent-600 hover:text-accent-900 hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5zM5.868 14.196C5.322 13.544 5 12.806 5 12c0-3.866 3.582-7 8-7s8 3.134 8 7c0 .806-.322 1.544-.868 2.196" />
                </svg>
                {/* Notification dot */}
                <div className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></div>
              </button>
            )}

            {/* User menu or Auth buttons */}
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-pulse w-8 h-8 bg-surface-200 rounded-full"></div>
                <div className="animate-pulse w-16 h-4 bg-surface-200 rounded hidden sm:block"></div>
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <div className="text-body-sm font-medium text-accent-900">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-caption-sm text-accent-600">
                    Member
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-semibold text-sm hover:shadow-md transition-shadow">
                  {user?.firstName?.[0] || 'U'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/api/login" 
                  className="text-body-sm font-medium text-accent-700 hover:text-primary-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/api/login" 
                  className="px-4 py-2 bg-primary-600 text-white text-body-sm font-medium rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export { AppBar }