import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    screens: {
      sm: '640px',   // Mobile breakpoint
      md: '768px',   // Tablet breakpoint
      lg: '1024px',  // Desktop breakpoint
      xl: '1280px',  // Wide desktop
      '2xl': '1440px', // Max content width container
    },
    extend: {
      colors: {
        burgundy: {
          DEFAULT: '#6B1838', // Primary Burgundy
          deep: '#3B1025',    // Deep Burgundy
          dark: '#2A0B1A',
        },
        rose: {
          DEFAULT: '#D98CA5', // Petal Rose
          soft: '#F5E7EC',    // Soft Rose
          subtle: '#FAF0F3',
        },
        sand: {
          DEFAULT: '#E9DDCA', // Moroccan Sand
          border: '#E2D3BE',  // Sand Border
          light: '#F4EEE4',
        },
        charcoal: {
          DEFAULT: '#292329', // Deep Charcoal Mauve
          muted: '#635963',
          light: '#9E949E',
        },
        canvas: {
          DEFAULT: '#FAF7F2', // Warm Canvas
          pure: '#FFFFFF',    // White
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      letterSpacing: {
        editorial: '0.14em',
        wide: '0.18em',
        widest: '0.2em',
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '2px',
        md: '4px',
        lg: '6px',
        full: '9999px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(41, 35, 41, 0.05)',
        card: '0 2px 6px rgba(41, 35, 41, 0.06)',
        dropdown: '0 4px 12px rgba(41, 35, 41, 0.08)',
      },
      maxWidth: {
        editorial: '1440px',
      },
    },
  },
  plugins: [],
};

export default config;
