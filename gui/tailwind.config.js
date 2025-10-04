/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          50: '#3a3a3a',
          100: '#2a2a2a',
          200: '#1a1a1a',
          300: '#0a0a0a',
          400: '#050505',
        },
        neon: {
          cyan: '#00ffff',
          blue: '#00bfff',
          purple: '#bf00ff',
        }
      },
      borderRadius: {
        'widget': '12px',
      },
      backdropBlur: {
        'glass': '10px',
      }
    },
  },
  plugins: [],
}
