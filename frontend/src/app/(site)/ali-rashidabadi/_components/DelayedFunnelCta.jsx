"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCtaAfterTyping } from "../_lib/useCtaAfterTyping";

/**
 * CTA that stays hidden until typing finishes + a 1000 ms beat, then fades up
 * (funnel spec §6.2).
 */
export default function DelayedFunnelCta({
  typingDone,
  delayMs = 1000,
  children,
  className,
  disabled,
  ...props
}) {
  const visible = useCtaAfterTyping(typingDone, delayMs);
  if (!visible) return null;
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileTap={{ scale: 0.97 }}
      dir="rtl"
      disabled={disabled}
      className={cn("btn-cta w-full", className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}
