/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        solana: {
          purple: '#9945FF',
          'purple-dark': '#7C3AED',
          black: '#121212',
          'black-light': '#1A1A1A',
          'black-lighter': '#232323',
          green: '#14F195',
          blue: '#00C2FF',
          indigo: '#4E44CE',
        },
      },
      backgroundColor: {
        primary: '#121212',
        secondary: '#1A1A1A',
        accent: '#9945FF',
      },
      textColor: {
        primary: '#FFFFFF',
        secondary: '#A1A1AA',
        accent: '#9945FF',
      },
    },
  },
  plugins: [],
};
