/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f172a',      // slate-900 - main background
          surface: '#1e293b',  // slate-800 - cards/containers
          border: '#334155',   // slate-700 - borders
          'border-light': '#475569', // slate-600 - lighter borders
          text: {
            primary: '#f1f5f9',   // slate-100 - primary text
            secondary: '#cbd5e1', // slate-300 - secondary text
            muted: '#94a3b8',     // slate-400 - muted text
          },
        },
        primary: {
          DEFAULT: '#3b82f6',  // blue-500
          hover: '#2563eb',     // blue-600
          light: '#60a5fa',     // blue-400
        },
        success: {
          DEFAULT: '#10b981',  // green-500
          hover: '#059669',     // green-600
          light: '#34d399',     // green-400
        },
        warning: {
          DEFAULT: '#f59e0b',  // amber-500
          hover: '#d97706',     // amber-600
          light: '#fbbf24',     // amber-400
        },
        error: {
          DEFAULT: '#ef4444',  // red-500
          hover: '#dc2626',     // red-600
          light: '#f87171',     // red-400
        },
      },
    },
  },
  plugins: [],
}

