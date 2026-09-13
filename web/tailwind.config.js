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
        obsidian: {
          950: '#060911',
          900: '#090d16',
          800: '#0f172a',
          700: '#131b2e',
          600: '#1e293b',
        },
        cyan: {
          glow: '#00f5ff',
          neon: '#06b6d4',
          deep: '#0284c7',
        },
        amber: {
          warning: '#f59e0b',
          urgent: '#ef4444',
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 24px -4px rgba(0, 245, 255, 0.25)',
        'glow-amber': '0 0 24px -4px rgba(245, 158, 11, 0.25)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
