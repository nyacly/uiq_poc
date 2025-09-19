import type { Metadata } from 'next'
import { PricingContent } from './PricingContent'
import { buildPageMetadata } from '@/lib/metadata'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Pricing',
    description: 'Choose a UiQ membership plan to support the community and unlock premium business exposure across Queensland.',
    path: '/pricing',
    keywords: ['membership pricing', 'UiQ plans', 'community support', 'business exposure'],
    category: 'Pricing'
  })
}

export default function PricingPage() {
  return <PricingContent />
}
