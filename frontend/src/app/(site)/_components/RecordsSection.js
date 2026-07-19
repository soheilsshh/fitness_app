"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Activity, TrendingUp, Users, Wrench, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import baseStatue from "@/assets/landing-page/non_body_builder_statue.png";
import sculptedStatue from "@/assets/landing-page/body_builder_statue.png";

const STATS = [
  {
    icon: Users,
    value: "+۱۲,۵۰۰",
    label: "تغییر بدنی موفق در پلتفرم فیتینو",
  },
  {
    icon: TrendingUp,
    value: "۸۷٪",
    label: "ماندگاری و پایبندی بیشتر به رژیم غذایی",
  },
];

const FEATURES = [
  {
    icon: Wrench,
    title: "تنظیم علمی و دقیق",
    desc: "طراحی سیستماتیک تمرینات و محاسبه دقیق رژیم غذایی بر اساس ساختار فیزیولوژیک شما.",
  },
  {
    icon: Zap,
    title: "بازدهی حداکثری در زمان",
    desc: "استفاده از متدهای بهینه‌شده جهت دستیابی به بالاترین سطح آمادگی جسمانی در کوتاه‌ترین زمان ممکن.",
  },
  {
    icon: Activity,
    title: "ماندگاری نتایج",
    desc: "تمرکز بر تثبیت دستاوردها و اصلاح هوشمندانه سبک زندگی جهت جلوگیری از بازگشت به وضعیت قبل.",
  },
];

export default function RecordsSection() {
  const overlayRef = useRef(null);

  const onRevealMove = (e) => {
    const el = overlayRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.clipPath = `circle(120px at ${x}% ${y}%)`;
  };

  const onRevealLeave = () => {
    const el = overlayRef.current;
    if (el) el.style.clipPath = "circle(0% at 50% 50%)";
  };

  return (
    <section id="records" dir="rtl" className="relative scroll-mt-24 py-12 md:py-16">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-muted/40 via-background to-background" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6">
        <div className="mb-8 space-y-3 text-center md:mb-10">
          <p className="text-xs font-iranianSansDemiBold tracking-wide text-primary">
            📊 سنجش علمی پیشرفت بر اساس داده‌های واقعی
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            مسیر پیشرفت خود را با{" "}
            <span className="bg-linear-to-l from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
              اعداد و نتایج واقعی
            </span>{" "}
            ارزیابی کنید
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-foreground/85 md:text-base">
            ترکیب پایش هوشمند و نظارت مستقیم مربی، رسیدن به هدف را از یک احتمال، به یک مسیر
            مطمئن و مهندسی‌شده تبدیل می‌کند:
          </p>
        </div>

        <div className="mb-8 grid items-stretch gap-4 md:mb-10 md:grid-cols-2 md:gap-5">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
            className="group/reveal relative h-[360px] overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm md:h-auto md:min-h-[420px]"
            onMouseMove={onRevealMove}
            onMouseLeave={onRevealLeave}
          >
            <div className="pointer-events-none absolute inset-0 z-30 bg-linear-to-t from-background/50 via-transparent to-transparent" />

            <Image
              src={sculptedStatue}
              alt="مجسمه تراش‌خورده — نتیجه نهایی"
              fill
              className="object-cover object-top md:hidden"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={false}
            />

            <Image
              src={baseStatue}
              alt="مجسمه پیش از تراش"
              fill
              className="hidden object-cover object-top md:block"
              sizes="50vw"
            />
            <div
              ref={overlayRef}
              className="absolute inset-0 z-20 hidden transition-[clip-path] duration-75 ease-out md:block"
              style={{ clipPath: "circle(0% at 50% 50%)" }}
              aria-hidden
            >
              <Image
                src={sculptedStatue}
                alt=""
                fill
                className="object-cover object-top"
                sizes="50vw"
              />
            </div>

            <div className="absolute inset-x-0 bottom-0 z-40 p-4 md:p-5">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-[11px] leading-snug text-foreground/90 backdrop-blur-md">
                <span className="hidden size-1.5 shrink-0 animate-pulse rounded-full bg-primary md:inline-block" />
                <span>🔄 تصویر را جابجا کنید تا قدرت تغییر با فیتینو را مشاهده کنید</span>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {STATS.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm transition-colors hover:border-primary/30 sm:p-5"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="text-xs leading-5 text-foreground/75">{s.label}</span>
                    </div>
                    <div
                      className="mt-3 text-2xl font-iranianSansBlack tabular-nums tracking-tight text-foreground sm:text-3xl"
                      dir="ltr"
                    >
                      {s.value}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="flex flex-1 flex-col justify-center rounded-3xl border border-primary/25 bg-primary/5 p-5 text-start sm:p-6"
            >
              <h3 className="text-lg font-iranianSansBlack text-foreground sm:text-xl">
                ⚡️ برنامه‌ای اجراشدنی، بدون خستگی و رها شدن در مسیر
              </h3>
              <p className="mt-2 text-sm leading-7 text-foreground/85 md:text-base">
                بزرگترین عامل شکست رژیم‌ها، سختی بیش از حد منو و عدم پیگیری مربی است. فیتینو
                برنامه غذایی شما را بر اساس غذاهای روزمره و خانگی تنظیم می‌کند. سیستم هوشمند با
                همراهی مربی، روزانه روند شما را پایش می‌کند تا بدون استپ وزنی به اندام ایده‌آل
                خود برسید.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {FEATURES.map((f, idx) => {
            const Icon = f.icon;
            return (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-colors hover:border-primary/30"
              >
                <h3 className="flex items-center gap-3 text-base font-iranianSansBlack text-foreground sm:text-lg">
                  <span
                    className={cn(
                      "inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
                      "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span>{f.title}</span>
                </h3>
                <p className="mt-3 text-sm leading-7 text-foreground/85">{f.desc}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
