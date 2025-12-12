/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // WCAG AA compliant color combinations
        accessible: {
          // High contrast combinations (WCAG AAA - 7:1 ratio)
          'text-primary': '#000000',
          'text-secondary': '#2d3748',
          'text-muted': '#4a5568',
          'bg-primary': '#ffffff',
          'bg-secondary': '#f7fafc',
          'bg-muted': '#edf2f7',
          
          // Interactive elements with proper contrast
          'link-default': '#2b6cb0',
          'link-hover': '#2c5282',
          'link-visited': '#553c9a',
          'link-active': '#1a365d',
          
          // Status colors with accessible contrast
          'success-text': '#22543d',
          'success-bg': '#f0fff4',
          'success-border': '#9ae6b4',
          
          'warning-text': '#744210',
          'warning-bg': '#fffbeb',
          'warning-border': '#f6d55c',
          
          'error-text': '#742a2a',
          'error-bg': '#fed7d7',
          'error-border': '#fc8181',
          
          'info-text': '#2a69ac',
          'info-bg': '#ebf8ff',
          'info-border': '#90cdf4',
          
          // Focus and interaction states
          'focus-ring': '#3182ce',
          'focus-bg': '#bee3f8',
          'hover-overlay': 'rgba(0, 0, 0, 0.05)',
          'active-overlay': 'rgba(0, 0, 0, 0.1)',
        },
        
        // Dark mode accessible colors
        'accessible-dark': {
          'text-primary': '#ffffff',
          'text-secondary': '#e2e8f0',
          'text-muted': '#cbd5e0',
          'bg-primary': '#1a202c',
          'bg-secondary': '#2d3748',
          'bg-muted': '#4a5568',
          
          'link-default': '#63b3ed',
          'link-hover': '#90cdf4',
          'link-visited': '#b794f6',
          'link-active': '#bee3f8',
          
          'success-text': '#9ae6b4',
          'success-bg': '#22543d',
          'success-border': '#38a169',
          
          'warning-text': '#f6d55c',
          'warning-bg': '#744210',
          'warning-border': '#d69e2e',
          
          'error-text': '#feb2b2',
          'error-bg': '#742a2a',
          'error-border': '#e53e3e',
          
          'info-text': '#90cdf4',
          'info-bg': '#2a69ac',
          'info-border': '#4299e1',
          
          'focus-ring': '#63b3ed',
          'focus-bg': '#2c5282',
          'hover-overlay': 'rgba(255, 255, 255, 0.05)',
          'active-overlay': 'rgba(255, 255, 255, 0.1)',
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
        'accessible-focus': '0 0 0 3px var(--color-accessible-focus-ring)',
        'accessible-focus-dark': '0 0 0 3px var(--color-accessible-dark-focus-ring)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
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
      },
    },
  },
  plugins: [
    function({ addUtilities, addComponents, theme }) {
      // Accessible text/background combinations
      addUtilities({
        '.text-accessible-primary': {
          'color': 'var(--color-accessible-text-primary)',
          'background-color': 'var(--color-accessible-bg-primary)',
        },
        '.text-accessible-secondary': {
          'color': 'var(--color-accessible-text-secondary)',
          'background-color': 'var(--color-accessible-bg-secondary)',
        },
        '.text-accessible-muted': {
          'color': 'var(--color-accessible-text-muted)',
          'background-color': 'var(--color-accessible-bg-muted)',
        },
        '.link-accessible': {
          'color': 'var(--color-accessible-link-default)',
          'text-decoration': 'underline',
          'text-underline-offset': '2px',
          '&:hover': {
            'color': 'var(--color-accessible-link-hover)',
          },
          '&:visited': {
            'color': 'var(--color-accessible-link-visited)',
          },
          '&:active': {
            'color': 'var(--color-accessible-link-active)',
          },
        },
      });
      
      // Accessible focus states
      addComponents({
        '.focus-accessible': {
          '&:focus-visible': {
            'outline': '2px solid var(--color-accessible-focus-ring)',
            'outline-offset': '2px',
            'box-shadow': 'var(--shadow-accessible-focus)',
          },
        },
        '.btn-accessible': {
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'padding': '0.5rem 1rem',
          'font-size': '0.875rem',
          'font-weight': '500',
          'line-height': '1.5',
          'border-radius': '0.375rem',
          'border': '1px solid transparent',
          'cursor': 'pointer',
          'transition': 'all 0.2s ease-in-out',
          'min-height': '44px',
          'min-width': '44px',
          '&:focus-visible': {
            'outline': '2px solid var(--color-accessible-focus-ring)',
            'outline-offset': '2px',
          },
          '&:disabled': {
            'opacity': '0.6',
            'cursor': 'not-allowed',
          },
        },
        '.status-success': {
          'color': 'var(--color-accessible-success-text)',
          'background-color': 'var(--color-accessible-success-bg)',
          'border-color': 'var(--color-accessible-success-border)',
        },
        '.status-warning': {
          'color': 'var(--color-accessible-warning-text)',
          'background-color': 'var(--color-accessible-warning-bg)',
          'border-color': 'var(--color-accessible-warning-border)',
        },
        '.status-error': {
          'color': 'var(--color-accessible-error-text)',
          'background-color': 'var(--color-accessible-error-bg)',
          'border-color': 'var(--color-accessible-error-border)',
        },
        '.status-info': {
          'color': 'var(--color-accessible-info-text)',
          'background-color': 'var(--color-accessible-info-bg)',
          'border-color': 'var(--color-accessible-info-border)',
        },
      });
    },
  ],
  darkMode: 'class',
};