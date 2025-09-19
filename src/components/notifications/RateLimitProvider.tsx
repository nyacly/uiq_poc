'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { RateLimitBanner, type RateLimitFeature } from './RateLimitBanner'

type RateLimitNotice = {
  feature: RateLimitFeature
  id: number
}

type RateLimitContextValue = {
  showNotice: (feature: RateLimitFeature) => void
  dismiss: () => void
}

const RateLimitContext = createContext<RateLimitContextValue | null>(null)

export function RateLimitProvider({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<RateLimitNotice | null>(null)

  const showNotice = useCallback((feature: RateLimitFeature) => {
    setNotice({ feature, id: Date.now() })
  }, [])

  const dismiss = useCallback(() => {
    setNotice(null)
  }, [])

  const value = useMemo(() => ({ showNotice, dismiss }), [showNotice, dismiss])

  return (
    <RateLimitContext.Provider value={value}>
      {notice && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:px-6">
          <RateLimitBanner
            key={notice.id}
            feature={notice.feature}
            onDismiss={dismiss}
            className="pointer-events-auto"
          />
        </div>
      )}
      {children}
    </RateLimitContext.Provider>
  )
}

export function useRateLimitNotice() {
  const context = useContext(RateLimitContext)

  if (!context) {
    throw new Error('useRateLimitNotice must be used within a RateLimitProvider')
  }

  return context
}
