import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = () => setIsMobile(mql.matches);
    
    // Set initial value
    handler();
    
    // Listen for changes
    mql.addEventListener('change', handler);
    
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);
  
  return isMobile;
}
