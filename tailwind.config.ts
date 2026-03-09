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
      },
    },
  },
  plugins: [],
}
export default config
