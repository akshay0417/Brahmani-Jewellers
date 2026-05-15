/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: '#3D2B1F',
        cream: {
          DEFAULT: '#FFF6E6',
          alt: '#FCF0DA',
        },
        ochre: '#EBA938',
        gold: {
          light: '#F3E5AB',
          DEFAULT: '#D4AF37',
          dark: '#B8860B',
        },
        maroon: {
          light: '#5D1414',
          DEFAULT: '#3B0A0A',
          dark: '#2A0707',
        },
        royalBlack: '#0A0A0A',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
