"use client";

import { motion } from "framer-motion";
import { FiArrowLeft, FiCheckCircle } from "react-icons/fi";

const HERO_VIDEO = "/landing/statue.mp4";

const DEFAULT_FEATURES = [
  "برنامه غذایی اختصاصی",
  "پشتیبانی ۲۴ ساعته",
  "آنالیز پیشرفته عضلانی",
  "تمرینات اصلاحی",
  "مشاوره تخصصی",
  "دسترسی نامحدود",
];

export default function Hero({ settings }) {
  const FEATURES = settings?.featureBullets?.items?.length
    ? settings.featureBullets.items
    : DEFAULT_FEATURES;

  return (
    <section className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col items-center gap-12 overflow-hidden px-6 pt-10 pb-20 md:flex-row-reverse md:pt-16">
      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="z-10 flex-1 space-y-8 text-right"
      >
        <div className="glass inline-flex items-center gap-2 rounded-full border border-surface-tint/20 px-4 py-1 text-xs tracking-widest text-surface-tint">
          <span className="h-2 w-2 animate-pulse rounded-full bg-surface-tint" />
          آکادمی اختصاصی تناسب اندام
        </div>

        <h1 className="text-4xl font-extrabold leading-tight text-primary md:text-6xl">
          فیتنس رو <span className="gradient-text">هوشمند</span> شروع کن
        </h1>

        <p className="ml-auto max-w-xl text-base leading-8 text-on-surface-variant md:text-lg">
          در فیت‌پرو، ما ورزش را یک علم و بدن را یک بوم نقاشی می‌بینیم. با استفاده از
          متدهای علمی و مربیان تراز اول، مسیر حرفه‌ای شما را برای رسیدن به اوج
          توانایی‌های جسمی طراحی می‌کنیم.
        </p>

        <div className="flex flex-row-reverse items-center gap-4">
          <a
            href="#programs"
            className="flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-bold text-background shadow-2xl transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(251,255,250,0.2)]"
          >
            مشاهده برنامه‌ها
            <FiArrowLeft className="text-xl" />
          </a>
          <a
            href="#contact"
            className="glass rounded-full border border-white/10 px-8 py-4 font-bold text-primary transition-colors hover:bg-white/5"
          >
            مشاوره رایگان
          </a>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/10 pt-8">
          {FEATURES.map((t, index) => (
            <div
              key={t}
              className={[
                "check-pulse flex flex-row-reverse items-center gap-3",
                index > 2 ? "hidden md:flex" : "",
              ].join(" ")}
            >
              <FiCheckCircle className="check-pulse-icon shrink-0 text-surface-tint" />
              <span className="text-on-surface-variant">{t}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Statue */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="relative flex h-[600px] w-full flex-1 items-center justify-center"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-surface-tint/5 to-transparent blur-[100px]" />
        <div className="statue-frame glass group relative mx-auto aspect-[9/16] h-full w-auto max-w-full overflow-hidden rounded-[3rem] border border-white/5">
          <video
            src={HERO_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-label="مجسمه مرمری یونانی"
            className="absolute inset-0 z-10 h-full w-full rounded-[2.5rem] object-cover object-center drop-shadow-[0_0_50px_rgba(0,225,171,0.2)]"
          />

          {/* Floating badges */}
          <div className="glass absolute top-6 right-6 z-20 animate-bounce rounded-2xl border border-surface-tint/30 p-3 [animation-duration:4s]">
            <span className="mb-1 block text-xs tracking-widest text-surface-tint">هدف</span>
            <span className="text-lg font-bold text-primary">عضله‌سازی</span>
          </div>
          <div className="glass absolute bottom-6 left-6 z-20 animate-bounce rounded-2xl border border-secondary-container/30 p-3 [animation-duration:5s]">
            <span className="mb-1 block text-xs tracking-widest text-secondary-container">سطح</span>
            <span className="text-lg font-bold text-primary">متوسط تا حرفه‌ای</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
