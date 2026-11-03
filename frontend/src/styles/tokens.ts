/**
 * Aroma Rose Official Brand Design System Tokens
 * Authoritative specification for Minimalist Editorial Luxury with Tactile Apothecary Sensibilities.
 */

export const BRAND_COLORS = {
  // Primary Luxury Palette
  primaryBurgundy: '#6B1838', // Brand signature deep botanical wine
  petalRose: '#D98CA5',       // Damask rose petal accent
  moroccanSand: '#E9DDCA',    // Dades Valley mineral sand
  deepCharcoalMauve: '#292329', // Editorial text & high-contrast ink
  deepBurgundy: '#3B1025',    // Deep shadow burgundy
  warmCanvas: '#FAF7F2',      // Warm organic background paper
  softRose: '#F5E7EC',        // Subtle rose wash for active states & highlights
  sandBorder: '#E2D3BE',      // Crisp 1px luxury apothecary border
  white: '#FFFFFF',           // Crisp pure white contrast
} as const;

export const TYPOGRAPHY = {
  fonts: {
    editorialSerif: '"Playfair Display", Georgia, serif',
    sansInterface: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
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

