"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const STICKER_FALLBACK = {
  bot: "🤖",
  user: "💪",
  utensils: "🥗",
  smartphone: "📱",
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
            const sticker =
              feat.sticker || STICKER_FALLBACK[feat.icon] || "✨";

            return (
              <button
                key={feat.title}
                type="button"
                aria-label={feat.title}
                aria-current={isCenter ? "true" : undefined}
                tabIndex={isCenter ? 0 : -1}
                onClick={() => setActive(i)}
                className={cn(
                  "absolute w-[78%] max-w-[250px] rounded-3xl border p-4 text-start backdrop-blur-xl",
                  "transition-[transform,opacity,box-shadow,border-color] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  "motion-reduce:transition-none",
                  isCenter
                    ? "border-primary/55 bg-white/[0.09] shadow-[0_0_48px_-10px_oklch(0.58_0.11_187_/_0.55)]"
                    : "border-white/10 bg-white/[0.03] shadow-none"
                )}
                style={{
                  transform: `translate3d(${x}px, 0, ${z}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex: isCenter ? 30 : 10 - abs,
                  pointerEvents: abs > 1 ? "none" : "auto",
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-[1.65rem] leading-none shadow-[0_0_20px_-6px_oklch(0.58_0.11_187_/_0.45)]"
                  aria-hidden
                >
                  {sticker}
                </div>
                <h3 className="text-sm font-bold leading-6 text-white">{feat.title}</h3>
                <p className="mt-1.5 line-clamp-4 text-[11px] leading-5 text-white/55">
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
