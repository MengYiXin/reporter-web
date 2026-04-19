/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0f172a',
        card: '#1e293b',
        primary: '#334155',
        accent: '#ef4444',
        text: '#f1f5f9',
        muted: '#94a3b8',
      }
    },
  },
  plugins: [],
}
