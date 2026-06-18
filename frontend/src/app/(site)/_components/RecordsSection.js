"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiThumbsUp,
  FiStar,
  FiAward,
  FiTool,
  FiZap,
  FiActivity,
} from "react-icons/fi";
import { TiltCard } from "./landingEffects";
import baseStatue from "@/assets/landing-page/non_body_builder_statue.png";
import sculptedStatue from "@/assets/landing-page/body_builder_statue.png";

const DEFAULT_STATS = [
  { value: "۱۲,۵۰۰+", label: "شاگردان فعال" },
  { value: "۸۷٪", label: "رضایت کاربران" },
  { value: "۴.۹/۵", label: "امتیاز رضایت" },
  { value: "۳۲۰+", label: "نتایج درخشان" },
];

const STAT_ICONS = [FiUsers, FiThumbsUp, FiStar, FiAward];
const STAT_ICON_COLORS = ["text-surface-tint", "text-secondary-container", "text-surface-tint", "text-secondary-container"];

const FEATURES = [
  {
    icon: FiTool,
    title: "دقت مهندسی",
    desc: "هر تکرار و هر وعده غذایی با دقت ریاضی برای فیزیولوژی شما طراحی می‌شود.",
  },
  {
    icon: FiZap,
    title: "تحول سریع",
    desc: "استفاده از پروتکل‌های فشرده برای رسیدن به حداکثر نتیجه در حداقل زمان ممکن.",
  },
  {
    icon: FiActivity,
    title: "ماندگاری نتیجه",
    desc: "تمرکز ما فقط روی تغییر موقت نیست، بلکه سبک زندگی شما را بازطراحی می‌کنیم.",
  },
];

export default function RecordsSection({ stats: apiStats }) {
  const STATS = (apiStats?.length ? apiStats : DEFAULT_STATS).map((s, i) => ({
    icon: STAT_ICONS[i % STAT_ICONS.length],
    color: STAT_ICON_COLORS[i % STAT_ICON_COLORS.length],
    value: s.value,
    label: s.label,
  }));

  const overlayRef = useRef(null);

  const onRevealMove = (e) => {
    const el = overlayRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.clipPath = `circle(110px at ${x}% ${y}%)`;
  };

  const onRevealLeave = () => {
    const el = overlayRef.current;
    if (el) el.style.clipPath = "circle(0% at 50% 50%)";
  };

  return (
    <section id="records" className="relative scroll-mt-24 py-12 md:py-16">
      <div className="pointer-events-none absolute inset-0 bg-surface-container-low/50" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mb-16 space-y-4 text-center">
          <h2 className="text-4xl font-extrabold text-primary md:text-5xl">
            مسیرت رو با <span className="gradient-text">عدد و نتیجه</span> ببین
          </h2>
          <p className="text-base text-on-surface-variant md:text-lg">
            ما به خروجی کارمان ایمان داریم؛ این آمار گویای همه چیز است.
          </p>
        </div>

        {/* Statue + stats */}
        <div className="mb-20 grid items-stretch gap-8 md:grid-cols-2">
          {/* Interactive statue reveal (right in RTL) */}
          <div
            className="group/reveal relative h-[420px] cursor-crosshair overflow-hidden rounded-[2rem] glow-card md:h-auto md:min-h-[520px]"
            onMouseMove={onRevealMove}
            onMouseLeave={onRevealLeave}
          >
            <div className="marble-mask absolute inset-0" />
            <Image src={baseStatue} alt="مجسمه در حال تراش" fill className="z-10 rounded-[2rem] object-cover object-top" />
            <div
              ref={overlayRef}
              className="absolute inset-0 z-20 transition-[clip-path] duration-75 ease-out"
              style={{ clipPath: "circle(0% at 50% 50%)" }}
            >
              <Image src={sculptedStatue} alt="مجسمه تراش‌خورده" fill className="rounded-[2rem] object-cover object-top" />
            </div>
          </div>

          {/* 4 stat cards (left) + caption */}
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-6">
              {STATS.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <TiltCard key={s.label} delay={idx * 0.06} className="glow-card h-full rounded-[2rem] p-6 text-center">
                    <Icon className={`mx-auto mb-4 text-4xl ${s.color}`} />
                    <div className="text-3xl font-bold text-primary">{s.value}</div>
                    <div className="mt-1 text-xstext-on-surface-variant">{s.label}</div>
                  </TiltCard>
                );
              })}
            </div>

            <div className="glass flex-1 rounded-[2rem] border border-surface-tint/20 p-6 text-right">
              <h5 className="mb-2 text-2xl font-semibold text-primary">
                برنامه‌ای که «واقعاً» انجام می‌دی
              </h5>
              <p className="leading-7 text-on-surface-variant">
                ما متعهد می‌شویم که تا رسیدن به فرم ایده‌آل، لحظه به لحظه در کنار شما
                باشیم. هنر ما، تراشیدن عضلات شماست.
              </p>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f, idx) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.6, delay: idx * 0.06 }}
                className="glow-card space-y-4 rounded-[2rem] p-10 text-right"
              >
                <div className="shimmer-btn mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                  <Icon className="text-3xl text-background" />
                </div>
                <h4 className="text-2xl font-semibold text-primary">{f.title}</h4>
                <p className="leading-7 text-on-surface-variant">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
