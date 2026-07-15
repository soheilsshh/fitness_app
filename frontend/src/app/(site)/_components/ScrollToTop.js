"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";

const SHOW_AFTER = 280;

function scrollToTopSmooth() {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.scrollTo({
    top: 0,
    behavior: reduce ? "auto" : "smooth",
  });
}

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTopSmooth}
          aria-label="بازگشت به بالای صفحه"
          title="بازگشت به بالا"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.9 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.92 }}
          transition={
            reduceMotion
              ? { duration: 0.15 }
              : { type: "spring", damping: 22, stiffness: 280 }
          }
          className="fixed bottom-6 left-4 z-[90] inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-border/70 bg-background/85 text-foreground shadow-lg shadow-black/10 backdrop-blur-xl transition-colors duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 motion-reduce:active:scale-100 sm:bottom-8 sm:left-6"
        >
          <ArrowUp className="size-5" strokeWidth={2.25} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
