import { useState, useEffect } from 'react';

/**
 * Hook to detect page visibility state
 * Returns true when the page is visible, false when hidden
 * Useful for stopping polling when tab is inactive
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if Page Visibility API is supported
    if (typeof document === 'undefined' || document.hidden === undefined) {
      return;
    }

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    // Set initial state
    setIsVisible(!document.hidden);

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
