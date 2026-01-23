/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#0040d1",
        background: {
          DEFAULT: "#ffffff",
          dark: "#19191a",
        },
        foreground: {
          DEFAULT: "#000000",
          dark: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f5f5f5",
          dark: "#1f2937",
        },
      }
    },
  },
  plugins: [],
};