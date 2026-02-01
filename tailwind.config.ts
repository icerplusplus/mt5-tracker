import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Trading Platform Colors
        'bg-primary': '#000000',
        'bg-secondary': '#0A0A0A',
        'bg-tertiary': '#111111',
        'bg-hover': '#1A1A1A',
        'accent': {
          DEFAULT: '#FFC107',
          light: '#FFD54F',
        },
        'trade': {
          buy: '#26A69A',
          sell: '#EF5350',
          profit: '#4CAF50',
          loss: '#F44336',
        },
        'text': {
          primary: '#FFFFFF',
          secondary: '#9E9E9E',
          tertiary: '#616161',
        },
        'border': {
          primary: '#1F1F1F',
          secondary: '#2A2A2A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
