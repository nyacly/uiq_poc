export interface SampleBusiness {
  id: string
  name: string
  slug: string
  category: string
  description: string
  ratingAvg: number
  ratingCount: number
  verified: boolean
  plan: 'Basic' | 'Standard' | 'Premium'
  location: string
  image: string
}

export interface SampleEvent {
  id: string
  title: string
  slug: string
  category: string
  description: string
  startAt: string
  endAt: string
  venue: string
  priceCents: number
  image: string
  organiser: string
}

export interface SampleAnnouncement {
  id: string
  title: string
  body: string
  type: string
  author: string
  publishedAt: string
}

export interface SampleListing {
  id: string
  title: string
  slug: string
  type: 'sale' | 'housing' | 'gig'
  description: string
  priceCents: number
  location: string
  image: string
  postedAt: string
}

export const sampleBusinesses: SampleBusiness[] = [
  {
    id: 'biz1',
    name: "Nakato's African Cuisine",
    slug: 'nakatos-african-cuisine',
    category: 'Restaurant',
    description:
      'Authentic Ugandan and East African dishes made with love. Specializing in matoke, posho, groundnut stew, and rolex.',
    ratingAvg: 4.9,
    ratingCount: 24,
    verified: true,
    plan: 'Premium',
    location: 'South Brisbane',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop&auto=format'
  },
  {
    id: 'biz2',
    name: 'Mukasa Auto Services',
    slug: 'mukasa-auto-services',
    category: 'Mechanic',
    description:
      'Professional automotive repair and maintenance services. Specializing in pre-purchase inspections and roadworthy certificates.',
    ratingAvg: 4.8,
    ratingCount: 18,
    verified: true,
    plan: 'Standard',
    location: 'Toowoomba',
    image: 'https://images.unsplash.com/photo-1632823471565-1ecdf2df44b2?w=600&h=400&fit=crop&auto=format'
  },
  {
    id: 'biz3',
    name: 'Uganda Tech Solutions',
    slug: 'uganda-tech-solutions',
    category: 'IT Services',
    description:
      'IT support and digital solutions for small businesses and individuals. Computer repairs, website development, and tech consulting.',
    ratingAvg: 4.7,
    ratingCount: 15,
    verified: true,
    plan: 'Standard',
    location: 'Brisbane CBD',
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&h=400&fit=crop&auto=format'
  },
  {
    id: 'biz4',
    name: 'Kaggwa Cleaning Collective',
    slug: 'kaggwa-cleaning-collective',
    category: 'Cleaning',
    description:
      'Reliable residential and commercial cleaning services with eco-friendly products and flexible schedules.',
    ratingAvg: 4.6,
    ratingCount: 32,
    verified: true,
    plan: 'Premium',
    location: 'Logan',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop&auto=format'
  },
  {
    id: 'biz5',
    name: 'Sanyu Family Daycare',
    slug: 'sanyu-family-daycare',
    category: 'Childcare',
    description:
      'Warm and inclusive family daycare with a focus on Ugandan culture, language, and healthy meals for little ones.',
    ratingAvg: 4.95,
    ratingCount: 41,
    verified: true,
    plan: 'Premium',
    location: 'Ipswich',
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=400&fit=crop&auto=format'
  },
  {
    id: 'biz6',
    name: 'Queensland Ugandan Nurses Network',
    slug: 'queensland-ugandan-nurses-network',
    category: 'Healthcare',
    description:
      'Experienced nurses offering in-home care, medication management, and wellbeing support for families across Queensland.',
    ratingAvg: 4.85,
    ratingCount: 27,
    verified: true,
    plan: 'Standard',
    location: 'Gold Coast',
    image: 'https://images.unsplash.com/photo-1587502537745-84ab0f4d2b71?w=600&h=400&fit=crop&auto=format'
  }
]

