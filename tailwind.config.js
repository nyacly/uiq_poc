/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // UiQ (Ugandans in Queensland) Design System
      colors: {
        // UiQ Primary - Inspired by Ugandan flag Red (brotherhood/sisterhood)
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Main red
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // UiQ Secondary - Inspired by Ugandan flag Yellow (sunshine)
        secondary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15', // Main yellow
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        // UiQ Accent - Inspired by Ugandan flag Black (the people)
        accent: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b', // Main black
          950: '#09090b',
        },
        // Semantic colors with high contrast for accessibility
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Main green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Main orange
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Main blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Main red (same as primary)
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Surface and background colors
        surface: {
          50: '#fefefe',
          100: '#fdfdfd',
          200: '#fafafa',
          300: '#f7f7f7',
          400: '#f3f3f3',
          500: '#ededed',
          600: '#e4e4e4',
          700: '#d1d1d1',
          800: '#b7b7b7',
          900: '#999999',
          950: '#666666',
        },
        background: {
          50: '#fefefe',
          100: '#fefefe',
          200: '#fefefe',
          300: '#fdfdfd',
          400: '#fcfcfc',
          500: '#fafafa',
          600: '#f7f7f7',
          700: '#f3f3f3',
          800: '#ededed',
          900: '#e4e4e4',
          950: '#d1d1d1',
        },
        // Text colors with proper contrast ratios
        text: {
          primary: '#111827', // High contrast for body text
          secondary: '#6b7280', // Medium contrast for supporting text
          tertiary: '#9ca3af', // Lower contrast for hints/captions
          inverse: '#ffffff', // White text for dark backgrounds
          accent: '#dc2626', // Red accent text
          muted: '#f9fafb', // Very light for backgrounds
        },
        // Neutral grays with high contrast for accessibility
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      // Typography scale for UiQ
      fontSize: {
        // Display text - Large headings and hero text
        'display-2xl': ['4.5rem', { lineHeight: '1.1', fontWeight: '800' }], // 72px
        'display-xl': ['3.75rem', { lineHeight: '1.1', fontWeight: '800' }], // 60px
        'display-lg': ['3rem', { lineHeight: '1.2', fontWeight: '700' }], // 48px
        'display-md': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }], // 36px
        'display-sm': ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }], // 30px
        
        // Headings - Section and subsection titles
        'h1': ['1.875rem', { lineHeight: '1.3', fontWeight: '700' }], // 30px
        'h2': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }], // 24px
        'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }], // 20px
        'h4': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }], // 18px
        'h5': ['1rem', { lineHeight: '1.5', fontWeight: '600' }], // 16px
        'h6': ['0.875rem', { lineHeight: '1.5', fontWeight: '600' }], // 14px
        
        // Body text - Content and interface text
        'body-xl': ['1.25rem', { lineHeight: '1.6', fontWeight: '400' }], // 20px
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }], // 18px
        'body-md': ['1rem', { lineHeight: '1.6', fontWeight: '400' }], // 16px
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }], // 14px
        'body-xs': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }], // 12px
        
        // Caption text - Labels, hints, metadata
        'caption-lg': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }], // 14px
        'caption-md': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }], // 12px
        'caption-sm': ['0.6875rem', { lineHeight: '1.4', fontWeight: '500' }], // 11px
        
        // Existing sizes for backward compatibility
        'xs': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
        'sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'base': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'xl': ['1.25rem', { lineHeight: '1.5', fontWeight: '500' }],
        '2xl': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        '3xl': ['1.875rem', { lineHeight: '1.3', fontWeight: '700' }],
        '4xl': ['2.25rem', { lineHeight: '1.2', fontWeight: '800' }],
      },
      // Spacing scale for consistent layout
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
        '34': '8.5rem',   // 136px
        '38': '9.5rem',   // 152px
        '42': '10.5rem',  // 168px
        '46': '11.5rem',  // 184px
        '50': '12.5rem',  // 200px
        '54': '13.5rem',  // 216px
        '58': '14.5rem',  // 232px
        '62': '15.5rem',  // 248px
        '66': '16.5rem',  // 264px
        '70': '17.5rem',  // 280px
        '74': '18.5rem',  // 296px
        '78': '19.5rem',  // 312px
        '82': '20.5rem',  // 328px
        '86': '21.5rem',  // 344px
        '90': '22.5rem',  // 360px
        '94': '23.5rem',  // 376px
        '98': '24.5rem',  // 392px
      },
      // Border radius scale
      borderRadius: {
        'xs': '0.125rem',  // 2px
        'sm': '0.25rem',   // 4px
        'md': '0.375rem',  // 6px
        'lg': '0.5rem',    // 8px - UiQ standard
        'xl': '0.75rem',   // 12px - UiQ standard
        '2xl': '1rem',     // 16px - UiQ standard
        '3xl': '1.5rem',   // 24px
        '4xl': '2rem',     // 32px
      },
      // Box shadows for elevation
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'large': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'extra': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        // UiQ specific elevations
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'modal': '0 24px 48px rgba(0, 0, 0, 0.18)',
        'toast': '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
      // Animation and transitions
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'skeleton': 'skeleton 1.2s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'skeleton': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.8' }
        }
      },
      // Grid system
      gridTemplateColumns: {
        'auto-fit': 'repeat(auto-fit, minmax(0, 1fr))',
        'auto-fill': 'repeat(auto-fill, minmax(0, 1fr))',
        'auto-fit-sm': 'repeat(auto-fit, minmax(16rem, 1fr))',
        'auto-fit-md': 'repeat(auto-fit, minmax(20rem, 1fr))',
        'auto-fit-lg': 'repeat(auto-fit, minmax(24rem, 1fr))',
        'auto-fit-xl': 'repeat(auto-fit, minmax(28rem, 1fr))',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}