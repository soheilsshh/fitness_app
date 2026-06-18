"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Activity, Award, Star, ThumbsUp, Users, Wrench, Zap } from "lucide-react";
import { TiltCard } from "./landingEffects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import baseStatue from "@/assets/landing-page/non_body_builder_statue.png";
import sculptedStatue from "@/assets/landing-page/body_builder_statue.png";

const DEFAULT_STATS = [
  { value: "۱۲,۵۰۰+", label: "شاگردان فعال" },
  { value: "۸۷٪", label: "رضایت کاربران" },
  { value: "۴.۹/۵", label: "امتیاز رضایت" },
  { value: "۳۲۰+", label: "نتایج درخشان" },
];

const STAT_ICONS = [Users, ThumbsUp, Star, Award];
const STAT_ICON_CLASSES = ["text-primary", "text-chart-2", "text-primary", "text-chart-2"];

const FEATURES = [
  {
    icon: Wrench,
    title: "دقت مهندسی",
    desc: "هر تکرار و هر وعده غذایی با دقت ریاضی برای فیزیولوژی شما طراحی می‌شود.",
  },
  {
    icon: Zap,
    title: "تحول سریع",
    desc: "استفاده از پروتکل‌های فشرده برای رسیدن به حداکثر نتیجه در حداقل زمان ممکن.",
  },
  {
    icon: Activity,
    title: "ماندگاری نتیجه",
    desc: "تمرکز ما فقط روی تغییر موقت نیست، بلکه سبک زندگی شما را بازطراحی می‌کنیم.",
  },
];

export default function RecordsSection({ stats: apiStats }) {
  const STATS = (apiStats?.length ? apiStats : DEFAULT_STATS).map((s, i) => ({
    icon: STAT_ICONS[i % STAT_ICONS.length],
    iconClass: STAT_ICON_CLASSES[i % STAT_ICON_CLASSES.length],
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
    <section id="records" dir="rtl" className="relative scroll-mt-24 py-12 md:py-16">
      <div className="pointer-events-none absolute inset-0 bg-muted/30" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mb-16 space-y-4 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            مسیرت رو با{" "}
            <span className="bg-linear-to-l from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
              عدد و نتیجه
            </span>{" "}
            ببین
          </h2>
          <p className="text-base text-muted-foreground md:text-lg">
            ما به خروجی کارمان ایمان داریم؛ این آمار گویای همه چیز است.
          </p>
        </div>

        <div className="mb-20 grid items-stretch gap-8 md:grid-cols-2">
          <Card
            className="group/reveal relative h-[420px] cursor-crosshair overflow-hidden py-0 md:h-auto md:min-h-[520px]"
            onMouseMove={onRevealMove}
            onMouseLeave={onRevealLeave}
          >
            <CardContent className="relative h-full p-0">
              <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-foreground/5 to-transparent opacity-30" />
              <Image
                src={baseStatue}
                alt="مجسمه در حال تراش"
                fill
                className="z-10 object-cover object-top"
              />
              <div
                ref={overlayRef}
                className="absolute inset-0 z-20 transition-[clip-path] duration-75 ease-out"
                style={{ clipPath: "circle(0% at 50% 50%)" }}
              >
                <Image
                  src={sculptedStatue}
                  alt="مجسمه تراش‌خورده"
                  fill
                  className="object-cover object-top"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-6">
              {STATS.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <TiltCard key={s.label} delay={idx * 0.06} className="h-full">
                    <Card className="h-full bg-linear-to-t from-primary/5 to-card text-center shadow-xs">
                      <CardContent className="pt-6">
                        <Icon className={cn("mx-auto mb-4 size-10", s.iconClass)} />
                        <div className="text-3xl font-bold tabular-nums text-foreground">{s.value}</div>
                        <div className="mt-1 text-xs tracking-widest text-muted-foreground">{s.label}</div>
                      </CardContent>
                    </Card>
                  </TiltCard>
                );
              })}
            </div>

            <Card className="flex-1 border-primary/20 bg-card/60 backdrop-blur-sm">
              <CardHeader className="text-start">
                <CardTitle className="text-2xl">برنامه‌ای که «واقعاً» انجام می‌دی</CardTitle>
              </CardHeader>
              <CardContent className="text-start leading-7 text-muted-foreground">
                ما متعهد می‌شویم که تا رسیدن به فرم ایده‌آل، لحظه به لحظه در کنار شما
                باشیم. هنر ما، تراشیدن عضلات شماست.
              </CardContent>
            </Card>
          </div>
        </div>

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
              >
                <Card className="h-full bg-linear-to-t from-primary/5 to-card shadow-xs">
                  <CardContent className="space-y-4 pt-6 text-start">
                    <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Icon className="size-7" />
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground">{f.title}</h3>
                    <p className="leading-7 text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
