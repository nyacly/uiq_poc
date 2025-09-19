import type { Metadata } from 'next'
import { MainLayout } from '@/components/layout/MainLayout'
import { buildPageMetadata } from '@/lib/metadata'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Opportunities',
    description: 'Explore scholarships, jobs, grants, and volunteer opportunities curated for Ugandans in Queensland.',
    path: '/opportunities',
    keywords: ['jobs', 'scholarships', 'grants', 'volunteer opportunities', 'Ugandans in Queensland'],
    category: 'Opportunities'
  })
}

export default function OpportunitiesPage() {
  return (
    <MainLayout className="p-8">
      <h1 className="text-3xl font-bold">Opportunities</h1>
      <p className="mt-4">Explore scholarships, jobs and other opportunities.</p>
    </MainLayout>
  )
}

