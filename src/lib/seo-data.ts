/**
 * SEO data definitions for dynamic page generation
 * Supports Australian cities and business categories
 */

// Queensland cities and towns for landing page generation
export const QUEENSLAND_CITIES = [
  // Major Cities
  { slug: 'brisbane', name: 'Brisbane', population: 2560720, region: 'Greater Brisbane' },
  { slug: 'gold-coast', name: 'Gold Coast', population: 679127, region: 'Gold Coast' },
  { slug: 'sunshine-coast', name: 'Sunshine Coast', population: 346522, region: 'Sunshine Coast' },
  { slug: 'townsville', name: 'Townsville', population: 180820, region: 'North Queensland' },
  { slug: 'cairns', name: 'Cairns', population: 153075, region: 'Far North Queensland' },
  { slug: 'toowoomba', name: 'Toowoomba', population: 142163, region: 'Darling Downs' },
  { slug: 'mackay', name: 'Mackay', population: 80148, region: 'Central Queensland' },
  { slug: 'rockhampton', name: 'Rockhampton', population: 78592, region: 'Central Queensland' },
  
  // Regional Centers
  { slug: 'bundaberg', name: 'Bundaberg', population: 51830, region: 'Wide Bay' },
  { slug: 'hervey-bay', name: 'Hervey Bay', population: 55748, region: 'Wide Bay' },
  { slug: 'maryborough', name: 'Maryborough', population: 26024, region: 'Wide Bay' },
  { slug: 'gladstone', name: 'Gladstone', population: 33418, region: 'Central Queensland' },
  { slug: 'mount-isa', name: 'Mount Isa', population: 18342, region: 'North West Queensland' },
  { slug: 'warwick', name: 'Warwick', population: 15380, region: 'Darling Downs' },
  { slug: 'roma', name: 'Roma', population: 6848, region: 'Darling Downs' },
  { slug: 'emerald', name: 'Emerald', population: 14119, region: 'Central Queensland' },
  { slug: 'charleville', name: 'Charleville', population: 3335, region: 'South West Queensland' },
  { slug: 'longreach', name: 'Longreach', population: 2970, region: 'Central West Queensland' },
  
  // Coastal Towns
  { slug: 'port-douglas', name: 'Port Douglas', population: 3205, region: 'Far North Queensland' },
  { slug: 'airlie-beach', name: 'Airlie Beach', population: 1208, region: 'Whitsundays' },
  { slug: 'agnes-water', name: 'Agnes Water', population: 2629, region: 'Central Queensland' },
  { slug: 'noosa', name: 'Noosa', population: 5234, region: 'Sunshine Coast' },
  { slug: 'caloundra', name: 'Caloundra', population: 51966, region: 'Sunshine Coast' },
  { slug: 'maroochydore', name: 'Maroochydore', population: 18140, region: 'Sunshine Coast' },
  
  // Brisbane Metro
  { slug: 'ipswich', name: 'Ipswich', population: 202150, region: 'Greater Brisbane' },
  { slug: 'redcliffe', name: 'Redcliffe', population: 55883, region: 'Greater Brisbane' },
  { slug: 'caboolture', name: 'Caboolture', population: 26433, region: 'Greater Brisbane' },
  { slug: 'beenleigh', name: 'Beenleigh', population: 8298, region: 'Greater Brisbane' },
  { slug: 'logan', name: 'Logan', population: 326615, region: 'Greater Brisbane' }
]

