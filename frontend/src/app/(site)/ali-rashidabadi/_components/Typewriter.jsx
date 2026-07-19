"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { typeHumanly } from "../_lib/humanTyping";

/**
 * Reveals `text` one character at a time with human-irregular cadence
 * (shared `humanTyping` timing — per-key jitter, pauses at spaces/clauses/
 * sentences/newlines, occasional hesitation), then calls `onDone`.
 * Respects prefers-reduced-motion: shows the full text instantly.
 * Callers must remount (change `key`) to retype a different text.
 */
export default function Typewriter({
  text = "",
  startDelay = 120,
  onDone,
  className,
  showCaret = true,
}) {
  const reduceMotion = useReducedMotion();
  const [shownLen, setShownLen] = useState(0);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (reduceMotion) {
      const t = setTimeout(() => {
        setShownLen(text.length);
        onDoneRef.current?.();
      }, 0);
      return () => clearTimeout(t);
    }
    return typeHumanly(
      text,
      (count) => setShownLen(count),
      () => onDoneRef.current?.(),
      startDelay
    );
  }, [text, startDelay, reduceMotion]);

  const done = shownLen >= text.length;

  return (
    <span className={className}>
      {text.slice(0, shownLen)}
      {showCaret && !done && (
        <span className="ms-0.5 inline-block animate-blink-cursor font-light text-primary">|</span>
      )}
    </span>
  );
}
