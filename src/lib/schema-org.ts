/**
 * Schema.org structured data utilities for UiQ Community Platform
 * Supports LocalBusiness, Event, Obituary, Product, Offer, and more
 */

export interface BaseSchemaOrg {
  '@context': 'https://schema.org'
  '@type': string
  '@id'?: string
}

export interface Address {
  '@type': 'PostalAddress'
  streetAddress?: string
  addressLocality: string
  addressRegion: string
  postalCode?: string
  addressCountry: string
}

export interface GeoCoordinates {
  '@type': 'GeoCoordinates'
  latitude: number
  longitude: number
}

export interface OpeningHours {
  '@type': 'OpeningHoursSpecification'
  dayOfWeek: string[]
  opens: string
  closes: string
}

export interface ContactPoint {
  '@type': 'ContactPoint'
  telephone?: string
  email?: string
  contactType: string
  availableLanguage?: string[]
}

// LocalBusiness Schema
export interface LocalBusinessSchema extends BaseSchemaOrg {
  '@type': 'LocalBusiness'
  name: string
  description: string
  url: string
  telephone?: string
  email?: string
  address: Address
  geo?: GeoCoordinates
  openingHoursSpecification?: OpeningHours[]
  priceRange?: string
  image?: string[]
  logo?: string
  aggregateRating?: {
    '@type': 'AggregateRating'
    ratingValue: number
    reviewCount: number
    bestRating: number
    worstRating: number
  }
  review?: ReviewSchema[]
  contactPoint?: ContactPoint[]
  sameAs?: string[]
  paymentAccepted?: string[]
  currenciesAccepted?: string[]
  hasOfferCatalog?: {
    '@type': 'OfferCatalog'
    name: string
    itemListElement: OfferSchema[]
  }
}

// Event Schema
export interface EventSchema extends BaseSchemaOrg {
  '@type': 'Event'
  name: string
  description: string
  startDate: string
  endDate?: string
  location: {
    '@type': 'Place'
    name: string
    address: Address
    geo?: GeoCoordinates
  }
  organizer: {
    '@type': 'Organization' | 'Person'
    name: string
    url?: string
  }
  image?: string[]
  url?: string
  eventStatus: 'EventScheduled' | 'EventCancelled' | 'EventPostponed' | 'EventRescheduled'
  eventAttendanceMode: 'OnlineEventAttendanceMode' | 'OfflineEventAttendanceMode' | 'MixedEventAttendanceMode'
  offers?: OfferSchema[]
  performer?: {
    '@type': 'Person' | 'Organization'
    name: string
  }[]
  audience?: {
    '@type': 'Audience'
    audienceType: string
  }
  maximumAttendeeCapacity?: number
  remainingAttendeeCapacity?: number
}

// Obituary/Memorial Schema
export interface ObituarySchema extends BaseSchemaOrg {
  '@type': 'Person'
  name: string
  description: string
  birthDate?: string
  deathDate?: string
  birthPlace?: Address
  deathPlace?: Address
  nationality?: string
  spouse?: string
  children?: string[]
  parent?: string[]
  sibling?: string[]
  image?: string
  memorialWebsite?: string
  obituary?: {
    '@type': 'Article'
    headline: string
    articleBody: string
    datePublished: string
    author: {
      '@type': 'Organization'
      name: string
    }
  }
  funeralEvent?: EventSchema
}

// Product Schema
export interface ProductSchema extends BaseSchemaOrg {
  '@type': 'Product'
  name: string
  description: string
  image?: string[]
  brand?: {
    '@type': 'Brand'
    name: string
  }
  category?: string
  condition?: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition' | 'DamagedCondition'
  offers: OfferSchema[]
  aggregateRating?: {
    '@type': 'AggregateRating'
    ratingValue: number
    reviewCount: number
    bestRating: number
    worstRating: number
  }
  review?: ReviewSchema[]
  sku?: string
  gtin?: string
  mpn?: string
  manufacturer?: {
    '@type': 'Organization'
    name: string
  }
}

// Offer Schema
export interface OfferSchema extends BaseSchemaOrg {
  '@type': 'Offer'
  name?: string
  description?: string
  price: string
  priceCurrency: string
  availability: 'InStock' | 'OutOfStock' | 'PreOrder' | 'Discontinued'
  validFrom?: string
  validThrough?: string
  seller: {
    '@type': 'Organization' | 'Person'
    name: string
  }
  url?: string
  priceValidUntil?: string
  itemCondition?: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition'
  category?: string
}

// Review Schema
export interface ReviewSchema extends BaseSchemaOrg {
  '@type': 'Review'
  reviewRating: {
    '@type': 'Rating'
    ratingValue: number
    bestRating: number
    worstRating: number
  }
  author: {
    '@type': 'Person'
    name: string
  }
  datePublished: string
  reviewBody: string
  itemReviewed: {
    '@type': string
    name: string
  }
}

