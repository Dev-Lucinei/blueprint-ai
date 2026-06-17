import { useState, useEffect } from 'react';

/**
 * Hook para detectar breakpoint de mídia de forma reativa.
 *
 * @param query - Media query string (ex: '(max-width: 768px)')
 * @returns true se a media query combina
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Sincroniza o valor inicial
    setMatches(mql.matches);

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Breakpoints pré-definidos seguindo o design system.
 */
export const BREAKPOINTS = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  // Alias convenience
  isMobile: '(max-width: 768px)',
  isTablet: '(max-width: 1024px)', // tablet + mobile
  isDesktop: '(min-width: 1025px)',
} as const;
