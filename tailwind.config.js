/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0b2240',       // Dark navy primary / euprava header
          dark: '#081729',       // Deepest navy for text & contrast
          primary: '#004b87',    // Official Serbian e-government royal blue
          accent: '#0062b1',     // Hover / focus royal blue
          vibrant: '#0284c7',    // Sky vibrant highlight
          light: '#f0f6fc',      // Soft ice-blue background
          surface: '#ffffff',    // Crisp white card surface
          border: '#dbeafe',     // Subtle border
          muted: '#64748b',      // Subtitle text
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
