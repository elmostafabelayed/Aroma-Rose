import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Scroll position registry keyed by React Router's unique history entry location.key.
 */
const scrollPositions = new Map<string, number>();

/**
 * ScrollToTop - Route Scroll Management Component
 *
 * 1. Resets viewport scroll to top (0, 0) whenever navigating to a new route
 *    or between different product detail pages (PUSH / REPLACE with new pathname).
 * 2. Restores exact scroll coordinates when using browser Back/Forward (POP navigations).
 * 3. Preserves current scroll position during in-page state updates, quantity changes,
 *    add-to-cart, or query param updates (filters, sorting, search).
 * 4. Respects reduced-motion user preferences.
 */
export const ScrollToTop: React.FC = () => {
  const location = useLocation();
  const navType = useNavigationType();
  const prevPathnameRef = useRef<string>(location.pathname);

  // Set manual history scroll restoration so native browser does not race with React
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Continuously record scroll position for the current history entry
  useEffect(() => {
    const handleScroll = () => {
      scrollPositions.set(location.key, window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.key]);

  // Handle route transitions
  useLayoutEffect(() => {
    const isPathnameChanged = prevPathnameRef.current !== location.pathname;
    prevPathnameRef.current = location.pathname;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (navType === 'POP') {
      // Browser Back / Forward: restore the recorded scroll position for this history entry
      const savedY = scrollPositions.get(location.key) ?? 0;
      window.scrollTo({
        top: savedY,
        left: 0,
        behavior: 'instant',
      });

      // Double-tick in requestAnimationFrame to guarantee restoration once DOM renders
      const rafId = requestAnimationFrame(() => {
        window.scrollTo({
          top: savedY,
          left: 0,
          behavior: 'instant',
        });
      });
      return () => cancelAnimationFrame(rafId);
    } else if (isPathnameChanged) {
      // Route change to a new page or different product: scroll immediately to top
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: prefersReducedMotion ? 'auto' : 'instant',
      });
    }
    // If pathname did not change (filter, sort, search query params), leave scroll untouched
  }, [location.pathname, location.key, navType]);

  return null;
};
