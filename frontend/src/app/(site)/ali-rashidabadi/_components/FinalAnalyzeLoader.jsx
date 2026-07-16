"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import FunnelProgressRing from "./FunnelProgressRing";
import { LogoAnchor } from "./FunnelLogoLayer";

/**
 * The analyze loader (funnel spec §6.3A): a requestAnimationFrame loop over a
 * fixed 10 000 ms duration drives a 0→100 ring plus a 4-step checklist whose
 * items flip pending→active→done as the percentage crosses each quartile.
 * Calls `onComplete()` exactly once at 100%.
 */
const DURATION_MS = 10_000;

const faNumber = new Intl.NumberFormat("fa-IR");

function stepState(i, pct, count) {
  const seg = 100 / count;
  if (pct >= (i + 1) * seg - 1e-3) return "done";
  if (pct >= i * seg) return "active";
  return "pending";
}

export default function FinalAnalyzeLoader({ title, steps, onComplete }) {
  const [pct, setPct] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    let raf;
    let finished = false;
    const start = performance.now();
    const tick = (now) => {
      const next = Math.min(100, ((now - start) / DURATION_MS) * 100);
      setPct(next);
      if (next >= 100) {
        if (!finished) {
          finished = true;
          onCompleteRef.current?.();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative flex flex-col items-center py-8 text-center">
      <div className="relative mb-8">
        <FunnelProgressRing value={pct} size={168} strokeWidth={9}>
          <LogoAnchor id="analyze" size={104} thinking className="rounded-full" />
        </FunnelProgressRing>
        <p className="mt-4 text-2xl font-black tabular-nums text-white">
          {faNumber.format(Math.round(pct))}٪
        </p>
      </div>

      <h2 className="relative max-w-md text-lg font-bold leading-8 text-white">{title}</h2>

      <ul className="relative mt-8 w-full max-w-lg space-y-3 text-start">
        {steps.map((step, i) => {
          const state = stepState(i, pct, steps.length);
          return (
            <motion.li
              key={step}
              initial={{ opacity: 0.25 }}
              animate={{ opacity: state === "pending" ? 0.3 : 1 }}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-7",
                state === "done"
                  ? "border-primary/30 bg-primary/10 text-white/90"
                  : "border-white/10 bg-white/[0.03] text-white/45"
              )}
            >
              {state === "done" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : state === "active" ? (
                <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-primary" />
              ) : (
                <span className="mt-1.5 size-4 shrink-0 rounded-full border border-white/20" />
              )}
              <span className="text-[13px] tracking-tight">{step}</span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
