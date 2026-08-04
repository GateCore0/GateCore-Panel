/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gate: {
          orange: '#FF6B00',
          purple: '#7C3AED',
          darkBg: '#0F172A',
          darkSidebar: '#1E293B',
          darkCard: '#1E293B',
        }
      }
    },
  },
  plugins: [],
}