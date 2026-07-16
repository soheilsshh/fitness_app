"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * The living brand mark — Fitino logo in place of the spec's WebGL orb.
 * Circular-masked logo with a teal glow, a slow breathing pulse and a
 * rotating gradient halo; `thinking` speeds everything up and brightens
 * the glow (same role as the orb's thinking state).
 */
export default function FunnelLogo({ size = 180, thinking = false, className }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn("relative shrink-0", className)}
      style={{
        width: size,
        height: size,
        filter: thinking
          ? "drop-shadow(0 0 55px rgba(38, 252, 227, 0.5))"
          : "drop-shadow(0 0 42px rgba(38, 252, 227, 0.32))",
      }}
      animate={reduceMotion ? undefined : { scale: thinking ? [1, 1.055, 1] : [1, 1.025, 1] }}
      transition={{ duration: thinking ? 1.6 : 3.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div
        aria-hidden
        className="absolute -inset-[5%] rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(38,252,227,0) 0%, rgba(38,252,227,0.85) 22%, rgba(88,202,192,0.35) 40%, rgba(38,252,227,0) 62%)",
          maskImage:
            "radial-gradient(farthest-side, transparent calc(100% - 3.5px), #000 calc(100% - 2.5px))",
          WebkitMaskImage:
            "radial-gradient(farthest-side, transparent calc(100% - 3.5px), #000 calc(100% - 2.5px))",
        }}
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: thinking ? 1.5 : 4.5, repeat: Infinity, ease: "linear" }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fitino-logo.png"
        alt="فیتینو"
        className="h-full w-full rounded-full border border-white/10 object-cover"
        draggable={false}
      />
    </motion.div>
  );
}
