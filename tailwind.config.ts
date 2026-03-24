import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT: '#1A3C5E', 50: '#E8EEF4', 100: '#C5D5E5', 600: '#1A3C5E', 700: '#142E48', 800: '#0E2034' },
        teal:  { DEFAULT: '#0E7C7B', 50: '#E6F4F4', 100: '#B3DEDE', 500: '#0E7C7B', 600: '#0B6766', 700: '#094F4F' },
        gold:  { DEFAULT: '#D4A017', 50: '#FDF6E3', 400: '#E8B820', 500: '#D4A017', 600: '#B8880F' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
