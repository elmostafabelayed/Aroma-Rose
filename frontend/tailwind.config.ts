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
          DEFAULT: '#783747', // Primary Burgundy Rose
          deep: '#4F232D',    // Deep Botanical Wine
          dark: '#382D2B',    // Dark Soil
          hover: '#612B38',
        },
        rose: {
          DEFAULT: '#C9828D', // Dusty Rose
          soft: '#F3E1E4',    // Soft Rose Wash
          subtle: '#F8EFF1',
        },
        sand: {
          DEFAULT: '#D9C3AE', // Natural Beige
          border: '#D9C3AE',  // Natural Beige Border
          light: '#EFE4D6',
        },
        sage: {
          DEFAULT: '#75816B', // Sage Green (Botanical Indicators)
          soft: '#EDF1EA',    // Soft Sage Wash
          border: '#C4CEBD',
          dark: '#4F5946',
        },
        charcoal: {
          DEFAULT: '#382D2B', // Dark Brown (High-Contrast Earthy Text)
          muted: '#685956',
          light: '#9C8C89',
        },
        canvas: {
          DEFAULT: '#F8F2EE', // Warm Cream (Main Canvas Background)
          pure: '#FFFFFF',    // White
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"Amiri"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Tajawal"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
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
        subtle: '0 1px 3px rgba(56, 45, 43, 0.05)',
        card: '0 2px 8px rgba(56, 45, 43, 0.06)',
        dropdown: '0 4px 16px rgba(56, 45, 43, 0.08)',
        rose: '0 4px 16px rgba(120, 55, 71, 0.16)',
      },
      maxWidth: {
        editorial: '1440px',
      },
    },
  },
  plugins: [],
};

export default config;
