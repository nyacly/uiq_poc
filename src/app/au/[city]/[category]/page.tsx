import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { FilterBar } from '@/components/ui/FilterBar'
import { MapModule } from '@/components/ui/MapModule'
import { generateCityCategoryMeta, getAllCityCategoryCombinations, QUEENSLAND_CITIES, BUSINESS_CATEGORIES } from '@/lib/seo-data'
import { SchemaOrgUtils, LocalBusinessSchema, BreadcrumbSchema } from '@/lib/schema-org'

interface Props {
  params: Promise<{
    city: string
    category: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const seoData = generateCityCategoryMeta(resolvedParams.city, resolvedParams.category)
  
  if (!seoData) {
    return {
      title: 'Page Not Found | UiQ Community',
      robots: { index: false, follow: false }
    }
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uiq-community.com'
  const canonicalUrl = `${baseUrl}${seoData.canonicalUrl}`
  
  return {
    title: seoData.title,
    description: seoData.description,
    keywords: seoData.keywords,
    openGraph: {
      title: seoData.title,
      description: seoData.description,
      type: 'website',
      locale: 'en_AU',
      url: canonicalUrl,
      siteName: 'UiQ Community',
      images: [
        {
          url: `${baseUrl}/images/og-city-category.jpg`,
          width: 1200,
          height: 630,
          alt: seoData.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData.title,
      description: seoData.description,
      images: [`${baseUrl}/images/og-city-category.jpg`]
    },
    alternates: {
      canonical: canonicalUrl
    },
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
    }
  }
}

// Generate static paths for all city/category combinations
export async function generateStaticParams() {
  // In production, generate all combinations
  if (process.env.NODE_ENV === 'production') {
    return getAllCityCategoryCombinations().map(({ city, category }) => ({
      city,
      category
    }))
  }
  
  // In development, generate a subset for faster builds
  const majorCities = ['brisbane', 'gold-coast', 'sunshine-coast', 'cairns']
  const popularCategories = ['plumbers', 'electricians', 'restaurants', 'doctors', 'lawyers']
  
  const params = []
  for (const city of majorCities) {
    for (const category of popularCategories) {
      params.push({ city, category })
    }
  }
  
  return params
}

export default function CityCategoryPage({ params, searchParams }: Props) {
  const seoData = generateCityCategoryMeta(params.city, params.category)
  
  if (!seoData) {
    notFound()
  }
  
  const { city, category, breadcrumbs } = seoData
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uiq-community.com'
  
  // Generate structured data
  const breadcrumbSchema: BreadcrumbSchema = SchemaOrgUtils.createBreadcrumb(
    breadcrumbs.map(crumb => ({
      name: crumb.name,
      url: `${baseUrl}${crumb.url}`
    }))
  )
  
  // Create a sample local business schema for the category
  const sampleBusinessSchema: LocalBusinessSchema = SchemaOrgUtils.createLocalBusiness({
    '@id': `${baseUrl}${seoData.canonicalUrl}#business-directory`,
    name: `${category.name} in ${city.name}`,
    description: `Professional ${category.description} serving ${city.name} and surrounding areas in Queensland.`,
    url: `${baseUrl}${seoData.canonicalUrl}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.name,
      addressRegion: 'Queensland',
      addressCountry: 'AU'
    },
    areaServed: {
      '@type': 'City',
      name: city.name,
      containedInPlace: {
        '@type': 'State',
        name: 'Queensland'
      }
    }
  })
  
  const structuredData = [breadcrumbSchema, sampleBusinessSchema]
  
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        data-testid={`city-category-structured-data-${params.city}-${params.category}`}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      <MainLayout>
        {/* Breadcrumb Navigation */}
        <nav 
          className="bg-white border-b border-gray-200"
          aria-label="Breadcrumb"
          data-testid={`breadcrumb-${params.city}-${params.category}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ol className="flex items-center space-x-2 py-4 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.url} className="flex items-center">
                  {index > 0 && (
                    <svg className="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-gray-500 font-medium" aria-current="page">
                      {crumb.name}
                    </span>
                  ) : (
                    <a
                      href={crumb.url}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {crumb.name}
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </nav>
        
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 
                className="text-4xl font-bold mb-4"
                data-testid={`hero-title-${params.city}-${params.category}`}
              >
                {category.name} in {city.name}, Queensland
              </h1>
              <p className="text-xl text-red-100 mb-8 max-w-3xl mx-auto">
                Discover trusted {category.name.toLowerCase()} in {city.name}. 
                Connect with local {category.description.toLowerCase()} through our community platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-4">
                  <div className="text-2xl font-bold">{city.population.toLocaleString()}</div>
                  <div className="text-red-100">Population</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-4">
                  <div className="text-2xl font-bold">{city.region}</div>
                  <div className="text-red-100">Region</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Search and Filter Section */}
        <section className="bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FilterBar 
              defaultLocation={{
                city: city.name,
                state: 'Queensland',
                country: 'Australia'
              }}
              defaultCategory={category.slug}
              data-testid={`filter-bar-${params.city}-${params.category}`}
            />
          </div>
        </section>
        
        {/* Main Content */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Results List */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {category.name} in {city.name}
                  </h2>
                  <p className="text-gray-600">Showing businesses in your area</p>
                </div>
                
                {/* Business listings would go here */}
                <div 
                  className="space-y-6"
                  data-testid={`business-listings-${params.city}-${params.category}`}
                >
                  {/* Placeholder for business listings */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Growing Our {city.name} Directory
                      </h3>
                      <p className="text-gray-600 mb-6">
                        We're building our directory of {category.name.toLowerCase()} in {city.name}. 
                        Know a great business? Help us grow the community!
                      </p>
                      <div className="space-y-3">
                        <a
                          href="/directory/submit"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          Add Your Business
                        </a>
                        <div className="text-sm text-gray-500">
                          or <a href="/contact" className="text-red-600 hover:text-red-700">suggest a business</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Map */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {city.name} Area Map
                  </h3>
                  <MapModule 
                    defaultCenter={{
                      lat: -27.4698, // Brisbane coordinates as default
                      lng: 153.0251
                    }}
                    data-testid={`map-${params.city}-${params.category}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Local Information */}
        <section className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  About {category.name} in {city.name}
                </h2>
                <div className="prose prose-gray">
                  <p>
                    {city.name} is home to a vibrant community of {category.name.toLowerCase()} 
                    serving the {city.region} region. Whether you're looking for {category.description.toLowerCase()}, 
                    our community platform helps you connect with trusted local professionals.
                  </p>
                  <p>
                    The UiQ Community Platform specifically serves the Ugandan community in Queensland, 
                    helping you find businesses and services that understand your cultural needs and preferences.
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Popular Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[...category.keywords, city.name, city.region].map((keyword, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </MainLayout>
    </>
  )
}