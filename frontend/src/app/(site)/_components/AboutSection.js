"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiAward,
  FiTrendingUp,
  FiMessageCircle,
  FiArrowLeft,
} from "react-icons/fi";
import { FaDumbbell, FaAppleAlt, FaHeartbeat } from "react-icons/fa";

// Maps a pillar icon key (from the API) to its icon component.
const PILLAR_ICONS = {
  award: FiAward,
  dumbbell: FaDumbbell,
  apple: FaAppleAlt,
  trending: FiTrendingUp,
  message: FiMessageCircle,
  heartbeat: FaHeartbeat,
};

// Fallback value pillars — used when the API doesn't provide custom ones.
const DEFAULT_PILLARS = [
  { icon: "award", title: "مربیان متخصص و تاییدشده", desc: "تیم مربیان حرفه‌ای و دارای مدرک، همراه شخصی شما در تمام مسیر تمرین." },
  { icon: "dumbbell", title: "برنامه تمرین اختصاصی", desc: "هر حرکت و هر ست متناسب با بدن، سطح و هدف شما طراحی و به‌روزرسانی می‌شود." },
  { icon: "apple", title: "برنامه تغذیه علمی", desc: "رژیم غذایی دقیق و قابل اجرا، کاملاً هماهنگ با تمرینات و سبک زندگی شما." },
  { icon: "trending", title: "پیگیری پیشرفت", desc: "نتایج خود را با عدد و آمار دنبال کنید؛ هر هفته یک قدم به هدف نزدیک‌تر." },
  { icon: "message", title: "پشتیبانی همیشگی مربی", desc: "هر زمان سوال یا چالشی داشتی، مربی‌ات مستقیماً کنارت است." },
  { icon: "heartbeat", title: "تمرین در باشگاه یا خانه", desc: "برنامه‌ها برای هر امکانات و شرایطی قابل اجرا هستند، هرجا که باشی." },
];

// Onboarding flow — used when the API doesn't provide custom steps.
const DEFAULT_STEPS = [
  { id: "s1", title: "ثبت‌نام", text: "پروفایل خود را تکمیل کنید و هدفتان را مشخص کنید." },
  { id: "s2", title: "انتخاب مربی", text: "از بین مربیان منتشرشده، پلن مناسب را انتخاب کنید." },
  { id: "s3", title: "شروع برنامه", text: "برنامه تمرین و تغذیه را در پنل کاربری دنبال کنید." },
];

export default function AboutSection({ steps, pillars }) {
  const stepItems = steps?.length ? steps : DEFAULT_STEPS;
  const pillarItems = pillars?.length ? pillars : DEFAULT_PILLARS;

  return (
    <section id="about" className="mx-auto max-w-7xl scroll-mt-24 overflow-hidden px-6 py-12 md:py-16">
      {/* How it works — onboarding flow */}
      <div className="mb-20">
        <motion.h3
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-right text-3xl font-extrabold text-primary md:text-4xl"
        >
          فقط <span className="gradient-text">سه قدم</span> تا شروع
        </motion.h3>

        <div className="grid gap-6 md:grid-cols-3">
          {stepItems.map((s, idx) => (
            <motion.div
              key={s.id || s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="glow-card relative flex h-full flex-col gap-3 rounded-2xl p-6 text-right"
            >
              <span
                aria-hidden
                className="gradient-text text-5xl font-extrabold leading-none opacity-80"
              >
                {idx + 1}
              </span>
              <h4 className="text-2xl font-semibold text-primary">{s.title}</h4>
              <p className="leading-7 text-on-surface-variant">{s.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex justify-end">
          <Link
            href="/coaches"
            className="flex items-center gap-2 rounded-full bg-surface-tint px-8 py-4 font-bold text-on-primary shadow-2xl transition-transform hover:scale-105"
          >
            انتخاب مربی و شروع
            <FiArrowLeft className="text-xl" />
          </Link>
        </div>
      </div>

      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.6 }}
        className="mb-12 space-y-4 text-right"
      >
        <div className="glass inline-flex items-center gap-2 rounded-full border border-surface-tint/20 px-4 py-1 text-xs text-surface-tint">
          <span className="h-2 w-2 animate-pulse rounded-full bg-surface-tint" />
          باشگاه هوشمند و مربیگری اختصاصی
        </div>
        <h2 className="text-4xl font-extrabold text-primary md:text-5xl">
          چرا <span className="gradient-text">FitPro؟</span>
        </h2>
        <p className="max-w-2xl text-base leading-8 text-on-surface-variant md:text-lg">
          فیت‌پرو یک باشگاه دیجیتال است که تمرین، تغذیه و مربیگری حرفه‌ای را در یک پلتفرم
          جمع می‌کند؛ از انتخاب مربی تا رسیدن به فرم ایده‌آل، در هر قدم کنار شما هستیم.
        </p>
      </motion.div>

      {/* Value pillars */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pillarItems.map((p, idx) => {
          const Icon = PILLAR_ICONS[p.icon] || FiAward;
          const color = idx % 2 === 0 ? "text-surface-tint" : "text-secondary-container";
          return (
            <motion.div
              key={p.id || p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="group glow-card flex h-full flex-col gap-4 rounded-2xl p-6 text-right"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted ring-1 ring-border transition-transform group-hover:scale-110">
                <Icon className={`text-3xl ${color}`} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary">{p.title}</h3>
                <p className="mt-2 leading-7 text-on-surface-variant">{p.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
