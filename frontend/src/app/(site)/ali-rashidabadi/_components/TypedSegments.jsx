"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { humanTypingDelay } from "../_lib/humanTyping";

/**
 * Segmented typed headline (funnel spec §6.1 IntroTypingHeadline pattern):
 * `segments` is [{ text, color }] — typed as one continuous string with the
 * shared human cadence, rendered per-segment color, blinking caret until done.
 * Callers must remount (change `key`) to retype different segments.
 */
export default function TypedSegments({
  segments,
  onTypingDone,
  className,
  caretColor = "#26fce3",
  startDelayMs = 400,
  minHeight = "3.2em",
}) {
  const reduceMotion = useReducedMotion();
  const fullText = segments.map((s) => s.text).join("");
  const [typedLen, setTypedLen] = useState(0);
  const done = typedLen >= fullText.length;

  const onDoneRef = useRef(onTypingDone);
  useEffect(() => {
    onDoneRef.current = onTypingDone;
  });

  useEffect(() => {
    if (done) onDoneRef.current?.();
  }, [done]);

  useEffect(() => {
    let timer;
    const step = (i) => {
      setTypedLen(i);
      if (i < fullText.length) {
        timer = setTimeout(() => step(i + 1), humanTypingDelay(fullText[i - 1]));
      }
    };
    if (reduceMotion) {
      timer = setTimeout(() => setTypedLen(fullText.length), 0);
    } else {
      timer = setTimeout(() => step(1), startDelayMs);
    }
    return () => clearTimeout(timer);
  }, [fullText, startDelayMs, reduceMotion]);

  // Per-segment character offsets into the full text (no mutation in JSX).
  const starts = [];
  for (let i = 0, acc = 0; i < segments.length; i++) {
    starts.push(acc);
    acc += segments[i].text.length;
  }

  return (
    <p dir="rtl" className={className} style={{ minHeight }}>
      {segments.map((seg, si) => {
        const shownCount = Math.max(0, Math.min(seg.text.length, typedLen - starts[si]));
        if (!shownCount) return null;
        const shown = seg.text.slice(0, shownCount);
        return shown.split("\n").map((line, li, arr) => (
          <span key={`${si}-${li}`}>
            <span style={{ color: seg.color }}>{line}</span>
            {li < arr.length - 1 && <br />}
          </span>
        ));
      })}
      {!done && (
        <span className="inline-block animate-blink-cursor" style={{ color: caretColor }}>
          |
        </span>
      )}
    </p>
  );
}
