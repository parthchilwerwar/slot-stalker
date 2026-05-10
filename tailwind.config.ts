import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#FC5019',
        'brand-dark': '#E8470F',
        'brand-tint': '#FFF1EC',
        ink: '#0A0A0A',
        surface: '#111111',
        'surface-2': '#1A1A1A',
        rim: '#242424',
        subtle: '#6B6B6B',
        faint: '#9A9A9A',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
