'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const ENDPOINT = '/api/analytics/page-view'

export function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const previousPath = useRef<string>('')

  useEffect(() => {
    if (!pathname) {
      return
    }

    const query = searchParams?.toString()
    const fullPath = query ? `${pathname}?${query}` : pathname

    if (previousPath.current === fullPath) {
      return
    }

    previousPath.current = fullPath

    const payload = JSON.stringify({ path: fullPath })

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon(ENDPOINT, blob)
      return
    }

    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('Failed to record page view', error)
      }
    })
  }, [pathname, searchParams])

  return null
}
