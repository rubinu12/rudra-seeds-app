// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
      borderRadius: {
        'm3-xlarge': '1.75rem',
        'm3-large': '1rem',
        'm3-medium': '0.75rem',
        'm3-small': '0.5rem',
        'm3-full': '9999px',
      },
      boxShadow: {
        'm3-subtle': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'm3-active': '0 8px 16px -4px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
      },
      colors: {
        'primary': '#6750A4', 'on-primary': '#FFFFFF', 'primary-container': '#EADDFF', 'on-primary-container': '#21005D',
        'secondary': '#625B71', 'on-secondary': '#FFFFFF', 'secondary-container': '#E8DEF8', 'on-secondary-container': '#1D192B',
        'tertiary': '#7D5260', 'on-tertiary': '#FFFFFF', 'tertiary-container': '#FFD8E4', 'on-tertiary-container': '#31111D',
        'error': '#B3261E', 'on-error': '#FFFFFF', 'error-container': '#FFDAD6', 'on-error-container': '#410002',
        'background': '#FFFBFE', 'on-background': '#1C1B1F', 'surface': '#FFFBFE', 'on-surface': '#1C1B1F',
        'surface-variant': '#E7E0EC', 'on-surface-variant': '#49454F', 'outline': '#79747E',
      }
    },
  },
  plugins: [],
};
export default config;