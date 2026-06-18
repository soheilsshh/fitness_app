"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";

/** Thin gradient bar at the top of the viewport that tracks scroll progress. */
export function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const el = barRef.current;
      if (!el) return;
      const doc = document.documentElement;
      const scrolled = doc.scrollTop || document.body.scrollTop;
      const height = doc.scrollHeight - doc.clientHeight;
      el.style.width = height > 0 ? `${(scrolled / height) * 100}%` : "0%";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <div id="scroll-progress" ref={barRef} aria-hidden />;
}

/**
 * Mouse-tracking 3D tilt for an element carrying the `.tilt-card` class.
 * Returns props to spread on the target element.
 */
export function useTilt() {
  const ref = useRef(null);

  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = (y - rect.height / 2) / 20;
    const rotateY = -(x - rect.width / 2) / 20;
    el.style.setProperty("--rx", `${rotateX}deg`);
    el.style.setProperty("--ry", `${rotateY}deg`);
  }, []);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}

/**
 * Card with a scroll-in entrance (outer) plus a mouse-tracking 3D tilt (inner).
 * The two transforms live on separate elements so framer-motion's translate
 * and the tilt rotation don't clobber each other.
 */
export function TiltCard({ className = "", children, delay = 0 }) {
  const { ref, onMouseMove, onMouseLeave } = useTilt();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay }}
      className="h-full"
    >
      <div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className={`tilt-card ${className}`}
      >
        {children}
      </div>
    </motion.div>
  );
}
