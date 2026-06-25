/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep emerald — freshness / trust
        brand:  { 950: '#06271B', 900: '#0A3D2A', 800: '#0F5132', 700: '#15613D', 600: '#1C7A4D', 500: '#2A9466', 400: '#46B07F', 300: '#7FCBA6' },
        // Soft mint canvas — light, fresh green (cream stays light enough to also work as text on dark)
        cream:  '#E9F6EF',
        beige:  '#CFEBDB',
        sand:   '#BCE2D0',
        // Warm copper — calls to action
        copper: { light: '#DD9050', DEFAULT: '#BE6E2A', dark: '#9A5318' },
        gold:   '#C9A14A',
        ink:    '#15241C',
        // Night surfaces for dark mode
        night:  { DEFAULT: '#080C0A', 900: '#080C0A', 800: '#121613', 700: '#1A201C', 600: '#232A26' },
      },
      fontFamily: {
        display: ['Cairo', 'system-ui', 'sans-serif'],
        body:    ['Tajawal', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 22px 50px -24px rgba(6,39,27,0.45)',
        soft: '0 10px 30px -16px rgba(6,39,27,0.30)',
        seal: '0 8px 20px -6px rgba(154,83,24,0.55)',
      },
      keyframes: {
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-9px)' } },
        drift:  { '0%': { transform: 'translate3d(0,0,0)' }, '100%': { transform: 'translate3d(-2%,-3%,0)' } },
      },
      animation: {
        floaty: 'floaty 4.5s ease-in-out infinite',
        drift:  'drift 14s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
};
