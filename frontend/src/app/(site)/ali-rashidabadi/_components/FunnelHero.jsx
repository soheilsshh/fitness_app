"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HERO_COPY } from "../_lib/funnelConfig";
import { useTypingBubbleGate } from "../_lib/useCtaAfterTyping";
import TypedSegments from "./TypedSegments";
import DelayedFunnelCta from "./DelayedFunnelCta";
import { LogoAnchor } from "./FunnelLogoLayer";
import { FunnelStickyBar } from "./FunnelShell";

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

function AiBodyScanBackdrop({ reduceMotion }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#070c0c]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(38,252,227,0.16),transparent_52%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_92%,rgba(24,114,114,0.32),transparent_58%)]" />
      <svg
        viewBox="0 0 390 720"
        className="absolute inset-0 h-full w-full opacity-80"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="scanStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#26fce3" stopOpacity="0.15" />
            <stop offset="45%" stopColor="#26fce3" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#26fce3" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {[80, 140, 210, 280, 350, 430, 510].map((y) => (
          <line
            key={y}
            x1="36"
            x2="354"
            y1={y}
            y2={y}
            stroke="#26fce3"
            strokeOpacity="0.08"
            strokeWidth="1"
          />
        ))}
        <ellipse cx="195" cy="168" rx="42" ry="52" fill="none" stroke="url(#scanStroke)" strokeWidth="1.6" />
        <path
          d="M160 220 C150 270 148 330 158 390 L175 520 C180 560 185 590 195 610 C205 590 210 560 215 520 L232 390 C242 330 240 270 230 220 Z"
          fill="none"
          stroke="url(#scanStroke)"
          strokeWidth="1.7"
        />
        <circle cx="118" cy="248" r="3.2" fill="#26fce3" opacity="0.85" />
        <circle cx="272" cy="248" r="3.2" fill="#26fce3" opacity="0.85" />
        <circle cx="195" cy="318" r="3.6" fill="#26fce3" />
        <circle cx="154" cy="430" r="3" fill="#26fce3" opacity="0.75" />
        <circle cx="236" cy="430" r="3" fill="#26fce3" opacity="0.75" />
        <path d="M118 248 L154 280 L195 318" fill="none" stroke="#26fce3" strokeOpacity="0.35" />
        <path d="M272 248 L236 280 L195 318" fill="none" stroke="#26fce3" strokeOpacity="0.35" />
        <path d="M195 318 L154 430" fill="none" stroke="#26fce3" strokeOpacity="0.28" />
        <path d="M195 318 L236 430" fill="none" stroke="#26fce3" strokeOpacity="0.28" />
      </svg>
      <motion.div
        className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-primary/25 to-transparent"
        initial={{ top: "8%" }}
        animate={reduceMotion ? { top: "42%" } : { top: ["10%", "78%", "10%"] }}
        transition={reduceMotion ? { duration: 0 } : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/55 to-[#0e0e0e]/20" />
    </div>
  );
}

/**
 * Intro phase — abstract AI body-scan backdrop, living Fitino logo,
 * typed headline, CTA after typing (funnel spec intro).
 */
export default function FunnelHero({ onStart, resume = false }) {
  const reduceMotion = useReducedMotion();
  const { typingDone, onTypingDone } = useTypingBubbleGate(1000);

  return (
    <section
      dir="rtl"
      className="funnel-screen relative isolate flex flex-col overflow-clip bg-[#0e0e0e] text-white"
    >
      <AiBodyScanBackdrop reduceMotion={reduceMotion} />

      <div className="relative z-10 flex justify-center px-4 pt-4">
        <Badge
          variant="outline"
          className="gap-2 border-white/15 bg-black/45 px-4 py-1.5 text-[11px] tracking-widest text-white/90 backdrop-blur-md"
        >
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          {HERO_COPY.funnelBadge || "ارزیابی هوشمند بدن · پایش ۲۴ ساعته AI"}
        </Badge>
      </div>

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

      {typingDone ? (
        <FunnelStickyBar className="border-white/10 bg-black/70" spacerClassName="h-28">
          <DelayedFunnelCta typingDone={typingDone} onClick={onStart}>
            {resume ? "ادامه ارزیابی از جایی که رها کردی" : "شروع ارزیابی هوشمند بدنم"}
            <ArrowLeft className="size-4" />
          </DelayedFunnelCta>
          <p className="mt-2 text-center text-xs text-white/45">
            رایگان · بدون نیاز به ثبت‌نام اولیه
          </p>
        </FunnelStickyBar>
      ) : null}
    </section>
  );
}
