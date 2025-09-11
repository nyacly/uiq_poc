// UiQ Design System Tokens - Ugandans in Queensland
// Comprehensive design system with Ugandan flag colors and African heritage

export const UiQTokens = {
  // Color Palette - Inspired by Ugandan Flag
  colors: {
    // Primary Red - Brotherhood/Sisterhood
    primary: {
      50: '#fef2f2',
      500: '#ef4444', // Main red
      600: '#dc2626',
      700: '#b91c1c',
    },
    // Secondary Yellow - Sunshine
    secondary: {
      50: '#fefce8', 
      400: '#facc15', // Main yellow
      500: '#eab308',
      600: '#ca8a04',
    },
    // Accent Black - The People
    accent: {
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b', // Main black
    }
  },

  // Typography Scale
  typography: {
    display: {
      xl: 'text-display-xl',
      lg: 'text-display-lg',
      md: 'text-display-md',
    },
    heading: {
      h1: 'text-h1',
      h2: 'text-h2',
      h3: 'text-h3',
      h4: 'text-h4',
      h5: 'text-h5',
      h6: 'text-h6',
    },
    body: {
      xl: 'text-body-xl',
      lg: 'text-body-lg', 
      md: 'text-body-md',
      sm: 'text-body-sm',
    },
    caption: {
      lg: 'text-caption-lg',
      md: 'text-caption-md',
      sm: 'text-caption-sm',
    }
  },

  // Spacing Scale
  spacing: {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
    '2xl': 'p-12',
  },

  // Border Radius
  radius: {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full',
  },

  // Shadows & Elevation
  elevation: {
    soft: 'shadow-soft',
    medium: 'shadow-medium',
    large: 'shadow-large',
    card: 'shadow-card',
    modal: 'shadow-modal',
    toast: 'shadow-toast',
  },

  // Component Variants
  components: {
    badge: {
      verified: 'verified',
      premium: 'premium',
      memberPlus: 'member-plus',
      new: 'new',
      featured: 'featured',
      urgent: 'urgent',
    },
    chip: {
      default: 'default',
      primary: 'primary', 
      secondary: 'secondary',
      outline: 'outline',
    },
    button: {
      primary: 'primary',
      secondary: 'secondary',
      outline: 'outline',
      text: 'text',
    }
  }
} as const

// UiQ Community Specific Constants
export const UiQCommunity = {
  name: 'UiQ',
  fullName: 'Ugandans in Queensland',
  tagline: 'Celebrating Ugandan heritage in Queensland',
  
  // Cultural Elements
  cultural: {
    colors: ['Red (Brotherhood)', 'Yellow (Sunshine)', 'Black (The People)'],
    symbols: ['🇺🇬', '🦢', '☀️', '🤝'],
    values: ['Unity', 'Heritage', 'Community', 'Growth']
  },

  // Feature Categories
  features: {
    directory: { icon: '🏢', name: 'Business Directory' },
    services: { icon: '⚡', name: 'Service Providers' },
    events: { icon: '📅', name: 'Cultural Events' },
    announcements: { icon: '📢', name: 'Community News' },
    opportunities: { icon: '🎯', name: 'Opportunities' },
    classifieds: { icon: '🏷️', name: 'Marketplace' },
    groups: { icon: '💬', name: 'WhatsApp Groups' }
  }
} as const

export type UiQColorToken = keyof typeof UiQTokens.colors
export type UiQTypographyToken = keyof typeof UiQTokens.typography
export type UiQComponentVariant = keyof typeof UiQTokens.components