import { NextResponse } from 'next/server'
import { getAllCityCategoryCombinations, getAllCityPages, getAllCategoryPages, QUEENSLAND_CITIES, BUSINESS_CATEGORIES } from '@/lib/seo-data'
import { SITE_MAP } from '@/lib/sitemap'

interface SitemapEntry {
  url: string
  lastModified?: string
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uiq-community.com'
  const currentDate = new Date().toISOString().split('T')[0]
  
  const sitemapEntries: SitemapEntry[] = []
  
  // Core pages from sitemap
  const corePages = SITE_MAP.filter(page => page.accessLevel === 'public')
  for (const page of corePages) {
    sitemapEntries.push({
      url: `${baseUrl}${page.path}`,
      lastModified: currentDate,
      changeFrequency: page.path === '/' ? 'daily' : 'weekly',
      priority: page.path === '/' ? 1.0 : 0.8
    })
  }
  
  // City pages
  const cityPages = getAllCityPages()
  for (const cityPage of cityPages) {
    const cityData = QUEENSLAND_CITIES.find(c => c.slug === cityPage.city)
    sitemapEntries.push({
      url: `${baseUrl}${cityPage.path}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: cityData && cityData.population > 100000 ? 0.8 : 0.6
    })
  }
  
  // Category pages
  const categoryPages = getAllCategoryPages()
  for (const categoryPage of categoryPages) {
    sitemapEntries.push({
      url: `${baseUrl}${categoryPage.path}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7
    })
  }
  
  // City + Category combination pages
  const combinations = getAllCityCategoryCombinations()
  for (const combo of combinations) {
    const cityData = QUEENSLAND_CITIES.find(c => c.slug === combo.city)
    const categoryData = BUSINESS_CATEGORIES.find(c => c.slug === combo.category)
    
    // Prioritize major cities and popular categories
    let priority = 0.5
    if (cityData && cityData.population > 100000) priority += 0.1
    if (categoryData && ['plumbers', 'electricians', 'doctors', 'restaurants', 'lawyers'].includes(categoryData.slug)) {
      priority += 0.1
    }
    
    sitemapEntries.push({
      url: `${baseUrl}${combo.path}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: Math.min(priority, 1.0)
    })
  }
  
  // Sort by priority (highest first) then alphabetically
  sitemapEntries.sort((a, b) => {
    if (a.priority !== b.priority) {
      return (b.priority || 0) - (a.priority || 0)
    }
    return a.url.localeCompare(b.url)
  })
  
  // Generate XML sitemap
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority?.toFixed(1)}</priority>
  </url>`).join('\n')}
</urlset>`
  
  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 24 hours
    },
  })
}