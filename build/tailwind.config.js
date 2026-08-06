/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    '../public_html/**/*.php',
    '../app/**/*.php',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Heebo"', '"Arial Hebrew"', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: {
          DEFAULT: '#F6EFE3',
          dark: '#EFE3CD',
        },
        navy: {
          DEFAULT: '#122A4C',
          light: '#1D3E68',
          dark: '#0B1D36',
        },
        gold: {
          DEFAULT: '#C6A155',
          light: '#DDC28A',
          dark: '#A47F38',
        },
        ink: '#26313F',
      },
      boxShadow: {
        card: '0 2px 10px rgba(18, 42, 76, 0.06)',
        'card-lg': '0 8px 30px rgba(18, 42, 76, 0.10)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
