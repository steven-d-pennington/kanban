/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors with WCAG AA compliance
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Main primary color
          600: '#0284c7', // Primary hover/focus
          700: '#0369a1', // Primary active
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Secondary colors
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b', // Main secondary color
          600: '#475569', // Secondary hover/focus
          700: '#334155', // Secondary active
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Success colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Main success color
          600: '#16a34a', // Success hover/focus
          700: '#15803d', // Success active
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Warning colors
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Main warning color
          600: '#d97706', // Warning hover/focus
          700: '#b45309', // Warning active
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Error colors
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Main error color
          600: '#dc2626', // Error hover/focus
          700: '#b91c1c', // Error active
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Neutral grays with proper contrast
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252', // Light theme text on light bg (7.0:1)
          700: '#404040', // Light theme headings (10.4:1)
          800: '#262626', // Dark backgrounds with light text
          900: '#171717', // Main dark background
          950: '#0a0a0a', // Deepest dark
        },
        // Semantic color mappings for light theme
        'text-primary': '#404040', // neutral-700 - High contrast for headings
        'text-secondary': '#525252', // neutral-600 - Good contrast for body text
        'text-tertiary': '#737373', // neutral-500 - Lower contrast for secondary info
        'text-inverse': '#fafafa', // neutral-50 - Light text on dark backgrounds
        'text-disabled': '#a3a3a3', // neutral-400 - Disabled state text
        
        'bg-primary': '#ffffff', // Pure white background
        'bg-secondary': '#fafafa', // neutral-50 - Subtle background variation
        'bg-tertiary': '#f5f5f5', // neutral-100 - Card/panel backgrounds
        'bg-inverse': '#171717', // neutral-900 - Dark backgrounds
        'bg-disabled': '#e5e5e5', // neutral-200 - Disabled backgrounds
        
        'border-primary': '#e5e5e5', // neutral-200 - Main border color
        'border-secondary': '#d4d4d4', // neutral-300 - Stronger borders
        'border-focus': '#0ea5e9', // primary-500 - Focus indicators
        
        // Interactive states with proper contrast
        'surface-hover': '#f5f5f5', // neutral-100 - Subtle hover states
        'surface-active': '#e5e5e5', // neutral-200 - Active/pressed states
        'surface-selected': '#e0f2fe', // primary-100 - Selected states
      },
      // Typography scale with proper line heights for accessibility
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.6' }],
        'xl': ['1.25rem', { lineHeight: '1.5' }],
        '2xl': ['1.5rem', { lineHeight: '1.4' }],
        '3xl': ['1.875rem', { lineHeight: '1.3' }],
        '4xl': ['2.25rem', { lineHeight: '1.2' }],
      },
      // Focus ring utilities for keyboard navigation
      ringWidth: {
        3: '3px',
      },
      ringColor: {
        focus: '#0ea5e9', // primary-500
      },
      // Spacing scale following 8px grid
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      // Screen reader only utility
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [
    // Plugin to add focus-visible styles
    function({ addUtilities }) {
      addUtilities({
        '.focus-ring': {
          '&:focus-visible': {
            outline: 'none',
            'box-shadow': '0 0 0 3px rgb(14 165 233 / 0.5)',
            'border-radius': '0.375rem',
          },
        },
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          'white-space': 'nowrap',
          'border-width': '0',
        },
        '.not-sr-only': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: '0',
          margin: '0',
          overflow: 'visible',
          clip: 'auto',
          'white-space': 'normal',
        },
      });
    },
  ],
};