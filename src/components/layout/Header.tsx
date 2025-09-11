'use client'
import Link from 'next/link'
import { MAIN_NAVIGATION } from '@/lib/sitemap'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export function Header() {
  const { isAuthenticated, user, isLoading } = useAuth()
  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="text-2xl font-bold text-primary-600">
                UiQ
              </div>
              <div className="ml-2 text-sm font-medium text-accent-600 hidden sm:block">
                Ugandans in Queensland
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8" role="navigation" aria-label="Main navigation">
            {MAIN_NAVIGATION.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="text-neutral-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-lg hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label={`Go to ${item.label}`}
              >
                <span className="sr-only">{item.icon}</span>
                <span aria-hidden="true" className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-pulse h-8 w-16 bg-neutral-200 rounded"></div>
                <div className="animate-pulse h-8 w-20 bg-neutral-200 rounded"></div>
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-neutral-700 font-medium">
                  Welcome, {user?.firstName || 'User'}
                </span>
                <Link href="/api/logout" className="text-neutral-600 hover:text-primary-600 font-medium">
                  Sign Out
                </Link>
              </div>
            ) : (
              <>
                <Link href="/api/login" className="text-neutral-600 hover:text-primary-600 font-medium">
                  Sign In
                </Link>
                <Link href="/api/login" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-neutral-600 hover:text-primary-600 p-2 rounded-lg hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-expanded="false"
              aria-controls="mobile-menu"
              aria-label="Open main menu"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-neutral-200">
            {MAIN_NAVIGATION.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="text-neutral-600 hover:text-primary-600 block px-3 py-2 text-base font-medium rounded-lg hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label={`Go to ${item.label}`}
              >
                <span aria-hidden="true" className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-neutral-200 space-y-2">
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-10 bg-neutral-200 rounded"></div>
                  <div className="h-10 bg-neutral-200 rounded"></div>
                </div>
              ) : isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-base font-medium text-neutral-700">
                    Welcome, {user?.firstName || 'User'}
                  </div>
                  <Link 
                    href="/api/logout" 
                    className="block px-3 py-2 text-base font-medium text-neutral-600 hover:text-primary-600 rounded-lg hover:bg-primary-50"
                  >
                    Sign Out
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/api/login" 
                    className="block px-3 py-2 text-base font-medium text-neutral-600 hover:text-primary-600 rounded-lg hover:bg-primary-50"
                  >
                    Sign In
                  </Link>
                  <Link href="/api/login" className="btn-primary w-full">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}