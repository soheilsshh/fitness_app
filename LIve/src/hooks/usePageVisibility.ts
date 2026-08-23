/**
 * usePageVisibility - DUAL-LAYER visibility detection for iOS/Android
 * 
 * Tracks when the page/tab goes to background and returns to foreground.
 * Uses multiple event sources to handle iOS WebKit freeze and Android late visibilitychange.
 * 
 * Dual-layer detection:
 * - document.visibilitychange (standard)
 * - window.focus / window.blur (desktop fallback)
 * - pagehide / pageshow (iOS Safari specific)
 * 
 * All events trigger the same handlers to ensure no missed transitions.
 */

import { useState, useEffect, useRef } from 'react';

export interface PageVisibilityState {
  isVisible: boolean;
  lastHiddenAt: number | null;
  lastVisibleAt: number | null;
  backgroundDuration: number | null; // How long the page was hidden (ms)
}

export function usePageVisibility(): PageVisibilityState {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const lastHiddenAtRef = useRef<number | null>(null);
  const lastVisibleAtRef = useRef<number | null>(Date.now());
  const [lastHiddenAt, setLastHiddenAt] = useState<number | null>(null);
  const [lastVisibleAt, setLastVisibleAt] = useState<number | null>(Date.now());

  useEffect(() => {
    let isHiddenState = document.hidden;
    
    // Internal handlers that handle state consistently
    const onHidden = () => {
      if (isHiddenState) return; // Already hidden
      isHiddenState = true;
      const now = Date.now();
      lastHiddenAtRef.current = now;
      setLastHiddenAt(now);
      setIsVisible(false);
      console.log('[usePageVisibility] 📱 Page went to background (dual-layer detection)');
    };

    const onVisible = () => {
      if (!isHiddenState) return; // Already visible
      isHiddenState = false;
      const now = Date.now();
      const hiddenAt = lastHiddenAtRef.current;
      lastVisibleAtRef.current = now;
      setLastVisibleAt(now);
      setIsVisible(true);

      if (hiddenAt !== null) {
        const duration = now - hiddenAt;
        console.log(`[usePageVisibility] 📱 Page returned to foreground (was hidden for ${(duration / 1000).toFixed(1)}s) - dual-layer detection`);
      } else {
        console.log('[usePageVisibility] 📱 Page returned to foreground - dual-layer detection');
      }
    };

    // LAYER 1: Standard visibilitychange (works on most browsers)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        onHidden();
      } else {
        onVisible();
      }
    };

    // LAYER 2: window.focus / window.blur (desktop fallback)
    const handleFocus = () => {
      if (!document.hidden) {
        onVisible();
      }
    };

    const handleBlur = () => {
      if (document.hidden) {
        onHidden();
      }
    };

    // LAYER 3: pagehide / pageshow (iOS Safari specific - handles WebKit freeze)
    const handlePageHide = () => {
      onHidden();
    };

    const handlePageShow = () => {
      onVisible();
    };

    // Register ALL event listeners for dual-layer detection
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('pagehide', handlePageHide); // iOS Safari
    window.addEventListener('pageshow', handlePageShow); // iOS Safari

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  // Calculate background duration
  const backgroundDuration = lastHiddenAt !== null && lastVisibleAt !== null && lastVisibleAt > lastHiddenAt
    ? lastVisibleAt - lastHiddenAt
    : null;

  return {
    isVisible,
    lastHiddenAt,
    lastVisibleAt,
    backgroundDuration,
  };
}
