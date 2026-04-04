/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light
        'surface':     '#ffffff',
        'surface-2':   '#f8fafc',
        'surface-3':   '#f1f5f9',
        'border-soft': '#e2e8f0',
        'text-main':   '#0f172a',
        'text-sub':    '#64748b',
        'text-muted':  '#94a3b8',
      },
    },
  },
  plugins: [],
}