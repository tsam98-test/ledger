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
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)',    'sans-serif'],
        mono:    ['var(--font-mono)',    'monospace'],
      },
      colors: {
        /* Deep space navy palette */
        void: {
          50:  '#eef0f7',
          100: '#d5d9ee',
          200: '#aab3dc',
          300: '#7a8ac8',
          400: '#5460b3',
          500: '#3a409e',
          600: '#2d3280',
          700: '#1e2260',
          800: '#111440',
          900: '#080a26',
          950: '#020509',
        },
        /* Indigo brand */
        indigo: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        /* Cyan highlight */
        cyan: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        /* Semantic greens */
        jade: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        /* Rose danger */
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        /* Amber / gold for budget warnings */
        amber: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      animation: {
        'fade-in':       'fadeIn 0.4s ease-out forwards',
        'slide-up':      'slideUp 0.4s ease-out forwards',
        'slide-in-right':'slideInRight 0.3s ease-out forwards',
        'scale-in':      'scaleIn 0.2s ease-out forwards',
        shimmer:         'shimmer 2s linear infinite',
        'pulse-glow':    'pulseGlow 3.5s ease-in-out infinite',
        'orb-drift':     'orbDrift ease-in-out infinite',
        'gem-pulse':     'gemPulse 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:       { '0%': { opacity: '0' },                               '100%': { opacity: '1' } },
        slideUp:      { '0%': { opacity: '0', transform: 'translateY(16px)' },'100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(16px)' },'100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:      { '0%': { opacity: '0', transform: 'scale(0.95)' },     '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer:      { '0%': { backgroundPosition: '-1000px 0' },            '100%': { backgroundPosition: '1000px 0' } },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 4px 16px rgba(99,102,241,0.4)' },
          '50%':     { boxShadow: '0 8px 40px rgba(99,102,241,0.65), 0 0 80px rgba(99,102,241,0.2)' },
        },
        orbDrift: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%':     { transform: 'translate(30px,-20px) scale(1.03)' },
          '66%':     { transform: 'translate(-20px,28px) scale(0.97)' },
        },
        gemPulse: {
          '0%,100%': { boxShadow: '0 0 24px rgba(99,102,241,0.40), 0 0 48px rgba(34,211,238,0.12)' },
          '50%':     { boxShadow: '0 0 36px rgba(99,102,241,0.60), 0 0 80px rgba(34,211,238,0.22)' },
        },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        /* Indigo glows */
        glow:        '0 0 24px rgba(99,102,241,0.20)',
        'glow-lg':   '0 0 48px rgba(99,102,241,0.25), 0 0 80px rgba(99,102,241,0.10)',
        'glow-cyan': '0 0 30px rgba(34,211,238,0.20)',
        /* Card shadows */
        card:        '0 2px 0 rgba(255,255,255,0.03) inset, 0 4px 24px rgba(0,0,0,0.50)',
        'card-hover':'0 2px 0 rgba(255,255,255,0.03) inset, 0 8px 40px rgba(0,0,0,0.55), 0 0 40px rgba(99,102,241,0.08)',
        /* Button */
        btn:         '0 4px 16px rgba(99,102,241,0.40)',
        'btn-hover':  '0 6px 28px rgba(99,102,241,0.58)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '22px',
        '4xl': '32px',
      },
    },
  },
  plugins: [],
}
