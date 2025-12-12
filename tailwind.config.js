/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'form-text': '#1f2937',
        'form-bg': '#ffffff',
        'form-border': '#d1d5db',
        'form-placeholder': '#6b7280',
        'label-text': '#111827',
      },
    },
  },
  plugins: [],
};