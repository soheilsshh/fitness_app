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

const PILLAR_ICONS = {
  award: FiAward,
  dumbbell: FaDumbbell,
  apple: FaAppleAlt,
  trending: FiTrendingUp,
  message: FiMessageCircle,
  heartbeat: FaHeartbeat,
};

const PILLARS = [
  {
    icon: "award",
    title: "👤 نظارت مستقیم مربی ارشد",
    desc: "هدایت، بازبینی و تایید مداوم روند پیشرفت شما توسط مربی علی جهت اطمینان از صحت و کارایی تمام برنامه‌ها.",
  },
  {
    icon: "dumbbell",
    title: "🏋️‍♂️ طراحی سیستماتیک تمرینات",
    desc: "تنظیم دقیق تک‌تک حرکت‌ها و ست‌ها متناسب با ساختار فیزیولوژیک، سطح توانایی و اهداف اختصاصی شما.",
  },
  {
    icon: "apple",
    title: "🍏 منوی غذایی منعطف و علمی",
    desc: "رژیم غذایی منطبق بر سفره ایرانی و ترجیحات شما، با هدف تنظیم متابولیسم و بدون محدودیت‌های طاقت‌فرسا.",
  },
  {
    icon: "trending",
    title: "🤖 پایش هوشمند و مداوم",
    desc: "تحلیل روزانه شاخص‌های بدنی توسط سیستم هوشمند جهت پیشگیری از استپ وزنی و اصلاح فوری مسیر حرکت.",
  },
  {
    icon: "message",
    title: "💬 پشتیبانی متعهدانه و مستمر",
    desc: "امکان ارتباط مستقیم و رفع ابهام در تمام مراحل دوره، با هدف حفظ بالاترین سطح انگیزه و استمرار شما.",
  },
  {
    icon: "heartbeat",
    title: "🏠 انطباق کامل با سبک زندگی",
    desc: "طراحی هوشمندانه برنامه‌ها بر اساس بستر تمرینی مورد نظر شما (باشگاه یا منزل) با حداقل تجهیزات در دسترس.",
  },
];

const STEPS = [
  {
    id: "s1",
    title: "ثبت شاخص‌های پیشرفت",
    text: "اطلاعات اولیه، رکوردهای تمرینی و تغییرات بدنی خود را به‌سادگی در پنل کاربری ثبت کنید.",
  },
  {
    id: "s2",
    title: "تحلیل هوشمند روند",
    text: "سیستم تغییرات شما را ارزیابی کرده و برنامه را جهت بازدهی بیشتر به‌روزرسانی می‌کند.",
  },
  {
    id: "s3",
    title: "تثبیت و ماندگاری نتیجه",
    text: "با هدایت مستمر مربی علی، مسیر تغییرات خود را بدون استپ وزنی و با پایداری کامل طی کنید.",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="mx-auto max-w-7xl scroll-mt-24 overflow-hidden px-6 py-12 md:py-16">
      <div className="mb-20">
        <motion.h3
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center text-3xl font-extrabold text-primary md:text-4xl"
        >
          فقط <span className="gradient-text">۳ قدم</span> تا آغاز تحول
        </motion.h3>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="glow-card relative flex h-full flex-col gap-3 rounded-2xl p-6 text-right"
            >
              <h4 className="flex items-baseline gap-3 text-2xl font-semibold text-primary">
                <span
                  aria-hidden
                  className="gradient-text shrink-0 text-4xl font-extrabold leading-none opacity-80 md:text-5xl"
                >
                  {idx + 1}
                </span>
                <span>{s.title}</span>
              </h4>
              <p className="leading-7 text-foreground">{s.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/ali-rashidabadi"
            className="inline-flex items-center gap-2 rounded-full bg-surface-tint px-8 py-4 font-bold text-on-primary shadow-2xl transition-transform hover:scale-105"
          >
            ورود به آنالیز هوشمند و شروع دوره 🚀
            <FiArrowLeft className="text-xl" />
          </Link>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.6 }}
        className="mb-12 flex flex-col items-center space-y-4 text-center"
      >
        <div className="glass inline-flex items-center gap-2 rounded-full border border-surface-tint/20 px-4 py-1 text-xs text-surface-tint">
          <span className="h-2 w-2 animate-pulse rounded-full bg-surface-tint" />
          ⚡️ نسل نوین مدیریت تندرستی و تناسب اندام
        </div>
        <h2 className="text-4xl font-extrabold text-primary md:text-5xl">
          چرا <span className="gradient-text">فیتینو</span> متمایز است؟
        </h2>
        <p className="max-w-2xl text-base leading-8 text-foreground md:text-lg">
          فیتینو با تلفیق نظارت مربی پیشرو و تحلیل مداوم الگوریتم‌های هوشمند، تمام نیازهای تمرینی،
          تغذیه‌ای و پایش روزانه شما را در یک بستر یکپارچه برطرف می‌کند تا دستیابی به هدف، قطعی
          باشد.
        </p>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PILLARS.map((p, idx) => {
          const Icon = PILLAR_ICONS[p.icon] || FiAward;
          const color = idx % 2 === 0 ? "text-surface-tint" : "text-secondary-container";
          return (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="group glow-card flex h-full flex-col gap-3 rounded-2xl p-6 text-right"
            >
              <h3 className="flex items-center gap-3 text-xl font-semibold text-primary">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted ring-1 ring-border transition-transform group-hover:scale-110 md:h-14 md:w-14">
                  <Icon className={`text-2xl md:text-3xl ${color}`} />
                </span>
                <span>{p.title}</span>
              </h3>
              <p className="leading-7 text-foreground">{p.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
