"use client";

import { useCallback, useEffect, useState } from "react";

const DEFAULT_SECONDS = 60;

export function useOtpResendCooldown(seconds = DEFAULT_SECONDS) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  const startCooldown = useCallback(
    (fromSeconds = seconds) => {
      const value = Number(fromSeconds);
      setSecondsLeft(value > 0 ? Math.ceil(value) : seconds);
    },
    [seconds],
  );

  const syncFromResponse = useCallback(
    (error) => {
      const retry = error?.response?.data?.retry_after_seconds;
      if (retry != null) {
        startCooldown(retry);
      }
    },
    [startCooldown],
  );

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setInterval(() => {
      setSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const resetCooldown = useCallback(() => {
    setSecondsLeft(0);
  }, []);

  return {
    secondsLeft,
    canResend: secondsLeft === 0,
    startCooldown,
    syncFromResponse,
    resetCooldown,
  };
}
