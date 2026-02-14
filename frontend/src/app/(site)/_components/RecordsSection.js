"use client";

import { motion } from "framer-motion";
import { FiTrendingUp, FiUsers, FiStar, FiAward } from "react-icons/fi";

const STATS = [
  { icon: FiUsers, value: "12,500+", label: "کاربر فعال" },
  { icon: FiTrendingUp, value: "87%", label: "رضایت از نتیجه" },
  { icon: FiStar, value: "4.9/5", label: "امتیاز کاربران" },
  { icon: FiAward, value: "320+", label: "نتیجه موفق ثبت‌شده" },
];

export default function RecordsSection() {
  return (
    <section id="records" className="scroll-mt-24 py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200">
              سوابق و نتایج
              <span className="h-1 w-1 rounded-full bg-white/30" />
              داده‌محور و قابل اندازه‌گیری
            </div>
            <h2 className="mt-3 text-2xl font-extrabold md:text-3xl">
              مسیرت رو با <span className="text-emerald-300">عدد و نتیجه</span> ببین
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
              با شاخص‌های قابل اندازه‌گیری، دقیق‌تر پیش می‌ری؛ نه حدس و گمان.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.6, delay: idx * 0.06 }}
                className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.85)]"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/40">
                  <Icon className="text-emerald-300 text-xl" />
                </div>
                <div className="mt-4 text-2xl font-extrabold text-white">
                  {s.value}
                </div>
                <div className="mt-1 text-sm text-zinc-300">{s.label}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            {
              t: "ثبت پیشرفت",
              d: "وزن، دور کمر، رکوردهای تمرینی و عکس‌های دوره‌ای رو ثبت کن.",
            },
            {
              t: "تحلیل روند",
              d: "روند تغییراتت رو ببین و پلن رو بر اساس شرایطت تنظیم کن.",
            },
            {
              t: "پایداری نتیجه",
              d: "با رویکرد مرحله‌ای، نتیجه رو پایدار نگه دار.",
            },
          ].map((c, idx) => (
            <motion.div
              key={c.t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.6, delay: 0.05 + idx * 0.06 }}
              className="rounded-[28px] border border-white/10 bg-zinc-950/30 p-6"
            >
              <div className="text-lg font-extrabold text-white">{c.t}</div>
              <p className="mt-2 text-sm leading-7 text-zinc-300">{c.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
