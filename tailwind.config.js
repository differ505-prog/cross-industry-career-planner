/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        oat: "#f5f0e8",
        mist: "#ece5dc",
        ink: "#2f312d",
        stone: "#7f8078",
        sage: {
          50: "#f1f4ef",
          100: "#dce5d8",
          200: "#bed0b8",
          300: "#9ab095",
          400: "#7f997b",
          500: "#627c5f",
          600: "#4e624b",
        },
        dusty: {
          50: "#f1f4f7",
          100: "#d8e1ea",
          200: "#b9c9d9",
          300: "#92adc3",
          400: "#7894ac",
          500: "#607c93",
          600: "#4a6277",
        },
        terracotta: {
          50: "#f8f2ef",
          100: "#eddcd4",
          200: "#dfbfb1",
          300: "#cb9a85",
          400: "#bc7f67",
          500: "#9f634c",
          600: "#80503d",
        },
        slate: {
          50: "#f1f3f6",
          100: "#dde2ea",
          200: "#c0c9d8",
          300: "#9aa7bd",
          400: "#7c8ca7",
          500: "#5e7290",
          600: "#475a76",
        },
      },
      borderRadius: {
        soft: "12px",
        shell: "28px",
      },
      boxShadow: {
        soft: "0 16px 40px rgba(84, 79, 69, 0.08)",
        float: "0 24px 60px rgba(87, 89, 85, 0.12)",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans TC", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
