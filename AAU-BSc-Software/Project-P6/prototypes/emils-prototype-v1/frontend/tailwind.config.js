/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          900: '#0A0A0F', // Darker background
          800: '#141419', // Surface background
          700: '#1E1E24', // Card background
          600: '#28282F', // Hover states
          500: '#36363D', // Lighter elements
        },
        control: {
          500: '#48D597', // Main control color (green)
          400: '#67DBA8',
        },
        data: {
          500: '#9BA0EA', // Data display color (soft purple)
          400: '#B1B5EF',
        },
        alert: {
          500: '#F59E0B', // Warning amber
          400: '#FBBF24',
        },
        critical: {
          500: '#DC2626', // Critical red
          400: '#EF4444',
        },
        grid: {
          500: 'rgba(75, 85, 95, 0.1)', // Grid lines
          400: 'rgba(75, 85, 95, 0.15)',
        }
      },
      backgroundImage: {
        'tech-grid': `
          linear-gradient(to right, rgba(75, 85, 95, 0.1) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(75, 85, 95, 0.1) 1px, transparent 1px)
        `,
      },
      boxShadow: {
        'glow-green': '0 0 20px -3px rgba(72, 213, 151, 0.3)',
        'glow-red': '0 0 20px -3px rgba(220, 38, 38, 0.3)',
      },
    },
  },
  plugins: [],
}