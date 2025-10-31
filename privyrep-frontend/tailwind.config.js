/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Override Tailwind's default blue with our Apple-inspired blue
        blue: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#b9e3fe',
          300: '#7ccbfd',
          400: '#36aafa',
          500: '#0c8ce9',
          600: '#0070c9', // Apple blue
          700: '#0159a3',
          800: '#064b86',
          900: '#0b3f6f',
          950: '#062850',
        },
        // Add cyan/teal for accent
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Add amber for reputation/success
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
    },
  },
  plugins: [],
}
