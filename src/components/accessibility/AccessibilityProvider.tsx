'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { initializeA11y, LiveRegion, screenReader } from '@/lib/accessibility'

interface AccessibilityContextType {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void
  announcePageChange: (pageName: string) => void
  announceValidation: (fieldName: string, error?: string) => void
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

interface AccessibilityProviderProps {
  children: ReactNode
}

export const AccessibilityProvider = ({ children }: AccessibilityProviderProps) => {
  useEffect(() => {
    // Initialize accessibility features
    initializeA11y()
  }, [])

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    LiveRegion.getInstance().announce(message, priority)
  }

  const announcePageChange = (pageName: string) => {
    screenReader.announcePageChange(pageName)
  }

  const announceValidation = (fieldName: string, error?: string) => {
    screenReader.announceValidation(fieldName, error)
  }

  const value = {
    announceToScreenReader,
    announcePageChange,
    announceValidation
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      {/* Screen reader only content */}
      <div className="sr-only">
        <h1>UiQ Community Platform - Accessible Version</h1>
        <p>This platform has been designed with accessibility in mind, following WCAG 2.2 AA standards.</p>
      </div>
    </AccessibilityContext.Provider>
  )
}