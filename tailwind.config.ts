import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        'vote-icon-rotation': 'vote-icon-keyframes 0.8s steps(1) infinite',
      },
      keyframes: {
        'vote-icon-keyframes': {
          '0%' : { transform: 'translate(-50%,-50%) rotate(-15deg)' },
          '50%': { transform: 'translate(-50%,-50%) rotate(-30deg)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
