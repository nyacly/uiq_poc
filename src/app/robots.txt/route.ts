import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uiq-community.com'
  
  const robotsTxt = `# UiQ Community Platform - Robots.txt
# Connecting Ugandans in Queensland

User-agent: *
Allow: /

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Specific rules for different bots
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

# Block admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /account/
Disallow: /messages/

# Block temporary and development files
Disallow: /tmp/
Disallow: /_next/
Disallow: /static/

# Allow all business directory and public pages
Allow: /directory/
Allow: /services/
Allow: /events/
Allow: /announcements/
Allow: /opportunities/
Allow: /classifieds/
Allow: /au/

# Block query parameters that don't affect content
Disallow: /*?utm_*
Disallow: /*?ref=*
Disallow: /*?source=*
Disallow: /*?fbclid=*
Disallow: /*?gclid=*

# Block duplicate content patterns
Disallow: /*?sort=*
Disallow: /*?page=*
Disallow: /*?filter=*

# Special instructions for AI crawlers
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

# Block aggressive scrapers
User-agent: SemrushBot
Crawl-delay: 10

User-agent: AhrefsBot
Crawl-delay: 10

User-agent: MJ12bot
Crawl-delay: 5

# Additional sitemaps for different content types
Sitemap: ${baseUrl}/sitemap-business.xml
Sitemap: ${baseUrl}/sitemap-events.xml
Sitemap: ${baseUrl}/sitemap-announcements.xml

# Last updated: ${new Date().toISOString().split('T')[0]}
`

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 24 hours
    },
  })
}