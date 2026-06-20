"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Reveals `text` one character at a time (typewriter effect), then calls
 * `onDone`. Respects prefers-reduced-motion: shows the full text instantly.
 */
export default function Typewriter({
  text = "",
  speed = 40,
  startDelay = 120,
  onDone,
  className,
  showCaret = true,
}) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState("");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (reduceMotion) {
      setShown(text);
      onDoneRef.current?.();
      return;
    }

    setShown("");
    let i = 0;
    let interval;
    const startTimer = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          onDoneRef.current?.();
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      clearInterval(interval);
    };
  }, [text, speed, startDelay, reduceMotion]);

  const done = shown.length >= text.length;

  return (
    <span className={className}>
      {shown}
      {showCaret && !done && (
        <span className="ms-0.5 animate-pulse font-light text-primary">|</span>
      )}
    </span>
  );
}
