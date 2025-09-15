import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    template: '%s | UiQ Community',
    default: 'UiQ - Ugandans in Queensland Community Platform'
  },
  description: 'Connecting Ugandans in Queensland through local businesses, cultural events, services, and community opportunities.',
  keywords: ['community', 'local business', 'events', 'services', 'directory'],
  authors: [{ name: 'Community Platform Team' }],
  creator: 'Community Platform',
  publisher: 'Community Platform',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'UiQ - Ugandans in Queensland Community Platform',
    description: 'Connecting Ugandans in Queensland through local businesses, cultural events, services, and community opportunities.',
    siteName: 'UiQ Community',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UiQ - Ugandans in Queensland Community Platform',
    description: 'Connecting Ugandans in Queensland through local businesses, cultural events, services, and community opportunities.',
  },
  verification: {
    google: 'verification-token-here',
  },
}

import { Providers } from './providers'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased bg-neutral-50 text-neutral-900`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}