// Business categories with SEO-friendly data
export const BUSINESS_CATEGORIES = [
  // Professional Services
  {
    slug: 'accountants',
    name: 'Accountants',
    description: 'Professional accounting and tax services',
    keywords: ['tax', 'bookkeeping', 'financial planning', 'business accounting']
  },
  {
    slug: 'lawyers',
    name: 'Lawyers',
    description: 'Legal services and representation',
    keywords: ['legal advice', 'solicitor', 'barrister', 'legal representation']
  },
  {
    slug: 'real-estate-agents',
    name: 'Real Estate Agents',
    description: 'Property sales, rentals and management',
    keywords: ['property', 'real estate', 'rental', 'property management']
  },
  {
    slug: 'financial-advisors',
    name: 'Financial Advisors',
    description: 'Investment and financial planning services',
    keywords: ['investment', 'superannuation', 'insurance', 'financial planning']
  },
  
  // Healthcare & Wellness
  {
    slug: 'doctors',
    name: 'Doctors',
    description: 'General practitioners and medical specialists',
    keywords: ['GP', 'medical', 'healthcare', 'clinic', 'specialist']
  },
  {
    slug: 'dentists',
    name: 'Dentists',
    description: 'Dental care and oral health services',
    keywords: ['dental', 'orthodontics', 'teeth cleaning', 'oral health']
  },
  {
    slug: 'physiotherapists',
    name: 'Physiotherapists',
    description: 'Physical therapy and rehabilitation services',
    keywords: ['physiotherapy', 'sports injury', 'rehabilitation', 'massage']
  },
  {
    slug: 'psychologists',
    name: 'Psychologists',
    description: 'Mental health and counselling services',
    keywords: ['counselling', 'therapy', 'mental health', 'psychology']
  },
  
  // Home & Construction
  {
    slug: 'plumbers',
    name: 'Plumbers',
    description: 'Plumbing services and repairs',
    keywords: ['plumbing', 'blocked drains', 'pipe repair', 'emergency plumber']
  },
  {
    slug: 'electricians',
    name: 'Electricians',
    description: 'Electrical services and installations',
    keywords: ['electrical', 'wiring', 'power points', 'electrical repair']
  },
  {
    slug: 'builders',
    name: 'Builders',
    description: 'Construction and building services',
    keywords: ['construction', 'renovation', 'building', 'contractor']
  },
  {
    slug: 'painters',
    name: 'Painters',
    description: 'Interior and exterior painting services',
    keywords: ['painting', 'house painter', 'commercial painting', 'decorating']
  },
  {
    slug: 'landscapers',
    name: 'Landscapers',
    description: 'Garden design and landscaping services',
    keywords: ['landscaping', 'garden design', 'lawn care', 'irrigation']
  },
  {
    slug: 'cleaners',
    name: 'Cleaners',
    description: 'Residential and commercial cleaning services',
    keywords: ['cleaning', 'house cleaning', 'office cleaning', 'carpet cleaning']
  },
  
  // Automotive
  {
    slug: 'mechanics',
    name: 'Mechanics',
    description: 'Auto repair and maintenance services',
    keywords: ['car repair', 'auto service', 'mechanic', 'vehicle maintenance']
  },
  {
    slug: 'panel-beaters',
    name: 'Panel Beaters',
    description: 'Auto body repair and painting',
    keywords: ['panel beating', 'car body repair', 'auto painting', 'dent repair']
  },
  
  // Food & Hospitality
  {
    slug: 'restaurants',
    name: 'Restaurants',
    description: 'Dining and food services',
    keywords: ['restaurant', 'dining', 'food', 'cuisine', 'takeaway']
  },
  {
    slug: 'cafes',
    name: 'Cafes',
    description: 'Coffee shops and casual dining',
    keywords: ['cafe', 'coffee', 'breakfast', 'lunch', 'barista']
  },
  {
    slug: 'catering',
    name: 'Catering',
    description: 'Event catering and food services',
    keywords: ['catering', 'event catering', 'corporate catering', 'party food']
  },
  
  // Personal Services
  {
    slug: 'hairdressers',
    name: 'Hairdressers',
    description: 'Hair styling and beauty services',
    keywords: ['hairdresser', 'hair salon', 'hair styling', 'beauty']
  },
  {
    slug: 'beauty-salons',
    name: 'Beauty Salons',
    description: 'Beauty treatments and skincare',
    keywords: ['beauty salon', 'facial', 'skincare', 'beauty treatments']
  },
  {
    slug: 'fitness-trainers',
    name: 'Fitness Trainers',
    description: 'Personal training and fitness services',
    keywords: ['personal trainer', 'fitness', 'gym', 'workout', 'exercise']
  },
  
  // Technology
  {
    slug: 'it-support',
    name: 'IT Support',
    description: 'Computer and technology support services',
    keywords: ['IT support', 'computer repair', 'tech support', 'network setup']
  },
  {
    slug: 'web-designers',
    name: 'Web Designers',
    description: 'Website design and development',
    keywords: ['web design', 'website development', 'digital marketing', 'SEO']
  },
  
  // Education & Training
  {
    slug: 'tutors',
    name: 'Tutors',
    description: 'Private tutoring and educational services',
    keywords: ['tutoring', 'education', 'private lessons', 'academic support']
  },
  {
    slug: 'driving-instructors',
    name: 'Driving Instructors',
    description: 'Driving lessons and instructor services',
    keywords: ['driving lessons', 'driving instructor', 'learner driver', 'driving school']
  },
  
  // Retail & Shopping
  {
    slug: 'grocery-stores',
    name: 'Grocery Stores',
    description: 'Food and grocery shopping',
    keywords: ['grocery', 'supermarket', 'food shopping', 'fresh produce']
  },
  {
    slug: 'pharmacies',
    name: 'Pharmacies',
    description: 'Pharmacy and health products',
    keywords: ['pharmacy', 'chemist', 'prescription', 'health products']
  }
]

