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
        'logout-icon-scale': 'logout-icon-keyframes 0.8s steps(2) infinite',
        'swipe-1': 'swipe-1-keyframes 3s infinite',
        'swipe-1-hand': 'swipe-1-hand-keyframes 3s infinite',
        'swipe-2': 'swipe-2-keyframes 3s infinite',
      },
      keyframes: {
        'vote-icon-keyframes': {
          '0%' : { transform: 'translate(-50%,-50%) rotate(-15deg)' },
          '50%': { transform: 'translate(-50%,-50%) rotate(-30deg)' },
        },
        'logout-icon-keyframes': {
          '0%' : { transform: 'translate(-10%,10%) rotate(0deg) scale(1.0)' },
          '30%': { transform: 'translate(20%,-10%) rotate(10deg) scale(80%)' },
          '70%': { transform: 'translate(40%,-20%) rotate(20deg) scale(60%)' },
        },
        'swipe-1-keyframes': {
          '0%,30%,100%' : { transform: 'translate(0%,-1rem)' },
          '50%,80%'     : { transform: 'translate(0%, 1rem)' },
        },
        'swipe-1-hand-keyframes': {
          '0%,30%,100%' : { transform: 'translate(0%,-1.3rem) rotate(90deg) scaleY(-100%)' },
          '50%,80%'     : { transform: 'translate(0%, 0.7rem) rotate(90deg) scaleY(-100%)' },
        },
        'swipe-2-keyframes': {
          '0%,30%,100%' : { transform: 'translate(0%, 1rem)' },
          '50%,80%'     : { transform: 'translate(0%,-1rem)' },
        },
      }
    },
  },
  plugins: [],
};
export default config;
