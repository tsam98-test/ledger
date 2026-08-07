/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        obsidian: {
          50:  '#f5f5f0',
          100: '#e8e8e0',
          200: '#d0d0c0',
          300: '#b0b09a',
          400: '#888872',
          500: '#666650',
          600: '#4a4a38',
          700: '#333325',
          800: '#1e1e14',
          900: '#111108',
          950: '#0a0a05',
        },
        // Remapped to Spendora teal — updates ALL amber-* classes site-wide
        amber: {
          50:  '#f0fdf9',
          100: '#ccfdf5',
          200: '#99f6eb',
          300: '#5EEDD9',
          400: '#00D4AA',
          500: '#00B896',
          600: '#009e80',
          700: '#007a62',
          800: '#005a47',
          900: '#003d30',
        },
        jade: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        sky: {
          400: '#38bdf8',
          500: '#0ea5e9',
        },
        // New brand colors
        teal: {
          400: '#00D4AA',
          500: '#00B896',
        },
        brand: {
          blue:   '#3C6EE8',
          purple: '#823CE8',
        },
      },
      animation: {
        'fade-in':       'fadeIn 0.4s ease-out forwards',
        'slide-up':      'slideUp 0.4s ease-out forwards',
        'slide-in-right':'slideInRight 0.3s ease-out forwards',
        'scale-in':      'scaleIn 0.2s ease-out forwards',
        shimmer:         'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn:       { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:      { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(16px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:      { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer:      { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        glow:         '0 0 20px rgba(0, 212, 170, 0.15)',
        'glow-lg':    '0 0 40px rgba(0, 212, 170, 0.2)',
        'glow-blue':  '0 0 20px rgba(60, 110, 232, 0.15)',
        'glow-purple':'0 0 20px rgba(130, 60, 232, 0.15)',
        card:         '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
