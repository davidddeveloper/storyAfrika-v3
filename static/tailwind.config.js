/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['../templates/*.html', '../templates/**/*.html', './js/*.js'],
  theme: {
    extend: {
      fontFamily: {
        'comic': ['comic', 'sans-serif'],
        'comic-light': ['comic-light', 'sans-serif'],
        'comic-bold': ['comic-bold', 'sans-serif'],
        'sitka-small': ['sitka-small', 'serif'],
        'sitka-medium': ['sitka-medium', 'serif'],
        'sitka-large': ['sitka-large', 'serif'],
        'calibri-bold': ['calibri-bold', 'sans-serif'],
        'calibri-regular': ['calibri-regular', 'sans-serif'],
        'calibri-light': ['calibri-light', 'sans-serif'],
      },
      colors: {
        lightgray: '#4A4A4A',
        lightblue: '#2699eb',
        black: '#000',
        white: '#fff',
        offwhite: '#f5f5f5',
        mediumpurple: '#16101C',
        offset: '#D9D9D9',

        /* themes */
        sepia: '#f9f5e9',

        grey: '#e6e6e6',

        black: '#000',

        darkGrey: `#242424`,
        darkGrayForeground: '#b2b2b2'
      },
      screens: {
        'sm': '430px',
        'md': '720px',
        'lg': '960px',
        'xlg': '1280px'
      }
    },
  },
  plugins: [],
}

