/**
 * Aroma Rose Official Brand Design System Tokens
 * Authoritative specification for Moroccan Botanical Luxury Skincare (Kelaat M'Gouna).
 */

export const BRAND_COLORS = {
  // Authoritative Aroma Rose Palette
  primaryBurgundyRose: '#783747', // Primary signature Burgundy Rose
  dustyRose: '#C9828D',           // Dusty Rose for subtle highlights & promotions
  warmCream: '#F8F2EE',           // Warm Cream for main organic canvas backgrounds
  naturalBeige: '#D9C3AE',        // Natural Beige for tactile apothecary borders & sand accents
  sageGreen: '#75816B',           // Sage Green for natural botanical & organic indicators
  darkBrown: '#382D2B',           // Dark Brown for high-contrast earthy text & ink
  white: '#FFFFFF',               // Crisp Pure White contrast

  // Legacy aliases for backward compatibility
  primaryBurgundy: '#783747',
  petalRose: '#C9828D',
  moroccanSand: '#D9C3AE',
  deepCharcoalMauve: '#382D2B',
  deepBurgundy: '#4F232D',
  warmCanvas: '#F8F2EE',
  softRose: '#F3E1E4',
  sandBorder: '#D9C3AE',
} as const;

export const TYPOGRAPHY = {
  fonts: {
    editorialSerif: '"Playfair Display", "Amiri", Georgia, serif',
    sansInterface: '"Plus Jakarta Sans", "Tajawal", system-ui, -apple-system, sans-serif',
  },
  letterSpacing: {
    editorialLabel: '0.14em',
    editorialWide: '0.18em',
    editorialWidest: '0.20em',
  },
} as const;

export const LAYOUT = {
  maxWidth: '1440px',
  borderRadius: '4px',
  borderWidth: '1px',
  grid: {
    desktop: {
      columns: 12,
      gutters: '24px',
      margin: '64px',
    },
    tablet: {
      columns: 8,
      gutters: '20px',
      margin: '32px',
    },
    mobile: {
      columns: 4,
      gutters: '16px',
      margin: '20px',
    },
  },
} as const;
