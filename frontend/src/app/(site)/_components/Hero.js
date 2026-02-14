"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FiArrowDownRight, FiCheckCircle } from "react-icons/fi";

export default function Hero() {
  const newLocal = "relative overflow-hidden rounded-4xl ";
  const FEATURES = [
    "برنامه شخصی‌سازی‌شده",
    "پشتیبانی و پیگیری",
    "قابل استفاده روی موبایل",
    "بدون نیاز به تجهیزات خاص",
    "قابل تنظیم بر اساس سطح",
    "نتایج قابل اندازه‌گیری",
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-30 h-130 w-130 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-10  pt-16 md:pt-2۰ md:grid-cols-2 ">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="px-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            برنامه‌های تمرینی + تغذیه، متناسب با هدف شما
          </div>

          <h1 className="mt-5 text-3xl font-extrabold leading-tight md:text-5xl">
            فیتنس رو <span className="text-emerald-300">هوشمند</span> شروع کن،
            <br className="hidden md:block" /> نتیجه رو{" "}
            <span className="text-cyan-300">قابل اندازه‌گیری</span> ببین
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300 md:text-base">
            برنامه‌های تخصصی برای چربی‌سوزی، عضله‌سازی و تناسب اندام. با پلن‌های
            قابل خرید، مسیرت رو دقیق و حرفه‌ای جلو ببر.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#programs"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-zinc-200"
            >
              مشاهده برنامه‌ها <FiArrowDownRight />
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/10"
            >
              مشاوره رایگان
            </a>
          </div>

          <div className="mt-7 grid max-w-xl grid-cols-2 gap-3 text-sm text-zinc-200 md:grid-cols-3">
            {FEATURES.map((t, index) => (
              <div
                key={t}
                className={[
                  "flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3",
                  index > 3 ? "hidden md:flex" : "",
                ].join(" ")}
              >
                <FiCheckCircle className="text-emerald-300 shrink-0" />
                <span className="text-xs md:text-sm">{t}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative md:-translate-y-13"
        >
          <div className={newLocal}>
            <div className="relative aspect-4/5 w-full md:aspect-5/5">
              <Image
                src="/images/22.png"
                alt="Fitness athlete"
                fill
                priority
                className="object-cover"
              />
              {/* soft overlay */}
            </div>

            {/* badges */}
            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/55 px-4 py-3 backdrop-blur">
                <div className="text-[11px] text-zinc-300">هدف</div>
                <div className="mt-1 text-sm font-bold text-white">
                  عضله‌سازی
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-950/55 px-4 py-3 backdrop-blur">
                <div className="text-[11px] text-zinc-300">سطح</div>
                <div className="mt-1 text-sm font-bold text-white">
                  متوسط تا حرفه‌ای
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-emerald-400/20 blur-2xl" />
        </motion.div>
      </div>
    </section>
  );
}
