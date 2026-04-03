/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cake: {
          black: '#0a0a0a',
          white: '#fafaf9',
          accent: '#e11d48',
          muted: '#78716c',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#fafaf9',
            a: {
              color: '#e11d48',
              '&:hover': {
                color: '#f43f5e',
              },
            },
          },
        },
      },
    },
  },
  plugins: [],
};

module.exports = config;