export const sampleEvents: SampleEvent[] = [
  {
    id: 'evt1',
    title: "Uganda Independence Day Celebration 2024",
    slug: 'uganda-independence-day-2024',
    category: 'Cultural',
    description:
      "Join us for a spectacular celebration of Uganda's Independence Day! Traditional music, dance performances, authentic food stalls, and cultural activities for the whole family.",
    startAt: '2024-10-09T14:00:00+10:00',
    endAt: '2024-10-09T20:00:00+10:00',
    venue: 'Musgrave Park, South Brisbane QLD',
    priceCents: 0,
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=900&h=600&fit=crop&auto=format',
    organiser: 'UiQ Community'
  },
  {
    id: 'evt2',
    title: 'UiQ Business Networking Mixer',
    slug: 'uiq-business-networking-mixer',
    category: 'Business',
    description:
      'Monthly networking event for Ugandan business owners and professionals in Queensland. Connect, share experiences, and grow your network.',
    startAt: '2024-09-20T18:00:00+10:00',
    endAt: '2024-09-20T21:00:00+10:00',
    venue: 'Brisbane Convention Centre, South Brisbane',
    priceCents: 2500,
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=900&h=600&fit=crop&auto=format',
    organiser: 'UiQ Business Circle'
  },
  {
    id: 'evt3',
    title: 'Education Workshop: Navigating Australian Schools',
    slug: 'education-workshop-australian-schools',
    category: 'Education',
    description:
      'Free workshop for Ugandan families navigating the Australian education system. Learn about school applications, NAPLAN, and scholarship opportunities.',
    startAt: '2024-09-15T10:00:00+10:00',
    endAt: '2024-09-15T15:00:00+10:00',
    venue: 'Brisbane City Library, Brisbane CBD',
    priceCents: 0,
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9d1?w=900&h=600&fit=crop&auto=format',
    organiser: 'UiQ Education Collective'
  },
  {
    id: 'evt4',
    title: 'Queensland Community Picnic',
    slug: 'queensland-community-picnic',
    category: 'Community',
    description:
      'Bring your family and favourite dishes for a relaxed community picnic. Games for kids, drum circles, and storytelling corner.',
    startAt: '2024-10-05T11:00:00+10:00',
    endAt: '2024-10-05T16:00:00+10:00',
    venue: 'Roma Street Parklands, Brisbane',
    priceCents: 0,
    image: 'https://images.unsplash.com/photo-1521334884684-d80222895322?w=900&h=600&fit=crop&auto=format',
    organiser: 'UiQ Families'
  }
]

export const sampleAnnouncements: SampleAnnouncement[] = [
  {
    id: 'ann1',
    title: 'Celebrating Dr. Auma for Community Service',
    body:
      'Join us in congratulating Dr. Grace Auma for receiving the Queensland Community Leadership Award for her outstanding contribution to Ugandan families across the state.',
    type: 'ACHIEVEMENT',
    author: 'UiQ Leadership Team',
    publishedAt: '2024-08-01T09:00:00+10:00'
  },
  {
    id: 'ann2',
    title: 'Bereavement Notice: In Memory of Mr. Kato',
    body:
      'We are saddened to announce the passing of Mr. John Kato. A memorial service will be held on 18 August at St. Stephen\'s Cathedral, Brisbane. Please keep the family in your prayers.',
    type: 'BEREAVEMENT',
    author: 'UiQ Care Team',
    publishedAt: '2024-08-05T08:30:00+10:00'
  },
  {
    id: 'ann3',
    title: 'Scholarship Applications Now Open',
    body:
      'Applications are now open for the 2025 UiQ Youth Scholarships supporting Ugandan students in Queensland. Submit your application before 30 September.',
    type: 'NOTICE',
    author: 'UiQ Education Committee',
    publishedAt: '2024-07-28T12:00:00+10:00'
  }
]

export const sampleListings: SampleListing[] = [
  {
    id: 'list1',
    title: 'Fully Furnished Room in South Brisbane',
    slug: 'furnished-room-south-brisbane',
    type: 'housing',
    description:
      'Sunny private room available in a Ugandan household. Includes utilities, Wi-Fi, and access to public transport. Female housemates preferred.',
    priceCents: 22000,
    location: 'South Brisbane',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900&h=600&fit=crop&auto=format',
    postedAt: '2024-08-10T10:00:00+10:00'
  },
  {
    id: 'list2',
    title: 'Traditional Drumming for Events',
    slug: 'traditional-drumming-for-events',
    type: 'gig',
    description:
      'Experienced troupe available for weddings, cultural events, and school performances. Includes instruments and colourful costumes.',
    priceCents: 45000,
    location: 'Greater Brisbane',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&h=600&fit=crop&auto=format',
    postedAt: '2024-08-08T14:30:00+10:00'
  },
  {
    id: 'list3',
    title: 'Ugandan Food Catering Package',
    slug: 'ugandan-food-catering-package',
    type: 'sale',
    description:
      'Catering for up to 80 guests including luwombo, matoke, pilau, and vegetarian options. Perfect for celebrations and church functions.',
    priceCents: 120000,
    location: 'Logan',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=900&h=600&fit=crop&auto=format',
    postedAt: '2024-08-03T09:15:00+10:00'
  },
  {
    id: 'list4',
    title: 'Second-hand Baby Essentials Bundle',
    slug: 'baby-essentials-bundle',
    type: 'sale',
    description:
      'Bundle includes cot, stroller, baby carrier, and toys in great condition. Pickup available in Ipswich on weekends.',
    priceCents: 18000,
    location: 'Ipswich',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&h=600&fit=crop&auto=format',
    postedAt: '2024-08-11T16:45:00+10:00'
  }
]
