/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pro: "#ff7300",
        "pro-hover": "#ffa655",
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      },
      keyframes: {
        ripple: {
          "0%": { transform: "scale(0)", opacity: "0.5" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        ripple: "ripple 0.6s linear",
        fadeInDown: "fadeInDown 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
