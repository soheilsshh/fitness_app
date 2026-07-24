"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Activity, Dumbbell, Smartphone, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURE_ICONS = {
  bot: Activity,
  user: Dumbbell,
  utensils: UtensilsCrossed,
  smartphone: Smartphone,
};

/**
 * Centered Fitino 3D coverflow — auto-plays, RTL-safe (no inset-inline).
 */
export default function FeatureCarousel3D({ features = [], intervalMs = 3800 }) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const n = features.length;

  useEffect(() => {
    if (n < 2 || reduceMotion) return;
    const id = setInterval(() => setActive((i) => (i + 1) % n), intervalMs);
    return () => clearInterval(id);
  }, [n, intervalMs, reduceMotion]);

  if (!n) return null;

  return (
    <div className="mx-auto w-full max-w-[340px]" dir="ltr">
      <div
        className="relative mx-auto h-[250px] w-full overflow-visible"
        style={{ perspective: "900px" }}
      >
        {/* Centering hub — all cards share the same origin */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {features.map((feat, i) => {
            let offset = i - active;
            if (offset > n / 2) offset -= n;
            if (offset < -n / 2) offset += n;
            const abs = Math.abs(offset);
            const isCenter = offset === 0;
            const x = offset * 58;
            const z = isCenter ? 60 : -40 - abs * 28;
            const rotateY = offset * -22;
            const scale = isCenter ? 1 : 0.82;
            const opacity = abs > 1.5 ? 0 : isCenter ? 1 : 0.38;
            const Icon = FEATURE_ICONS[feat.icon] || Activity;

            return (
              <button
                key={feat.title}
                type="button"
                aria-label={feat.title}
                aria-current={isCenter ? "true" : undefined}
                tabIndex={isCenter ? 0 : -1}
                onClick={() => setActive(i)}
                className={cn(
                  "absolute w-[78%] max-w-[250px] rounded-3xl border p-4 text-right antialiased",
                  "transition-[transform,opacity,box-shadow,border-color] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  "motion-reduce:transition-none",
                  isCenter
                    ? "border-primary/55 bg-[#1a2220] shadow-[0_0_48px_-10px_oklch(0.58_0.11_187_/_0.55)]"
                    : "border-white/10 bg-[#121616] shadow-none"
                )}
                style={{
                  transform: `translate3d(${x}px, 0, ${z}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex: isCenter ? 30 : 10 - abs,
                  pointerEvents: abs > 1 ? "none" : "auto",
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
                dir="rtl"
              >
                <div
                  className={cn(
                    "mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl border",
                    isCenter
                      ? "border-primary/40 bg-primary/15 text-primary shadow-[0_0_20px_-6px_oklch(0.58_0.11_187_/_0.45)]"
                      : "border-white/15 bg-white/5 text-white/70"
                  )}
                  aria-hidden
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-[13px] font-bold leading-6 tracking-tight text-white">
                  {feat.title}
                </h3>
                <p className="mt-1.5 line-clamp-4 text-[13px] font-semibold leading-[1.7] text-[#f3f5f4]">
                  {feat.body}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2" dir="ltr">
        {features.map((feat, i) => (
          <button
            key={feat.title}
            type="button"
            aria-label={`ویژگی ${i + 1}`}
            onClick={() => setActive(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === active ? "w-6 bg-primary" : "w-1.5 bg-white/25"
            )}
          />
        ))}
      </div>
    </div>
  );
}
