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
        'bathlance-orange': '#e1621c',
        'bathlance-cream': '#f7e0a4',
        'bathlance-brown': '#a56b2f',
        'bathlance-yellow': '#FFD93B',
        'bathlance-gray': '#dfdcd2',
      },
      fontFamily: {
        'gaegu': ['ChungbukNationalUniversity70thAnniversary', 'sans-serif'],
      },
      borderRadius: {
        'cute': '1.5rem',
      },
      boxShadow: {
        'cute': '0 4px 12px rgba(225, 98, 28, 0.15)',
        'cute-lg': '0 8px 24px rgba(225, 98, 28, 0.2)',
      },
    },
  },
  plugins: [],
};
export default config;

