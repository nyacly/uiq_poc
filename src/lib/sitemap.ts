/**
 * Site Map for Community Platform
 * Comprehensive structure for the web-first community platform
 */

export interface SiteMapItem {
  path: string
  title: string
  description: string
  accessLevel: 'public' | 'authenticated' | 'premium' | 'admin'
  schemaType?: string
  features: string[]
}

export const SITE_MAP: SiteMapItem[] = [
  // Public Pages
  {
    path: '/',
    title: 'Home',
    description: 'Landing page with community overview and feature highlights',
    accessLevel: 'public',
    schemaType: 'WebSite',
    features: ['Hero section', 'Feature grid', 'CTA sections', 'Community stats']
  },
  
  // Authentication & Account
  {
    path: '/auth/login',
    title: 'Login',
    description: 'User authentication with email/phone + social logins',
    accessLevel: 'public',
    features: ['Email/phone login', 'Apple/Google OAuth', 'Remember me', 'Password reset']
  },
  {
    path: '/auth/signup',
    title: 'Sign Up',
    description: 'New user registration with membership options',
    accessLevel: 'public',
    features: ['Registration form', 'Membership plan selection', 'Email verification', 'Terms acceptance']
  },
  {
    path: '/account/profile',
    title: 'Profile Settings',
    description: 'User profile management and privacy controls',
    accessLevel: 'authenticated',
    features: ['Profile editing', 'Privacy controls', 'Avatar upload', 'Notification preferences']
  },
  {
    path: '/account/membership',
    title: 'Membership',
    description: 'Membership plan management and perks',
    accessLevel: 'authenticated',
    features: ['Plan details', 'Billing history', 'Upgrade/downgrade', 'Perks overview']
  },
  
  // Business Directory
  {
    path: '/directory',
    title: 'Business Directory',
    description: 'Searchable directory of local businesses with filters',
    accessLevel: 'public',
    schemaType: 'LocalBusiness',
    features: ['Search & filters', 'Map/list toggle', 'Subscription tiers', 'Verification badges']
  },
  {
    path: '/directory/[businessId]',
    title: 'Business Profile',
    description: 'Individual business page with details and reviews',
    accessLevel: 'public',
    schemaType: 'LocalBusiness',
    features: ['Business info', 'Reviews', 'Contact form', 'Location map', 'Gallery']
  },
  {
    path: '/directory/submit',
    title: 'Submit Business',
    description: 'Business submission form with subscription options',
    accessLevel: 'authenticated',
    features: ['Business form', 'Subscription selection', 'Document upload', 'Payment integration']
  },
  
  // Service Providers
  {
    path: '/services',
    title: 'Service Providers',
    description: 'People-centric service provider directory',
    accessLevel: 'public',
    schemaType: 'ProfessionalService',
    features: ['Provider search', 'Competence tags', 'Coverage radius', 'Qualification verification']
  },
  {
    path: '/services/[providerId]',
    title: 'Provider Profile',
    description: 'Individual service provider page',
    accessLevel: 'public',
    schemaType: 'Person',
    features: ['Provider details', 'Services offered', 'Coverage area', 'Contact form', 'Reviews']
  },
  
  // Events
  {
    path: '/events',
    title: 'Community Events',
    description: 'Event listings with calendar view and filters',
    accessLevel: 'public',
    schemaType: 'Event',
    features: ['Event calendar', 'Filters', 'RSVP system', 'Reminders', 'ICS export']
  },
  {
    path: '/events/[eventId]',
    title: 'Event Details',
    description: 'Individual event page with RSVP',
    accessLevel: 'public',
    schemaType: 'Event',
    features: ['Event info', 'RSVP form', 'Attendee list', 'Location map', 'Calendar add']
  },
  {
    path: '/events/create',
    title: 'Create Event',
    description: 'Event creation form for community members',
    accessLevel: 'authenticated',
    features: ['Event form', 'Date/time picker', 'Location selection', 'Image upload']
  },
  
  // Announcements
  {
    path: '/announcements',
    title: 'Community Announcements',
    description: 'Important community updates and news',
    accessLevel: 'public',
    features: ['Announcement feed', 'Categories', 'Search', 'Email subscriptions']
  },
  {
    path: '/announcements/bereavements',
    title: 'Bereavements',
    description: 'Community bereavement notices with contribution options',
    accessLevel: 'public',
    schemaType: 'Obituary',
    features: ['Memorial notices', 'Contribution links', 'Condolence messages', 'Service details']
  },
  {
    path: '/announcements/[announcementId]',
    title: 'Announcement Details',
    description: 'Individual announcement or bereavement notice',
    accessLevel: 'public',
    features: ['Full content', 'Comments', 'Share options', 'Related announcements']
  },
  
  // Programs & Opportunities
  {
    path: '/opportunities',
    title: 'Programs & Opportunities',
    description: 'Scholarships, jobs, grants with deadline tracking',
    accessLevel: 'public',
    schemaType: 'JobPosting',
    features: ['Opportunity search', 'Filters', 'Deadline alerts', 'Application tracking']
  },
  {
    path: '/opportunities/[opportunityId]',
    title: 'Opportunity Details',
    description: 'Individual opportunity with application process',
    accessLevel: 'public',
    schemaType: 'JobPosting',
    features: ['Requirements', 'Application form', 'Deadline countdown', 'Related opportunities']
  },
  
  // Classifieds & Housing
  {
    path: '/classifieds',
    title: 'Classifieds',
    description: 'Community marketplace for buying and selling',
    accessLevel: 'public',
    schemaType: 'Product',
    features: ['Item listings', 'Categories', 'Search filters', 'Paid boosts']
  },
  {
    path: '/classifieds/housing',
    title: 'Housing & Roommates',
    description: 'Housing listings and roommate matching',
    accessLevel: 'public',
    schemaType: 'RealEstatePosting',
    features: ['Property listings', 'Roommate search', 'Filters', 'Contact forms']
  },
  {
    path: '/classifieds/[listingId]',
    title: 'Listing Details',
    description: 'Individual classified listing page',
    accessLevel: 'public',
    schemaType: 'Product',
    features: ['Item details', 'Image gallery', 'Seller contact', 'Related listings']
  },
  {
    path: '/classifieds/post',
    title: 'Post Listing',
    description: 'Create new classified listing',
    accessLevel: 'authenticated',
    features: ['Listing form', 'Image upload', 'Boost options', 'Preview']
  },
  
  // Messaging
  {
    path: '/messages',
    title: 'Messages',
    description: 'User messaging system with moderation',
    accessLevel: 'authenticated',
    features: ['Message threads', 'Contact forms', 'Report/block', 'Moderation queue']
  },
  {
    path: '/messages/[threadId]',
    title: 'Message Thread',
    description: 'Individual conversation thread',
    accessLevel: 'authenticated',
    features: ['Message history', 'File attachments', 'Report options', 'Auto-moderation']
  },
  
  // Community Groups (WhatsApp Integration)
  {
    path: '/groups',
    title: 'Community Groups',
    description: 'WhatsApp group directory and deep links',
    accessLevel: 'authenticated',
    features: ['Group listings', 'WhatsApp deep links', 'Group descriptions', 'Join requests']
  },
  
  // Administrative
  {
    path: '/admin',
    title: 'Admin Dashboard',
    description: 'Administrative controls and moderation',
    accessLevel: 'admin',
    features: ['User management', 'Content moderation', 'Analytics', 'System settings']
  },
  {
    path: '/admin/moderation',
    title: 'Moderation Queue',
    description: 'Content moderation and user reports',
    accessLevel: 'admin',
    features: ['Report queue', 'Content review', 'User actions', 'Audit logs']
  },
  
  // SEO & Technical
  {
    path: '/sitemap.xml',
    title: 'XML Sitemap',
    description: 'SEO sitemap for search engines',
    accessLevel: 'public',
    features: ['Dynamic sitemap', 'Priority weighting', 'Last modified dates']
  },
  {
    path: '/robots.txt',
    title: 'Robots File',
    description: 'Search engine crawler instructions',
    accessLevel: 'public',
    features: ['Crawler rules', 'Sitemap reference']
  },
  
  // Legal & Policy
  {
    path: '/privacy',
    title: 'Privacy Policy',
    description: 'Data privacy and protection policy',
    accessLevel: 'public',
    features: ['Privacy details', 'Data handling', 'User rights']
  },
  {
    path: '/terms',
    title: 'Terms of Service',
    description: 'Platform terms and conditions',
    accessLevel: 'public',
    features: ['Usage terms', 'User responsibilities', 'Platform rules']
  }
]

// Navigation structure for main menu
export const MAIN_NAVIGATION = [
  { label: 'Directory', path: '/directory' },
  { label: 'Services', path: '/services' },
  { label: 'Events', path: '/events' },
  { label: 'Announcements', path: '/announcements' },
  { label: 'Opportunities', path: '/opportunities' },
  { label: 'Classifieds', path: '/classifieds' },
  { label: 'Groups', path: '/groups' }
]

// Footer navigation
export const FOOTER_NAVIGATION = [
  {
    title: 'Community',
    links: [
      { label: 'About Us', path: '/about' },
      { label: 'Contact', path: '/contact' },
      { label: 'Community Guidelines', path: '/guidelines' }
    ]
  },
  {
    title: 'Services',
    links: [
      { label: 'Business Directory', path: '/directory' },
      { label: 'Service Providers', path: '/services' },
      { label: 'Events', path: '/events' }
    ]
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', path: '/help' },
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' }
    ]
  }
]