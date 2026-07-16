"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { HERO_COPY } from "../_lib/funnelConfig";

const IMAGE_SRC = "/images/coach-ali.jpg";

const TRUST = [
  { icon: Clock, label: "کمتر از ۲ دقیقه" },
  { icon: Sparkles, label: "کاملاً رایگان" },
  { icon: CheckCircle2, label: "بدون تعهد اولیه" },
];

export default function FunnelHero({ coachName = "علی رشید آبادی", onStart }) {
  const reduceMotion = useReducedMotion();
  const [imgError, setImgError] = useState(false);

  const fade = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] },
        };

  return (
    <section
      dir="rtl"
      className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-[#0e0e0e] text-white"
    >
      {/* Mobile badge — pinned like site Hero */}
      <div className="absolute inset-x-0 top-3 z-20 flex justify-center px-4 md:hidden">
        <Badge
          variant="outline"
          className="gap-2 border-white/15 bg-black/45 px-4 py-1.5 text-[11px] tracking-widest text-white/90 backdrop-blur-md"
        >
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          ارزیابی هوشمند بدن
        </Badge>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-end px-5 pb-8 pt-14 sm:px-6 sm:pb-10 md:flex-row md:items-center md:justify-between md:gap-10 md:px-8 md:py-16 lg:gap-14">
        {/* Portrait — full-bleed bg on mobile, framed panel on desktop (site Hero pattern) */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="pointer-events-none absolute inset-0 z-0 md:pointer-events-auto md:relative md:inset-auto md:order-2 md:z-auto md:flex md:h-[min(560px,70vh)] md:w-[42%] md:shrink-0 md:items-center md:justify-center"
          aria-hidden={imgError ? undefined : true}
        >
          <div className="absolute inset-0 hidden rounded-full bg-primary/10 blur-[110px] md:block" />

          <div
            className={cn(
              "absolute inset-0 overflow-hidden",
              "md:relative md:aspect-[3/4] md:h-full md:w-auto md:max-w-full md:rounded-3xl md:border md:border-primary/25 md:bg-card/30 md:shadow-2xl md:shadow-primary/10 md:backdrop-blur-sm"
            )}
          >
            {!imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={IMAGE_SRC}
                alt={`مربی ${coachName}`}
                className="absolute inset-0 h-full w-full object-cover object-[center_18%] md:rounded-3xl md:object-[center_15%]"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="absolute inset-0 bg-[#1b1b1b]" />
            )}

            {/* Mobile scrim — face readable up top, copy zone dark below */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/75 to-[#0e0e0e]/20 md:hidden" />
            <div className="absolute inset-0 bg-gradient-to-l from-[#0e0e0e]/40 via-transparent to-transparent md:hidden" />

            {/* Desktop soft fade */}
            <div className="pointer-events-none absolute inset-0 hidden rounded-3xl bg-gradient-to-t from-[#0e0e0e]/50 via-transparent to-transparent md:block" />

            {/* Coach caption on desktop frame */}
            <div className="absolute inset-x-0 bottom-0 hidden p-5 md:block">
              <div className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 backdrop-blur-md">
                <p className="text-sm font-bold text-white">مربی {coachName}</p>
                <p className="mt-0.5 text-xs text-white/60">قهرمان پرورش اندام · فیتینو</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Copy + CTA */}
        <div className="relative z-10 w-full space-y-5 text-center md:order-1 md:max-w-xl md:flex-1 md:space-y-6 md:text-start">
          <motion.div {...fade(0)} className="flex flex-col items-center gap-2.5 md:items-start">
            <div className="flex items-center gap-2.5">
              <Logo className="h-9 w-9 object-contain sm:h-10 sm:w-10" />
              <span className="font-iranianSansBlack text-xl tracking-tight text-white sm:text-2xl">
                فیتینو
              </span>
            </div>
            <Badge
              variant="outline"
              className="hidden gap-2 border-white/15 bg-white/5 px-3.5 py-1 text-[11px] tracking-widest text-primary md:inline-flex"
            >
              <span className="size-2 animate-pulse rounded-full bg-primary" />
              مربی {coachName} · پایش هوشمند
            </Badge>
          </motion.div>

          <motion.h1
            {...fade(0.08)}
            className="text-[1.45rem] font-extrabold leading-[1.55] tracking-tight text-white sm:text-2xl md:text-[1.85rem] md:leading-[1.5] lg:text-[2.05rem]"
          >
            فرمول اختصاصی بدن تو؛{" "}
            <span className="bg-linear-to-l from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
              علم مربیگری
            </span>{" "}
            و پایش ۲۴ ساعته هوش مصنوعی
          </motion.h1>

          <motion.p
            {...fade(0.14)}
            className="mx-auto max-w-md text-sm leading-7 text-white/70 md:me-auto md:ms-0 md:max-w-lg md:text-[0.95rem] md:leading-8"
          >
            {HERO_COPY.subtitle}
          </motion.p>

          <motion.div {...fade(0.2)} className="space-y-3 pt-1">
            <Button
              type="button"
              size="lg"
              onClick={onStart}
              className={cn(
                "gradient-bg h-auto w-full rounded-full py-4 text-base font-extrabold text-primary-foreground shadow-lg shadow-primary/25",
                "transition duration-200 hover:opacity-95 active:scale-[0.98]",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0e0e]",
                "md:w-auto md:min-w-[18rem] md:px-10"
              )}
            >
              <span className="inline-flex items-center gap-2">
                شروع ارزیابی هوشمند بدنم
                <ArrowLeft className="size-4" />
              </span>
            </Button>
            <p className="text-xs text-white/45 md:text-start">رایگان · بدون نیاز به ثبت‌نام اولیه</p>
          </motion.div>

          <motion.ul
            {...fade(0.26)}
            className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-white/10 pt-5 md:mx-0 md:justify-start"
          >
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-1.5 text-[11px] text-white/55 sm:text-xs">
                <Icon className="size-3.5 shrink-0 text-primary" aria-hidden />
                {label}
              </li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
