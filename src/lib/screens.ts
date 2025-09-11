/**
 * Screen List for Community Platform
 * Detailed breakdown of UI screens with components and functionality
 */

export interface ScreenComponent {
  name: string
  description: string
  accessibility: string[]
  responsive: boolean
  seoOptimized: boolean
}

export interface Screen {
  id: string
  name: string
  path: string
  description: string
  layout: 'main' | 'auth' | 'admin' | 'minimal'
  components: ScreenComponent[]
  userStories: string[]
  acceptanceCriteria: string[]
}

export const SCREENS: Screen[] = [
  // Home & Landing
  {
    id: 'home',
    name: 'Home Page',
    path: '/',
    description: 'Main landing page showcasing community platform features',
    layout: 'main',
    components: [
      {
        name: 'HeroSection',
        description: 'Primary call-to-action with community branding',
        accessibility: ['High contrast text', 'Large tap targets', 'Screen reader support'],
        responsive: true,
        seoOptimized: true
      },
      {
        name: 'FeatureGrid',
        description: 'Card-based grid showcasing main platform modules',
        accessibility: ['Keyboard navigation', 'Focus indicators', 'Alt text for icons'],
        responsive: true,
        seoOptimized: true
      },
      {
        name: 'CommunityStats',
        description: 'Key metrics and member testimonials',
        accessibility: ['ARIA labels', 'Semantic markup'],
        responsive: true,
        seoOptimized: true
      },
      {
        name: 'CTASection',
        description: 'Secondary call-to-action for registration',
        accessibility: ['High contrast', 'Large buttons'],
        responsive: true,
        seoOptimized: false
      }
    ],
    userStories: [
      'As a visitor, I want to understand what the platform offers',
      'As a community member, I want quick access to main features',
      'As a new user, I want clear guidance on getting started'
    ],
    acceptanceCriteria: [
      'Page loads in under 3 seconds',
      'All interactive elements meet 44px minimum touch target',
      'WCAG 2.2 AA compliance',
      'Schema.org markup for SEO'
    ]
  },
  
  // Authentication Screens
  {
    id: 'login',
    name: 'Login Screen',
    path: '/auth/login',
    description: 'User authentication with multiple login methods',
    layout: 'auth',
    components: [
      {
        name: 'LoginForm',
        description: 'Email/phone login with validation',
        accessibility: ['Form labels', 'Error messages', 'Password visibility toggle'],
        responsive: true,
        seoOptimized: false
      },
      {
        name: 'SocialLogin',
        description: 'Apple and Google OAuth integration',
        accessibility: ['Button labels', 'Loading states'],
        responsive: true,
        seoOptimized: false
      },
      {
        name: 'ForgotPassword',
        description: 'Password reset flow initiation',
        accessibility: ['Clear instructions', 'Form validation'],
        responsive: true,
        seoOptimized: false
      }
    ],
    userStories: [
      'As a returning user, I want to login quickly with my preferred method',
      'As a user with accessibility needs, I want clear form guidance',
      'As a mobile user, I want easy social login options'
    ],
    acceptanceCriteria: [
      'Form validation with clear error messages',
      'Social login integration working',
      'Secure password handling',
      'Mobile-optimized interface'
    ]
  },
  
  // Directory Screens
  {
    id: 'directory-listing',
    name: 'Business Directory',
    path: '/directory',
    description: 'Searchable business directory with filters and map view',
    layout: 'main',
    components: [
      {
        name: 'SearchFilters',
        description: 'Sticky filter bar with category, location, and rating filters',
        accessibility: ['Filter labels', 'Clear filter options', 'Screen reader support'],
        responsive: true,
        seoOptimized: true
      },
      {
        name: 'MapListToggle',
        description: 'Switch between map and list view',
        accessibility: ['Toggle state indication', 'Keyboard controls'],
        responsive: true,
        seoOptimized: false
      },
      {
        name: 'BusinessCard',
        description: 'Individual business listing card with key info',
        accessibility: ['Card navigation', 'Image alt text', 'Structured data'],
        responsive: true,
        seoOptimized: true
      },
      {
        name: 'Pagination',
        description: 'Accessible pagination with load more option',
        accessibility: ['Page navigation', 'Current page indication'],
        responsive: true,
        seoOptimized: true
      }
    ],
    userStories: [
      'As a customer, I want to find local businesses by category',
      'As a mobile user, I want to see businesses on a map',
      'As someone with vision impairment, I need clear business information'
    ],
    acceptanceCriteria: [
      'Sub-3 second filter application',
      'Map loads with proper accessibility',
      'Business cards show subscription tier badges',
      'SEO-friendly URLs for all listings'
    ]
  },
  
  {
    id: 'business-profile',
    name: 'Business Profile',
    path: '/directory/[businessId]',
    description: 'Detailed business page with reviews and contact options',
    layout: 'main',
    components: [
      {
        name: 'BusinessHeader',
        description: 'Business name, verification badge, and key details',
        accessibility: ['Heading hierarchy', 'Badge descriptions'],
        responsive: true,
        seoOptimized: true
      },
      {
        name: 'ContactForm',
        description: 'Lead generation form for business inquiries',
        accessibility: ['Form validation', 'Required field indicators'],
        responsive: true,
        seoOptimized: false
      },
      {
        name: 'ReviewsSection',
        description: 'Customer reviews with ratings and moderation',
        accessibility: ['Review navigation', 'Rating descriptions'],
        responsive: true,
        seoOptimized: true
      },
      {
        name: 'LocationMap',
        description: 'Interactive map with business location',
        accessibility: ['Map description', 'Address details'],
        responsive: true,
        seoOptimized: true
      }
    ],
    userStories: [
      'As a potential customer, I want to see business reviews and ratings',
      'As someone researching, I want to contact the business easily',
      'As a mobile user, I want to get directions to the business'
    ],
    acceptanceCriteria: [
      'Schema.org LocalBusiness markup',
      'Contact form spam protection',
      'Reviews load with lazy loading',
      'Map is accessible and responsive'
    ]
  },
  
  // Events Screens
  {
    id: 'events-calendar',
    name: 'Events Calendar',
    path: '/events',
    description: 'Community events with calendar view and RSVP system',
    layout: 'main',
    components: [
      {
        name: 'CalendarView',
        description: 'Monthly/weekly calendar with event indicators',
        accessibility: ['Calendar navigation', 'Event announcements', 'Date selection'],
        responsive: true,
        seoOptimized: true
      },
      {
        name: 'EventFilters',
        description: 'Filter events by category, date, and location',
        accessibility: ['Filter controls', 'Clear selections'],
        responsive: true,
        seoOptimized: true
      },
      {
        name: 'EventCard',
        description: 'Event preview card with quick RSVP',
        accessibility: ['Event details', 'RSVP status', 'Date formatting'],
        responsive: true,
        seoOptimized: true
      },
      {
        name: 'UpcomingEvents',
        description: 'Sidebar with next few events',
        accessibility: ['Event list navigation', 'Time remaining indicators'],
        responsive: true,
        seoOptimized: false
      }
    ],
    userStories: [
      'As a community member, I want to see upcoming events',
      'As an event organizer, I want people to easily RSVP',
      'As a mobile user, I want to add events to my calendar'
    ],
    acceptanceCriteria: [
      'Calendar is keyboard navigable',
      'Events have Schema.org markup',
      'ICS export functionality works',
      'RSVP system tracks attendance'
    ]
  },
  
  // Messaging Screens
  {
    id: 'messages-inbox',
    name: 'Messages Inbox',
    path: '/messages',
    description: 'User messaging system with conversation threads',
    layout: 'main',
    components: [
      {
        name: 'ConversationList',
        description: 'List of message threads with previews',
        accessibility: ['Thread navigation', 'Unread indicators', 'Message previews'],
        responsive: true,
        seoOptimized: false
      },
      {
        name: 'MessageThread',
        description: 'Individual conversation view with messages',
        accessibility: ['Message order', 'Sender identification', 'Timestamp reading'],
        responsive: true,
        seoOptimized: false
      },
      {
        name: 'MessageComposer',
        description: 'New message creation with file attachments',
        accessibility: ['Composer controls', 'Attachment indicators', 'Send confirmation'],
        responsive: true,
        seoOptimized: false
      },
      {
        name: 'ModerationControls',
        description: 'Report, block, and safety features',
        accessibility: ['Control labels', 'Confirmation dialogs'],
        responsive: true,
        seoOptimized: false
      }
    ],
    userStories: [
      'As a user, I want to message businesses securely',
      'As someone receiving unwanted messages, I want to report/block users',
      'As a mobile user, I want easy message navigation'
    ],
    acceptanceCriteria: [
      'Messages encrypted in transit',
      'Report system feeds moderation queue',
      'File attachments are virus scanned',
      'Interface works on mobile devices'
    ]
  },
  
  // Account Management
  {
    id: 'profile-settings',
    name: 'Profile Settings',
    path: '/account/profile',
    description: 'User profile management with privacy controls',
    layout: 'main',
    components: [
      {
        name: 'ProfileForm',
        description: 'Personal information editing form',
        accessibility: ['Form labels', 'Validation messages', 'Save confirmation'],
        responsive: true,
        seoOptimized: false
      },
      {
        name: 'PrivacyControls',
        description: 'Privacy settings and data sharing preferences',
        accessibility: ['Setting descriptions', 'Toggle states', 'Impact explanations'],
        responsive: true,
        seoOptimized: false
      },
      {
        name: 'AvatarUpload',
        description: 'Profile picture upload and cropping',
        accessibility: ['Upload instructions', 'Image preview', 'Crop controls'],
        responsive: true,
        seoOptimized: false
      },
      {
        name: 'NotificationSettings',
        description: 'Email and push notification preferences',
        accessibility: ['Setting categories', 'Frequency options'],
        responsive: true,
        seoOptimized: false
      }
    ],
    userStories: [
      'As a user, I want to control my profile visibility',
      'As someone privacy-conscious, I want granular privacy controls',
      'As a mobile user, I want to update my profile easily'
    ],
    acceptanceCriteria: [
      'Profile changes save immediately',
      'Privacy settings are honored throughout app',
      'Avatar upload supports multiple formats',
      'Notification preferences sync across devices'
    ]
  },
  
  // Administrative Screens
  {
    id: 'admin-dashboard',
    name: 'Admin Dashboard',
    path: '/admin',
    description: 'Administrative overview with key metrics and controls',
    layout: 'admin',
    components: [
      {
        name: 'MetricsDashboard',
        description: 'Key platform statistics and charts',
        accessibility: ['Chart descriptions', 'Data tables', 'Trend indicators'],
        responsive: true,
        seoOptimized: false
      },
      {
        name: 'QuickActions',
        description: 'Common administrative tasks shortcuts',
        accessibility: ['Action buttons', 'Task descriptions'],
        responsive: true,
        seoOptimized: false
      },
      {
        name: 'RecentActivity',
        description: 'Latest user and content activity feed',
        accessibility: ['Activity descriptions', 'User navigation'],
        responsive: true,
        seoOptimized: false
      },
      {
        name: 'AlertsPanel',
        description: 'System alerts and moderation flags',
        accessibility: ['Alert priorities', 'Action requirements'],
        responsive: true,
        seoOptimized: false
      }
    ],
    userStories: [
      'As an admin, I want to see platform health at a glance',
      'As a moderator, I want quick access to reports',
      'As a community manager, I want to track engagement'
    ],
    acceptanceCriteria: [
      'Dashboard loads key metrics under 2 seconds',
      'Charts are accessible to screen readers',
      'Real-time alerts system works',
      'Mobile admin interface is functional'
    ]
  }
]

// Component library for reusable elements
export const COMPONENT_LIBRARY = [
  'Button (Primary, Secondary, Outline, Text)',
  'Card (Standard, Featured, Compact)',
  'Form Elements (Input, Select, Textarea, Checkbox, Radio)',
  'Navigation (Header, Footer, Breadcrumbs, Pagination)',
  'Feedback (Toast, Modal, Alert, Loading)',
  'Media (Image, Avatar, Gallery, Video)',
  'Data Display (Table, List, Grid, Stats)',
  'Layout (Container, Grid, Sidebar, Sticky)',
  'Filters (Search, Category, Date, Range)',
  'Social (Share, Like, Comment, Follow)'
]

// Accessibility requirements for all screens
export const ACCESSIBILITY_REQUIREMENTS = [
  'WCAG 2.2 AA compliance',
  'Minimum 44px touch targets',
  'High contrast text (4.5:1 ratio minimum)',
  'Keyboard navigation support',
  'Screen reader compatibility',
  'Focus indicators visible',
  'Form labels and validation',
  'Skip links for main content',
  'Semantic HTML structure',
  'Responsive design (320px to 2560px)'
]