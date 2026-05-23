/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'eco-blue': '#1e3a8a',
        'eco-green': '#1b4332',
        'eco-yellow': '#453b0a',
        'eco-orange': '#5e330d',
      },
    },
  },
  plugins: [],
}