// Generate SEO metadata for city/category combinations
export function generateCityCategoryMeta(city: string, category: string) {
  const cityData = QUEENSLAND_CITIES.find(c => c.slug === city)
  const categoryData = BUSINESS_CATEGORIES.find(c => c.slug === category)
  
  if (!cityData || !categoryData) return null
  
  const title = `${categoryData.name} in ${cityData.name}, QLD | UiQ Community`
  const description = `Find trusted ${categoryData.name.toLowerCase()} in ${cityData.name}, Queensland. Connect with local ${categoryData.description.toLowerCase()} through the UiQ Community platform.`
  const keywords = [
    ...categoryData.keywords,
    cityData.name,
    'Queensland',
    'QLD',
    cityData.region,
    'Ugandan community',
    'local business'
  ]
  
  return {
    title,
    description,
    keywords,
    canonicalUrl: `/au/${city}/${category}`,
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Directory', url: '/directory' },
      { name: cityData.name, url: `/au/${city}` },
      { name: categoryData.name, url: `/au/${city}/${category}` }
    ],
    city: cityData,
    category: categoryData
  }
}

// Generate all possible city/category combinations
export function getAllCityCategoryCombinations() {
  const combinations = []
  
  for (const city of QUEENSLAND_CITIES) {
    for (const category of BUSINESS_CATEGORIES) {
      combinations.push({
        city: city.slug,
        category: category.slug,
        path: `/au/${city.slug}/${category.slug}`
      })
    }
  }
  
  return combinations
}

// Generate city-only pages
export function getAllCityPages() {
  return QUEENSLAND_CITIES.map(city => ({
    city: city.slug,
    path: `/au/${city.slug}`,
    meta: {
      title: `Businesses in ${city.name}, QLD | UiQ Community`,
      description: `Discover local businesses and services in ${city.name}, Queensland. Connect with the Ugandan community and find trusted service providers.`,
      keywords: [city.name, 'Queensland', 'QLD', city.region, 'Ugandan community', 'local business', 'directory']
    }
  }))
}

// Generate category-only pages
export function getAllCategoryPages() {
  return BUSINESS_CATEGORIES.map(category => ({
    category: category.slug,
    path: `/directory/${category.slug}`,
    meta: {
      title: `${category.name} in Queensland | UiQ Community`,
      description: `Find trusted ${category.name.toLowerCase()} across Queensland. ${category.description} through the UiQ Community platform.`,
      keywords: [...category.keywords, 'Queensland', 'QLD', 'Ugandan community', 'local business']
    }
  }))
}