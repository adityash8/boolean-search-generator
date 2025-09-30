/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jbBg: "#0A0B0E",
        jbBlue: "#00F0FF", 
        jbGreen: "#00FF85",
        jbGray: "#E5E7EB",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
}