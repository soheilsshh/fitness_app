"use client";

import React, { useState, useEffect, useId, useRef } from "react";
import { motion } from "framer-motion";

/**
 * Cycles through `words`, animating each in with a blur/fade.
 * Word-level animation (no per-character split) so Persian/Arabic
 * cursive joining stays intact.
 */
export function ContainerTextFlip({
  words = ["better", "modern", "beautiful", "awesome"],
  interval = 2600,
  className = "",
  textClassName = "",
  animationDuration = 700,
}) {
  const id = useId();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [width, setWidth] = useState(100);
  const textRef = useRef(null);

  const updateWidthForWord = () => {
    if (textRef.current) {
      setWidth(textRef.current.scrollWidth + 30);
    }
  };

  useEffect(() => {
    updateWidthForWord();
  }, [currentWordIndex]);

  useEffect(() => {
    if (words.length <= 1) return undefined;
    const intervalId = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(intervalId);
  }, [words, interval]);

  return (
    <motion.span
      layout
      layoutId={`words-here-${id}`}
      animate={{ width }}
      transition={{ duration: animationDuration / 2000 }}
      className={[
        "relative inline-block rounded-xl px-4 pt-1.5 pb-2 text-center text-base font-bold text-cyan-50 md:text-lg",
        "[background:linear-gradient(to_bottom,rgba(6,78,59,0.85),rgba(6,78,59,0.7))]",
        "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),0_4px_12px_-4px_rgba(0,0,0,0.4)]",
        className,
      ].join(" ")}
      key={words[currentWordIndex]}
    >
      <motion.span
        ref={textRef}
        className={["inline-block whitespace-nowrap", textClassName].join(" ")}
        initial={{ opacity: 0, filter: "blur(8px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: animationDuration / 1000, ease: "easeInOut" }}
      >
        {words[currentWordIndex]}
      </motion.span>
    </motion.span>
  );
}

export default ContainerTextFlip;
