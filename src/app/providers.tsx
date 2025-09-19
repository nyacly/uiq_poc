// Providers for Community Platform
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { ReactNode, Suspense, useState } from 'react'

import { RateLimitProvider } from '@/components/notifications/RateLimitProvider'
import { PageViewTracker } from '@/components/analytics/PageViewTracker'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: (failureCount, error: Error & { status?: number }) => {
              // Don't retry on 401 errors
              if (error?.status === 401) return false
              return failureCount < 3
            },
          },
        },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <RateLimitProvider>
          <Suspense fallback={null}>
            <PageViewTracker />
          </Suspense>
          {children}
        </RateLimitProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}