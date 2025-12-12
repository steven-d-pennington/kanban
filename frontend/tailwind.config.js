/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Accessible color combinations with proper contrast ratios
        'accessible-primary': {
          'text': '#1a1a1a',
          'bg': '#ffffff',
          'border': '#e5e7eb',
          'hover': '#f9fafb',
          'active': '#f3f4f6',
        },
        'accessible-secondary': {
          'text': '#ffffff',
          'bg': '#374151',
          'border': '#4b5563',
          'hover': '#4b5563',
          'active': '#6b7280',
        },
        'accessible-tertiary': {
          'text': '#374151',
          'bg': '#f9fafb',
          'border': '#d1d5db',
          'hover': '#f3f4f6',
          'active': '#e5e7eb',
        },
        'accessible-neutral': {
          'text': '#1f2937',
          'bg': '#f3f4f6',
          'border': '#d1d5db',
          'hover': '#e5e7eb',
          'active': '#d1d5db',
        },
        'accessible-brand': {
          'text': '#ffffff',
          'bg': '#2563eb',
          'border': '#3b82f6',
          'hover': '#1d4ed8',
          'active': '#1e40af',
        },
        'accessible-success': {
          'text': '#065f46',
          'bg': '#d1fae5',
          'border': '#34d399',
          'hover': '#a7f3d0',
          'active': '#6ee7b7',
        },
        'accessible-warning': {
          'text': '#92400e',
          'bg': '#fef3c7',
          'border': '#fbbf24',
          'hover': '#fde68a',
          'active': '#fcd34d',
        },
        'accessible-error': {
          'text': '#991b1b',
          'bg': '#fecaca',
          'border': '#f87171',
          'hover': '#fca5a5',
          'active': '#ef4444',
        },
        'accessible-info': {
          'text': '#1e40af',
          'bg': '#dbeafe',
          'border': '#60a5fa',
          'hover': '#bfdbfe',
          'active': '#93c5fd',
        },
        
        // Dark mode accessible combinations
        'accessible-dark-primary': {
          'text': '#f9fafb',
          'bg': '#111827',
          'border': '#374151',
          'hover': '#1f2937',
          'active': '#374151',
        },
        'accessible-dark-secondary': {
          'text': '#111827',
          'bg': '#e5e7eb',
          'border': '#9ca3af',
          'hover': '#d1d5db',
          'active': '#9ca3af',
        },
        'accessible-dark-tertiary': {
          'text': '#e5e7eb',
          'bg': '#1f2937',
          'border': '#4b5563',
          'hover': '#374151',
          'active': '#4b5563',
        },
        'accessible-dark-neutral': {
          'text': '#f3f4f6',
          'bg': '#374151',
          'border': '#4b5563',
          'hover': '#4b5563',
          'active': '#6b7280',
        },
        'accessible-dark-brand': {
          'text': '#ffffff',
          'bg': '#3b82f6',
          'border': '#60a5fa',
          'hover': '#2563eb',
          'active': '#1d4ed8',
        },
        'accessible-dark-success': {
          'text': '#6ee7b7',
          'bg': '#064e3b',
          'border': '#10b981',
          'hover': '#047857',
          'active': '#059669',
        },
        'accessible-dark-warning': {
          'text': '#fcd34d',
          'bg': '#78350f',
          'border': '#f59e0b',
          'hover': '#92400e',
          'active': '#b45309',
        },
        'accessible-dark-error': {
          'text': '#fca5a5',
          'bg': '#7f1d1d',
          'border': '#dc2626',
          'hover': '#991b1b',
          'active': '#b91c1c',
        },
        'accessible-dark-info': {
          'text': '#93c5fd',
          'bg': '#1e3a8a',
          'border': '#3b82f6',
          'hover': '#1e40af',
          'active': '#1d4ed8',
        },
        
        // Link colors with proper contrast
        'accessible-links': {
          'default': '#2563eb',
          'hover': '#1d4ed8',
          'visited': '#7c3aed',
          'active': '#1e40af',
          'focus': '#2563eb',
        },
        'accessible-dark-links': {
          'default': '#60a5fa',
          'hover': '#3b82f6',
          'visited': '#a78bfa',
          'active': '#2563eb',
          'focus': '#60a5fa',
        },
        
        // Text color variants
        'text-accessible': {
          'primary': '#111827',
          'secondary': '#374151',
          'tertiary': '#6b7280',
          'muted': '#9ca3af',
          'inverse': '#ffffff',
        },
        'text-accessible-dark': {
          'primary': '#f9fafb',
          'secondary': '#e5e7eb',
          'tertiary': '#d1d5db',
          'muted': '#9ca3af',
          'inverse': '#111827',
        },
        
        // Background color variants
        'bg-accessible': {
          'primary': '#ffffff',
          'secondary': '#f9fafb',
          'tertiary': '#f3f4f6',
          'muted': '#e5e7eb',
          'overlay': 'rgba(0, 0, 0, 0.5)',
        },
        'bg-accessible-dark': {
          'primary': '#111827',
          'secondary': '#1f2937',
          'tertiary': '#374151',
          'muted': '#4b5563',
          'overlay': 'rgba(255, 255, 255, 0.1)',
        },
      },
      
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Consolas',
          'Monaco',
          'Courier New',
          'monospace',
        ],
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.6', letterSpacing: '0.025em' }],
        'lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0.025em' }],
        'xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '0.025em' }],
        '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '0.025em' }],
        '4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '0.025em' }],
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '120': '30rem',
      },
      
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        DEFAULT: '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      
      boxShadow: {
        'focus-accessible': '0 0 0 3px rgb(37 99 235 / 0.5)',
        'focus-accessible-dark': '0 0 0 3px rgb(96 165 250 / 0.5)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
        'elevation-1': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'elevation-2': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'elevation-3': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    function({ addUtilities, addComponents, theme }) {
      // Accessible color combination utilities
      addUtilities({
        '.theme-primary': {
          'color': theme('colors.accessible-primary.text'),
          'background-color': theme('colors.accessible-primary.bg'),
          'border-color': theme('colors.accessible-primary.border'),
        },
        '.theme-secondary': {
          'color': theme('colors.accessible-secondary.text'),
          'background-color': theme('colors.accessible-secondary.bg'),
          'border-color': theme('colors.accessible-secondary.border'),
        },
        '.theme-tertiary': {
          'color': theme('colors.accessible-tertiary.text'),
          'background-color': theme('colors.accessible-tertiary.bg'),
          'border-color': theme('colors.accessible-tertiary.border'),
        },
        '.theme-brand': {
          'color': theme('colors.accessible-brand.text'),
          'background-color': theme('colors.accessible-brand.bg'),
          'border-color': theme('colors.accessible-brand.border'),
        },
        '.theme-success': {
          'color': theme('colors.accessible-success.text'),
          'background-color': theme('colors.accessible-success.bg'),
          'border-color': theme('colors.accessible-success.border'),
        },
        '.theme-warning': {
          'color': theme('colors.accessible-warning.text'),
          'background-color': theme('colors.accessible-warning.bg'),
          'border-color': theme('colors.accessible-warning.border'),
        },
        '.theme-error': {
          'color': theme('colors.accessible-error.text'),
          'background-color': theme('colors.accessible-error.bg'),
          'border-color': theme('colors.accessible-error.border'),
        },
        '.theme-info': {
          'color': theme('colors.accessible-info.text'),
          'background-color': theme('colors.accessible-info.bg'),
          'border-color': theme('colors.accessible-info.border'),
        },
        '.link-accessible': {
          'color': theme('colors.accessible-links.default'),
          'text-decoration': 'underline',
          'text-underline-offset': '2px',
          '&:hover': {
            'color': theme('colors.accessible-links.hover'),
          },
          '&:visited': {
            'color': theme('colors.accessible-links.visited'),
          },
          '&:active': {
            'color': theme('colors.accessible-links.active'),
          },
          '&:focus': {
            'outline': `2px solid ${theme('colors.accessible-links.focus')}`,
            'outline-offset': '2px',
          },
        },
      });
      
      // Accessible component utilities
      addComponents({
        '.btn-accessible': {
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'padding': '0.75rem 1.5rem',
          'font-size': '0.875rem',
          'font-weight': '500',
          'line-height': '1.25',
          'border-radius': theme('borderRadius.md'),
          'border': '1px solid transparent',
          'cursor': 'pointer',
          'transition': 'all 0.2s ease-in-out',
          'min-height': '44px',
          'min-width': '44px',
          'text-decoration': 'none',
          '&:focus-visible': {
            'outline': `2px solid ${theme('colors.accessible-links.focus')}`,
            'outline-offset': '2px',
          },
          '&:disabled': {
            'opacity': '0.6',
            'cursor': 'not-allowed',
            'pointer-events': 'none',
          },
        },
        '.btn-primary': {
          'color': theme('colors.accessible-brand.text'),
          'background-color': theme('colors.accessible-brand.bg'),
          'border-color': theme('colors.accessible-brand.border'),
          '&:hover': {
            'background-color': theme('colors.accessible-brand.hover'),
          },
          '&:active': {
            'background-color': theme('colors.accessible-brand.active'),
          },
        },
        '.btn-secondary': {
          'color': theme('colors.accessible-secondary.text'),
          'background-color': theme('colors.accessible-secondary.bg'),
          'border-color': theme('colors.accessible-secondary.border'),
          '&:hover': {
            'background-color': theme('colors.accessible-secondary.hover'),
          },
          '&:active': {
            'background-color': theme('colors.accessible-secondary.active'),
          },
        },
        '.btn-outline': {
          'color': theme('colors.accessible-brand.bg'),
          'background-color': 'transparent',
          'border-color': theme('colors.accessible-brand.bg'),
          '&:hover': {
            'color': theme('colors.accessible-brand.text'),
            'background-color': theme('colors.accessible-brand.bg'),
          },
        },
        '.card-accessible': {
          'background-color': theme('colors.bg-accessible.primary'),
          'border': `1px solid ${theme('colors.accessible-primary.border')}`,
          'border-radius': theme('borderRadius.lg'),
          'box-shadow': theme('boxShadow.card'),
          'padding': '1.5rem',
          'transition': 'all 0.2s ease-in-out',
          '&:hover': {
            'box-shadow': theme('boxShadow.card-hover'),
          },
        },
        '.input-accessible': {
          'display': 'block',
          'width': '100%',
          'padding': '0.75rem',
          'font-size': '1rem',
          'line-height': '1.5',
          'color': theme('colors.text-accessible.primary'),
          'background-color': theme('colors.bg-accessible.primary'),
          'border': `1px solid ${theme('colors.accessible-primary.border')}`,
          'border-radius': theme('borderRadius.md'),
          'min-height': '44px',
          'transition': 'all 0.2s ease-in-out',
          '&:focus': {
            'outline': `2px solid ${theme('colors.accessible-links.focus')}`,
            'outline-offset': '-2px',
            'border-color': theme('colors.accessible-links.focus'),
          },
          '&::placeholder': {
            'color': theme('colors.text-accessible.muted'),
          },
          '&:disabled': {
            'opacity': '0.6',
            'cursor': 'not-allowed',
            'background-color': theme('colors.bg-accessible.muted'),
          },
        },
      });
    },
  ],
  darkMode: 'class',
};