// Job Posting Schema
export interface JobPostingSchema extends BaseSchemaOrg {
  '@type': 'JobPosting'
  title: string
  description: string
  datePosted: string
  validThrough?: string
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'TEMPORARY' | 'INTERN' | 'VOLUNTEER' | 'PER_DIEM' | 'OTHER'
  hiringOrganization: {
    '@type': 'Organization'
    name: string
    sameAs?: string
    logo?: string
  }
  jobLocation: {
    '@type': 'Place'
    address: Address
  }
  baseSalary?: {
    '@type': 'MonetaryAmount'
    currency: string
    value: {
      '@type': 'QuantitativeValue'
      value: number
      unitText: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
    }
  }
  qualifications?: string
  responsibilities?: string
  skills?: string
  workHours?: string
  benefits?: string
  jobBenefits?: string
  educationRequirements?: string
  experienceRequirements?: string
  applicationContact?: ContactPoint
}

// Real Estate Posting Schema
export interface RealEstateSchema extends BaseSchemaOrg {
  '@type': 'RealEstateListing'
  name: string
  description: string
  url?: string
  image?: string[]
  address: Address
  geo?: GeoCoordinates
  floorSize?: {
    '@type': 'QuantitativeValue'
    value: number
    unitCode: 'MTK' // square meters
  }
  numberOfRooms?: number
  numberOfBedrooms?: number
  numberOfBathroomsTotal?: number
  petsAllowed?: boolean
  smokingAllowed?: boolean
  availableFrom?: string
  leaseLength?: {
    '@type': 'Duration'
    value: string
  }
  offers: OfferSchema[]
}

// Organization Schema
export interface OrganizationSchema extends BaseSchemaOrg {
  '@type': 'Organization'
  name: string
  description: string
  url: string
  logo?: string
  image?: string[]
  address?: Address
  contactPoint?: ContactPoint[]
  sameAs?: string[]
  foundingDate?: string
  founder?: {
    '@type': 'Person'
    name: string
  }[]
  areaServed?: {
    '@type': 'Place'
    name: string
  }
  memberOf?: {
    '@type': 'Organization'
    name: string
  }[]
}

// Breadcrumb Schema
export interface BreadcrumbSchema extends BaseSchemaOrg {
  '@type': 'BreadcrumbList'
  itemListElement: {
    '@type': 'ListItem'
    position: number
    name: string
    item: string
  }[]
}

// WebSite Schema
export interface WebSiteSchema extends BaseSchemaOrg {
  '@type': 'WebSite'
  name: string
  description: string
  url: string
  potentialAction?: {
    '@type': 'SearchAction'
    target: {
      '@type': 'EntryPoint'
      urlTemplate: string
    }
    'query-input': string
  }
  publisher?: OrganizationSchema
  copyrightYear?: number
  inLanguage?: string
}

// Schema.org utility functions
export class SchemaOrgUtils {
  static createLocalBusiness(data: Partial<LocalBusinessSchema>): LocalBusinessSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: '',
      description: '',
      url: '',
      address: {
        '@type': 'PostalAddress',
        addressLocality: '',
        addressRegion: 'Queensland',
        addressCountry: 'AU'
      },
      ...data
    }
  }

  static createEvent(data: Partial<EventSchema>): EventSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: '',
      description: '',
      startDate: '',
      location: {
        '@type': 'Place',
        name: '',
        address: {
          '@type': 'PostalAddress',
          addressLocality: '',
          addressRegion: 'Queensland',
          addressCountry: 'AU'
        }
      },
      organizer: {
        '@type': 'Organization',
        name: 'UiQ Community'
      },
      eventStatus: 'EventScheduled',
      eventAttendanceMode: 'OfflineEventAttendanceMode',
      ...data
    }
  }

  static createObituary(data: Partial<ObituarySchema>): ObituarySchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: '',
      description: '',
      ...data
    }
  }

  static createProduct(data: Partial<ProductSchema>): ProductSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: '',
      description: '',
      offers: [],
      ...data
    }
  }

  static createJobPosting(data: Partial<JobPostingSchema>): JobPostingSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: '',
      description: '',
      datePosted: '',
      employmentType: 'FULL_TIME',
      hiringOrganization: {
        '@type': 'Organization',
        name: ''
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: '',
          addressRegion: 'Queensland',
          addressCountry: 'AU'
        }
      },
      ...data
    }
  }

  static createBreadcrumb(items: { name: string; url: string }[]): BreadcrumbSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    }
  }

  static createWebSite(data: Partial<WebSiteSchema>): WebSiteSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'UiQ Community',
      description: 'Ugandans in Queensland Community Platform',
      url: 'https://uiq-community.com',
      ...data
    }
  }

  // Validation helper
  static validateSchema(schema: BaseSchemaOrg): boolean {
    const required = ['@context', '@type']
    return required.every(field => field in schema)
  }

  // Test ID generator for structured data
  static generateTestId(type: string, id?: string): string {
    const timestamp = Date.now()
    return id ? `${type}-${id}-${timestamp}` : `${type}-${timestamp}`
  }
}