/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "audit-bg": "#0f172a" /* slate-900 */,
        "audit-surface": "#1e293b" /* slate-800 */,
        "audit-accent": "#0ea5e9" /* sky-500 */,
        "audit-critical": "#ef4444" /* red-500 */,
        "audit-high": "#f97316" /* orange-500 */,
        "audit-medium": "#eab308" /* yellow-500 */,
        "audit-low": "#22c55e" /* green-500 */,
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
