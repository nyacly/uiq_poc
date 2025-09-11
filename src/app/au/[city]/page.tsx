import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { FilterBar } from '@/components/ui/FilterBar'
import { MapModule } from '@/components/ui/MapModule'
import { QUEENSLAND_CITIES, BUSINESS_CATEGORIES } from '@/lib/seo-data'
import { SchemaOrgUtils, BreadcrumbSchema, LocalBusinessSchema } from '@/lib/schema-org'

interface Props {
  params: Promise<{
    city: string
  }>
}

// Generate metadata for city pages
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const cityData = QUEENSLAND_CITIES.find(c => c.slug === resolvedParams.city)
  
  if (!cityData) {
    return {
      title: 'City Not Found | UiQ Community',
      robots: { index: false, follow: false }
    }
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uiq-community.com'
  const canonicalUrl = `${baseUrl}/au/${params.city}`
  
  const title = `Businesses in ${cityData.name}, QLD | UiQ Community`
  const description = `Discover local businesses and services in ${cityData.name}, Queensland. Connect with the Ugandan community and find trusted service providers in ${cityData.region}.`
  
  return {
    title,
    description,
    keywords: [cityData.name, 'Queensland', 'QLD', cityData.region, 'Ugandan community', 'local business', 'directory'],
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_AU',
      url: canonicalUrl,
      siteName: 'UiQ Community',
      images: [
        {
          url: `${baseUrl}/images/og-city.jpg`,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/images/og-city.jpg`]
    },
    alternates: {
      canonical: canonicalUrl
    }
  }
}

// Generate static paths for all cities
export async function generateStaticParams() {
  if (process.env.NODE_ENV === 'production') {
    return QUEENSLAND_CITIES.map(city => ({ city: city.slug }))
  }
  
  // In development, generate subset
  const majorCities = ['brisbane', 'gold-coast', 'sunshine-coast', 'cairns', 'townsville']
  return majorCities.map(city => ({ city }))
}

export default function CityPage({ params }: Props) {
  const cityData = QUEENSLAND_CITIES.find(c => c.slug === params.city)
  
  if (!cityData) {
    notFound()
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uiq-community.com'
  
  // Generate structured data
  const breadcrumbSchema: BreadcrumbSchema = SchemaOrgUtils.createBreadcrumb([
    { name: 'Home', url: baseUrl },
    { name: 'Directory', url: `${baseUrl}/directory` },
    { name: cityData.name, url: `${baseUrl}/au/${params.city}` }
  ])
  
  const cityBusinessSchema: LocalBusinessSchema = SchemaOrgUtils.createLocalBusiness({
    '@id': `${baseUrl}/au/${params.city}#city-directory`,
    name: `Business Directory - ${cityData.name}`,
    description: `Local business directory for ${cityData.name}, Queensland serving the Ugandan community`,
    url: `${baseUrl}/au/${params.city}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: cityData.name,
      addressRegion: 'Queensland',
      addressCountry: 'AU'
    },
    areaServed: {
      '@type': 'City',
      name: cityData.name
    }
  })
  
  const structuredData = [breadcrumbSchema, cityBusinessSchema]
  
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        data-testid={`city-structured-data-${params.city}`}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      <MainLayout>
        {/* Breadcrumb */}
        <nav 
          className="bg-white border-b border-gray-200"
          data-testid={`breadcrumb-${params.city}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ol className="flex items-center space-x-2 py-4 text-sm">
              <li>
                <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">Home</Link>
              </li>
              <li className="flex items-center">
                <svg className="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <Link href="/directory" className="text-blue-600 hover:text-blue-800 font-medium">Directory</Link>
              </li>
              <li className="flex items-center">
                <svg className="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-500 font-medium">{cityData.name}</span>
              </li>
            </ol>
          </div>
        </nav>
        
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 
              className="text-4xl font-bold mb-4"
              data-testid={`hero-title-${params.city}`}
            >
              Local Businesses in {cityData.name}
            </h1>
            <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
              Discover trusted businesses and services in {cityData.name}, {cityData.region}. 
              Connect with your local Ugandan community.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-2xl font-bold">{cityData.population.toLocaleString()}</div>
                <div className="text-red-100">Population</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-2xl font-bold">{cityData.region}</div>
                <div className="text-red-100">Region</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-2xl font-bold">QLD</div>
                <div className="text-red-100">State</div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Filter Section */}
        <section className="bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FilterBar 
              defaultLocation={{
                city: cityData.name,
                state: 'Queensland',
                country: 'Australia'
              }}
              data-testid={`filter-bar-${params.city}`}
            />
          </div>
        </section>
        
        {/* Categories Grid */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Browse by Category
            </h2>
            <div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              data-testid={`categories-grid-${params.city}`}
            >
              {BUSINESS_CATEGORIES.slice(0, 12).map((category) => (
                <Link
                  key={category.slug}
                  href={`/au/${params.city}/${category.slug}`}
                  className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {category.description}
                  </p>
                  <div className="mt-4 flex items-center text-red-600 text-sm font-medium">
                    Browse {category.name.toLowerCase()}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
            
            {BUSINESS_CATEGORIES.length > 12 && (
              <div className="text-center mt-8">
                <Link
                  href={`/directory?city=${cityData.name}`}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  View All Categories
                </Link>
              </div>
            )}
          </div>
        </section>
        
        {/* Map Section */}
        <section className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Explore {cityData.name}
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <MapModule 
                defaultCenter={{
                  lat: -27.4698, // Default Brisbane coordinates
                  lng: 153.0251
                }}
                data-testid={`city-map-${params.city}`}
              />
            </div>
          </div>
        </section>
      </MainLayout>
    </>
  )
}