import { Metadata } from 'next'

const SITE_NAME = 'UiQ Community'
const DEFAULT_BASE_URL = 'https://uiq-community.com'
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export const getSiteUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (envUrl && /^https?:\/\//i.test(envUrl)) {
    return envUrl.replace(/\/$/, '')
  }

  return DEFAULT_BASE_URL
}

interface OgImageOptions {
  title: string
  category?: string
  type?: string
}

export const buildOgImageUrl = ({ title, category, type }: OgImageOptions): string => {
  const url = new URL('/api/og', getSiteUrl())
  url.searchParams.set('title', title)

  if (category) {
    url.searchParams.set('category', category)
  }

  if (type) {
    url.searchParams.set('type', type)
  }

  return url.toString()
}

type OpenGraphType = NonNullable<NonNullable<Metadata['openGraph']>['type']>

interface BuildPageMetadataOptions {
  title: string
  description: string
  path: string
  keywords?: string[]
  ogTitle?: string
  ogDescription?: string
  ogType?: OpenGraphType
  category?: string
  imageText?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
}

export const buildPageMetadata = ({
  title,
  description,
  path,
  keywords,
  ogTitle,
  ogDescription,
  ogType = 'website',
  category,
  imageText,
  publishedTime,
  modifiedTime,
  section,
  tags
}: BuildPageMetadataOptions): Metadata => {
  const baseUrl = getSiteUrl()
  const canonicalUrl = new URL(path, `${baseUrl}/`).toString()
  const computedTitle = ogTitle ?? `${title} | ${SITE_NAME}`
  const computedDescription = ogDescription ?? description
  const ogImageTitle = imageText ?? ogTitle ?? title
  const ogImageUrl = buildOgImageUrl({ title: ogImageTitle, category, type: ogType })

  const openGraph: NonNullable<Metadata['openGraph']> = {
    title: computedTitle,
    description: computedDescription,
    url: canonicalUrl,
    siteName: SITE_NAME,
    type: ogType,
    locale: 'en_AU',
    images: [
      {
        url: ogImageUrl,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: computedTitle
      }
    ]
  }

  if (category) {
    openGraph.category = category
  }

  if (publishedTime) {
    openGraph.publishedTime = publishedTime
  }

  if (modifiedTime) {
    openGraph.modifiedTime = modifiedTime
  }

  if (section) {
    openGraph.section = section
  }

  if (tags && tags.length > 0) {
    openGraph.tags = tags
  }

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title: computedTitle,
      description: computedDescription,
      images: [ogImageUrl]
    }
  }
}
