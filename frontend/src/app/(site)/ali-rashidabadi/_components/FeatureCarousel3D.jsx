"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Bot, Smartphone, UserRound, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  bot: Bot,
  user: UserRound,
  utensils: Utensils,
  smartphone: Smartphone,
};

/**
 * Fitino-themed auto 3D coverflow carousel (glass + teal OLED).
 * Centered on phone; respects prefers-reduced-motion.
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
    <div className="mx-auto flex w-full max-w-md flex-col items-center">
      <div
        className="relative h-[230px] w-full max-w-[320px] md:h-[250px]"
        style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
      >
        {features.map((feat, i) => {
          const Icon = ICONS[feat.icon] || Bot;
          let offset = i - active;
          if (offset > n / 2) offset -= n;
          if (offset < -n / 2) offset += n;
          const abs = Math.abs(offset);
          const isCenter = offset === 0;
          const x = offset * 78;
          const z = isCenter ? 90 : 10 - abs * 45;
          const rotateY = offset * -32;
          const scale = isCenter ? 1 : 0.76;
          const opacity = abs > 1.6 ? 0 : isCenter ? 1 : 0.42;

          return (
            <button
              key={feat.title}
              type="button"
              aria-label={feat.title}
              aria-current={isCenter ? "true" : undefined}
              onClick={() => setActive(i)}
              className={cn(
                "absolute start-1/2 top-1/2 w-[86%] max-w-[270px] rounded-3xl border p-4 text-start backdrop-blur-xl will-change-transform",
                "transition-[transform,opacity,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                "motion-reduce:transition-none",
                isCenter
                  ? "border-primary/50 bg-white/[0.08] shadow-[0_0_48px_-10px_oklch(0.58_0.11_187_/_0.55)]"
                  : "border-white/10 bg-white/[0.03] shadow-none"
              )}
              style={{
                transform: `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                zIndex: isCenter ? 20 : 10 - abs,
                pointerEvents: abs > 1 ? "none" : "auto",
                transformStyle: "preserve-3d",
              }}
            >
              <div className="mb-2 flex size-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                <Icon className="size-4 text-primary" aria-hidden />
              </div>
              <h3 className="text-sm font-bold text-white">{feat.title}</h3>
              <p className="mt-1.5 line-clamp-4 text-xs leading-6 text-white/55">{feat.body}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex justify-center gap-2">
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
