/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        surface: "#F7F7F7",
        ink: "#111827",
        body: "#4B5563",
        muted: "#9CA3AF",
        border: "#E5E7EB",
        excellent: "#16A34A",
        good: "#2563EB",
        fair: "#D97706",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
