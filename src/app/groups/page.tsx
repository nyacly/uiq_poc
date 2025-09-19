import type { Metadata } from 'next'
import { MainLayout } from '@/components/layout/MainLayout'
import { buildPageMetadata } from '@/lib/metadata'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Groups',
    description: 'Join WhatsApp groups and interest circles connecting Ugandans throughout Queensland.',
    path: '/groups',
    keywords: ['community groups', 'WhatsApp groups', 'Ugandan community', 'Queensland'],
    category: 'Community'
  })
}

export default function GroupsPage() {
  return (
    <MainLayout className="p-8">
      <h1 className="text-3xl font-bold">Groups</h1>
      <p className="mt-4">Connect with fellow members through interest groups.</p>
    </MainLayout>
  )
}

