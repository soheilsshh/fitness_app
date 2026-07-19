"use client";

import { useCallback, useEffect, useState } from "react";

/** Gate a CTA behind "typing finished + delayMs beat" (funnel spec §6.2). */
export function useTypingBubbleGate(delayMs = 1000) {
  const [typingDone, setTypingDone] = useState(false);
  const ctaVisible = useCtaAfterTyping(typingDone, delayMs);
  const onTypingDone = useCallback(() => setTypingDone(true), []);
  return { ctaVisible, onTypingDone, typingDone, setTypingDone };
}

export function useCtaAfterTyping(typingDone, delayMs = 1000) {
  const [delayPassed, setDelayPassed] = useState(false);
  useEffect(() => {
    if (!typingDone) return;
    const t = setTimeout(() => setDelayPassed(true), delayMs);
    return () => {
      clearTimeout(t);
      setDelayPassed(false);
    };
  }, [typingDone, delayMs]);
  return typingDone && delayPassed;
}
