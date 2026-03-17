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
        navy: {
          DEFAULT: '#0A1F44',
          dark: '#071630',
          light: '#0D2B5C',
        },
        skyblue: {
          DEFAULT: '#87CEEB',
          light: '#B0E0F6',
          dark: '#5FB3D9',
        },
        warm: {
          orange: '#F59E0B',
          coral: '#FB7185',
          gold: '#FBBF24',
          peach: '#FDBA74',
        },
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
export default config
