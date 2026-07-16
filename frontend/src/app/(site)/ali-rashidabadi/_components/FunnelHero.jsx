"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HERO_COPY } from "../_lib/funnelConfig";
import { useTypingBubbleGate } from "../_lib/useCtaAfterTyping";
import TypedSegments from "./TypedSegments";
import DelayedFunnelCta from "./DelayedFunnelCta";
import { LogoAnchor } from "./FunnelLogoLayer";

const IMAGE_SRC = "/images/coach-ali.jpg";

/** Typed intro headline — brand-accent segment in Fitino bright teal. */
const HEADLINE_SEGMENTS = [
  { text: "فرمول اختصاصی بدن تو؛", color: "#eafffb" },
  { text: "\n", color: "#eafffb" },
  { text: "علم مربیگری", color: "#26fce3" },
  { text: " و پایش ۲۴ ساعته هوش مصنوعی", color: "#eafffb" },
];

const TRUST = [
  { icon: Clock, label: "کمتر از ۲ دقیقه" },
  { icon: Sparkles, label: "کاملاً رایگان" },
  { icon: CheckCircle2, label: "بدون تعهد اولیه" },
];

/**
 * Intro phase — coach portrait as full-bleed backdrop, the living Fitino
 * logo front and center, a human-typed headline and a CTA that reveals
 * 1 s after typing finishes (funnel spec intro, orb → logo).
 */
export default function FunnelHero({ coachName = "علی رشید آبادی", onStart }) {
  const reduceMotion = useReducedMotion();
  const [imgError, setImgError] = useState(false);
  const { typingDone, onTypingDone } = useTypingBubbleGate(1000);

  return (
    <section
      dir="rtl"
      className="funnel-screen relative isolate flex flex-col overflow-hidden bg-[#0e0e0e] text-white"
    >
      {/* Coach portrait backdrop + scrims */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={IMAGE_SRC}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_12%]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-[#141a19]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/80 to-[#0e0e0e]/25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_88%,rgba(24,114,114,0.28),transparent_60%)]" />
      </div>

      {/* Pinned top badge */}
      <div className="relative z-10 flex justify-center px-4 pt-4">
        <Badge
          variant="outline"
          className="gap-2 border-white/15 bg-black/45 px-4 py-1.5 text-[11px] tracking-widest text-white/90 backdrop-blur-md"
        >
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          مربی {coachName} · ارزیابی هوشمند بدن
        </Badge>
      </div>

      {/* Copy stack pinned to the lower half, logo above the headline */}
      <div className="relative z-10 mt-auto flex flex-col items-center gap-4 px-5 pb-8 pt-6 text-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-2"
        >
          <LogoAnchor id="hero" size={124} className="rounded-full" />
          <span className="font-iranianSansBlack text-xl tracking-tight text-white">فیتینو</span>
        </motion.div>

        <TypedSegments
          segments={HEADLINE_SEGMENTS}
          onTypingDone={onTypingDone}
          caretColor="#26fce3"
          className="text-[24px] font-black leading-[1.6] text-center"
          minHeight="3.2em"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: typingDone ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-md text-sm leading-7 text-white/70"
        >
          {HERO_COPY.subtitle}
        </motion.p>

        <div className="w-full max-w-md space-y-3 pt-1">
          <DelayedFunnelCta typingDone={typingDone} onClick={onStart}>
            شروع ارزیابی هوشمند بدنم
            <ArrowLeft className="size-4" />
          </DelayedFunnelCta>
          {typingDone && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.4 }}
              className="text-xs text-white/45"
            >
              رایگان · بدون نیاز به ثبت‌نام اولیه
            </motion.p>
          )}
        </div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: typingDone ? 1 : 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-white/10 pt-4"
        >
          {TRUST.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-1.5 text-[11px] text-white/55"
            >
              <Icon className="size-3.5 shrink-0 text-primary" aria-hidden />
              {label}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
