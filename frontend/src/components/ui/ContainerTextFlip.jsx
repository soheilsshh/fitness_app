"use client";

import React, { useState, useEffect, useId, useRef } from "react";
import { motion } from "framer-motion";

const MAX_PHRASE_WORDS = 15;

/** Keep at most `maxWords` words in a specialty/phrase string. */
export function limitPhraseWords(text, maxWords = MAX_PHRASE_WORDS) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}

/**
 * Cycles through phrases (each up to ~15 words), animating with blur/fade.
 * Word-level animation so Persian/Arabic cursive joining stays intact.
 */
export function ContainerTextFlip({
  words = ["better", "modern", "beautiful", "awesome"],
  interval = 3200,
  className = "",
  textClassName = "",
  animationDuration = 700,
  maxWords = MAX_PHRASE_WORDS,
}) {
  const id = useId();
  const phrases = (words || [])
    .map((w) => limitPhraseWords(w, maxWords))
    .filter(Boolean);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const textRef = useRef(null);

  useEffect(() => {
    if (phrases.length <= 1) return undefined;
    const intervalId = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % phrases.length);
    }, interval);
    return () => clearInterval(intervalId);
  }, [phrases, interval]);

  if (phrases.length === 0) return null;

  const current = phrases[currentWordIndex % phrases.length];

  return (
    <motion.span
      layout
      layoutId={`words-here-${id}`}
      transition={{ duration: animationDuration / 2000 }}
      className={[
        "relative inline-flex max-w-full rounded-xl px-3 py-2 text-start text-sm font-bold leading-6 text-cyan-50 sm:px-4 sm:text-base md:text-lg md:leading-7",
        "[background:linear-gradient(to_bottom,rgba(6,78,59,0.85),rgba(6,78,59,0.7))]",
        "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),0_4px_12px_-4px_rgba(0,0,0,0.4)]",
        className,
      ].join(" ")}
      key={current}
    >
      <motion.span
        ref={textRef}
        className={["block max-w-[min(100%,22rem)] whitespace-normal break-words text-start", textClassName].join(
          " ",
        )}
        initial={{ opacity: 0, filter: "blur(8px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: animationDuration / 1000, ease: "easeInOut" }}
      >
        {current}
      </motion.span>
    </motion.span>
  );
}

export default ContainerTextFlip;
