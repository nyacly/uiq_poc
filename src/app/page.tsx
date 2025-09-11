// UiQ Community Platform - Home Page
// Complete home page with hero, search, categories, featured content

import { Metadata } from 'next'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/MainLayout'
import { HeroSection } from '@/components/home/HeroSection'
import { CategoryTiles } from '@/components/home/CategoryTiles'
import { FeaturedBusinesses } from '@/components/home/FeaturedBusinesses'
import { UpcomingEvents } from '@/components/home/UpcomingEvents'
import { LatestAnnouncements } from '@/components/home/LatestAnnouncements'
import { ProgramsOpportunities } from '@/components/home/ProgramsOpportunities'
import { WhatsAppCTA } from '@/components/home/WhatsAppCTA'
import { MembershipPerks } from '@/components/home/MembershipPerks'
import { NewsletterSignup } from '@/components/home/NewsletterSignup'

// SEO and Schema.org metadata
export const metadata: Metadata = {
  title: 'UiQ - Ugandans in Queensland Community Platform',
  description: 'Connect with fellow Ugandans in Queensland. Discover local businesses, cultural events, opportunities, and community support. Your home away from home.',
  keywords: ['Ugandan community', 'Queensland', 'African businesses', 'cultural events', 'community support', 'Brisbane', 'Gold Coast'],
  openGraph: {
    title: 'UiQ - Ugandans in Queensland Community Platform',
    description: 'Connect with fellow Ugandans in Queensland. Discover local businesses, cultural events, opportunities, and community support.',
    type: 'website',
    locale: 'en_AU',
    siteName: 'UiQ Community',
  },
  alternates: {
    canonical: '/',
  },
}

// Structured data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "UiQ - Ugandans in Queensland",
  "description": "Community platform connecting Ugandans living in Queensland, Australia",
  "url": "https://uiq-community.com",
  "logo": "https://uiq-community.com/logo.png",
  "sameAs": [
    "https://facebook.com/uiq-community",
    "https://instagram.com/uiq_community"
  ],
  "address": {
    "@type": "PostalAddress",
    "addressRegion": "Queensland",
    "addressCountry": "AU"
  },
  "areaServed": {
    "@type": "State",
    "name": "Queensland"
  }
}

const breadcrumbData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://uiq-community.com"
    }
  ]
}

export default function HomePage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      <MainLayout>
        {/* Hero Section with Global Search */}
        <HeroSection />

        {/* Quick Category Navigation */}
        <CategoryTiles />

        {/* Featured Businesses Carousel */}
        <FeaturedBusinesses />

        {/* Upcoming Events */}
        <UpcomingEvents />

        {/* Latest Announcements (Bereavements Pinned) */}
        <LatestAnnouncements />

        {/* Programs & Opportunities Highlights */}
        <ProgramsOpportunities />

        {/* WhatsApp Community CTA */}
        <WhatsAppCTA />

        {/* Membership Perks Strip */}
        <MembershipPerks />

        {/* Newsletter Signup */}
        <NewsletterSignup />
      </MainLayout>
    </>
  )
}