/** @type {import('tailwindcss').Config} */
module.exports = {
  // No dark mode — warm light-only palette per NirmalMandi design system
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── NirmalMandi design tokens ───────────────────────────────────────
        ink:   '#281f12',
        paper: '#fbf5ea',
        card:  '#fffdf8',
        panel: '#f6efe1',
        muted: '#7a6f5d',
        faint: '#a89c87',
        line: {
          DEFAULT: '#ece1cd',
          soft:    '#f2ebdc',
        },
        green: {
          DEFAULT: '#1f6b3a',
          light:   '#2f8049',
          deep:    '#14492a',
          soft:    '#e9f4ec',
        },
        gold: {
          DEFAULT: '#ef8a17',
          light:   '#f4a82a',
          soft:    '#fdeccc',
          line:    '#f0dcb0',
          ink:     '#a9690a',
        },
        info: {
          DEFAULT: '#1f6b8a',
          soft:    '#e6f2f6',
        },
        danger: {
          DEFAULT: '#b6442a',
          soft:    '#fbe7e2',
        },

        // ── Legacy aliases (for components not yet migrated) ─────────────────
        'nm-primary':      '#1f6b3a',
        'nm-primary-pale': '#e9f4ec',
        'nm-primary-light':'#2f8049',
        'nm-primary-dark': '#14492a',
        'nm-success':      '#1f6b3a',
        'nm-warning':      '#a9690a',
        'nm-danger':       '#b6442a',
        'nm-surface':      '#fffdf8',
        'nm-bg':           '#fbf5ea',
        'nm-border':       '#ece1cd',
        'nm-text': {
          DEFAULT: '#281f12',
          muted:   '#7a6f5d',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        sans:    ['"Hanken Grotesk"', 'sans-serif'],
      },
      borderRadius: {
        btn:     '12px',
        card:    '18px',
        feature: '22px',
      },
      boxShadow: {
        lift:  '0 16px 40px rgba(40,31,18,.12)',
        modal: '0 30px 80px rgba(0,0,0,.3)',
        'nm-card': '0 1px 3px rgba(40,31,18,.06)',
      },
      letterSpacing: {
        display: '-0.015em',
        tight2:  '-0.02em',
      },
    },
  },
  plugins: [],
};
