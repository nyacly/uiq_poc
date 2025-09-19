import type { Metadata } from 'next'
import { MainLayout } from '@/components/layout/MainLayout'
import { buildPageMetadata } from '@/lib/metadata'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Services',
    description: 'Find trusted service providers and support organisations across the Ugandan community in Queensland.',
    path: '/services',
    keywords: ['community services', 'support services', 'Ugandan organisations', 'Queensland'],
    category: 'Services'
  })
}

export default function ServicesPage() {
  return (
    <MainLayout className="p-8">
      <h1 className="text-3xl font-bold">Services</h1>
      <p className="mt-4">Discover service providers within the community.</p>
    </MainLayout>
  )
}

