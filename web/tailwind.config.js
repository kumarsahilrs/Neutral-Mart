/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Buyer panel — blue
        'nm-primary': '#2563eb',
        'nm-primary-mid': '#3b82f6',
        'nm-primary-light': '#93c5fd',
        'nm-primary-pale': '#dbeafe',
        'nm-primary-dark': '#1d4ed8',

        // Seller panel — green
        'nm-seller': '#16a34a',
        'nm-seller-mid': '#22c55e',
        'nm-seller-light': '#86efac',
        'nm-seller-pale': '#dcfce7',
        'nm-seller-dark': '#15803d',

        // Semantic
        'nm-success': '#16a34a',
        'nm-warning': '#d97706',
        'nm-warning-dark': '#b45309',
        'nm-danger': '#dc2626',
        'nm-danger-dark': '#b91c1c',

        // Surfaces
        'nm-surface': { DEFAULT: '#ffffff', dark: '#1e293b' },
        'nm-bg': { DEFAULT: '#f8fafc', dark: '#0f172a' },
        'nm-border': { DEFAULT: '#e2e8f0', dark: '#334155' },
        'nm-text': {
          DEFAULT: '#0f172a',
          muted: '#64748b',
          dark: '#f1f5f9',
          'dark-muted': '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'nm-card': '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'nm-card-dark': '0 1px 3px 0 rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};
