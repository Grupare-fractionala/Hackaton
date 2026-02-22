/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfffb",
          100: "#c5fff2",
          200: "#8ff4e2",
          300: "#5ddfcf",
          400: "#22b8ad",
          500: "#0f8e87",
          600: "#0a6969",
          700: "#0d5457",
          800: "#133f42",
          900: "#153437",
        },
        sand: {
          50: "#fbf8f1",
          100: "#f5efe1",
          200: "#e8dbc0",
          300: "#dbc59b",
          400: "#cbac73",
          500: "#b88f4f",
        },
      },
      boxShadow: {
        soft: "0 10px 35px rgba(17, 24, 39, 0.08)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.4s ease-out both",
      },
      fontFamily: {
        title: ["Space Grotesk", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
