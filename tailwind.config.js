/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic tokens driven by CSS variables (see index.css) so
        // Light / Dark / System themes (FR-4.2) share one palette source.
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        brand: 'rgb(var(--brand) / <alpha-value>)',
        'brand-strong': 'rgb(var(--brand-strong) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['system-ui', '"Segoe UI"', '"Noto Sans Thai"', '"Sarabun"', 'sans-serif'],
      },
      keyframes: {
        'card-flip': {
          '0%': { transform: 'rotateY(90deg) scale(0.9)', opacity: '0' },
          '100%': { transform: 'rotateY(0deg) scale(1)', opacity: '1' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'card-flip': 'card-flip 0.45s ease-out',
        'pop-in': 'pop-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
