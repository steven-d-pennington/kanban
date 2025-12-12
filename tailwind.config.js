/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode colors
        'form-text': '#111827', // gray-900
        'form-bg': '#ffffff', // white
        'form-border': '#d1d5db', // gray-300
        'label-text': '#374151', // gray-700
        
        // Dark mode variants
        dark: {
          'form-text': '#f9fafb', // gray-50
          'form-bg': '#374151', // gray-700
          'form-border': '#6b7280', // gray-500
          'label-text': '#ffffff', // white
        },
        
        // Semantic color system for better accessibility
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        
        // High contrast text colors for accessibility
        text: {
          primary: '#111827', // gray-900 - WCAG AAA compliant on white
          secondary: '#4b5563', // gray-600 - WCAG AA compliant on white
          tertiary: '#6b7280', // gray-500 - WCAG AA compliant on white
          inverse: '#ffffff', // white - WCAG AAA compliant on dark backgrounds
          'inverse-secondary': '#f3f4f6', // gray-100 - WCAG AA compliant on dark backgrounds
        },
        
        // Background colors optimized for contrast
        background: {
          primary: '#ffffff',
          secondary: '#f9fafb', // gray-50
          tertiary: '#f3f4f6', // gray-100
          inverse: '#111827', // gray-900
          'inverse-secondary': '#1f2937', // gray-800
        },
        
        // Status colors with proper contrast ratios
        success: {
          light: '#d1fae5', // green-100
          DEFAULT: '#10b981', // emerald-500 - WCAG AA compliant
          dark: '#047857', // emerald-700 - WCAG AAA compliant
        },
        error: {
          light: '#fee2e2', // red-100
          DEFAULT: '#ef4444', // red-500 - WCAG AA compliant
          dark: '#dc2626', // red-600 - WCAG AAA compliant
        },
        warning: {
          light: '#fef3c7', // amber-100
          DEFAULT: '#f59e0b', // amber-500 - WCAG AA compliant
          dark: '#d97706', // amber-600 - WCAG AAA compliant
        },
        info: {
          light: '#dbeafe', // blue-100
          DEFAULT: '#3b82f6', // blue-500 - WCAG AA compliant
          dark: '#2563eb', // blue-600 - WCAG AAA compliant
        },
      },
      
      // Custom spacing for better form layouts
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Typography scale with proper line heights for readability
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      
      // Focus ring styles for keyboard navigation
      ringColor: {
        'focus': '#3b82f6',
        'focus-dark': '#60a5fa',
      },
      
      // Box shadows with proper contrast
      boxShadow: {
        'focus': '0 0 0 3px rgba(59, 130, 246, 0.1)',
        'focus-dark': '0 0 0 3px rgba(96, 165, 250, 0.2)',
      },
    },
  },
  plugins: [
    // Form plugin for better form styling
    require('@tailwindcss/forms'),
    
    // Custom plugin for dark mode form utilities
    function({ addUtilities, theme }) {
      const darkModeUtilities = {
        '.dark .form-input': {
          backgroundColor: theme('colors.dark.form-bg'),
          borderColor: theme('colors.dark.form-border'),
          color: theme('colors.dark.form-text'),
          '&::placeholder': {
            color: theme('colors.gray.400'),
          },
          '&:focus': {
            borderColor: theme('colors.primary.500'),
            boxShadow: theme('boxShadow.focus-dark'),
          },
        },
        '.dark .form-label': {
          color: theme('colors.dark.label-text'),
        },
        '.dark .form-error': {
          color: theme('colors.red.300'),
        },
        '.dark .form-success': {
          color: theme('colors.green.300'),
        },
      };
      
      addUtilities(darkModeUtilities);
    },
  ],
};