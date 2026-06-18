"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    <section
      dir="rtl"
      className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col items-center gap-12 overflow-hidden px-6 pt-10 pb-20 md:flex-row-reverse md:pt-16"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="z-10 flex-1 space-y-8 text-start"
      >
        <Badge variant="outline" className="gap-2 px-4 py-1.5 text-xs tracking-widest">
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          آکادمی اختصاصی تناسب اندام
        </Badge>

        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
          فیتنس رو{" "}
          <span className="bg-linear-to-l from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
            هوشمند
          </span>{" "}
          شروع کن
        </h1>

        <p className="ms-auto max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
          در فیت‌پرو، ما ورزش را یک علم و بدن را یک بوم نقاشی می‌بینیم. با استفاده از
          متدهای علمی و مربیان تراز اول، مسیر حرفه‌ای شما را برای رسیدن به اوج
          توانایی‌های جسمی طراحی می‌کنیم.
        </p>

        <div className="flex flex-row-reverse items-center gap-3">
          <Button asChild size="lg" className="rounded-full px-8">
            <a href="#programs">
              مشاهده برنامه‌ها
              <ArrowLeft className="size-4" />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8">
            <a href="#contact">مشاوره رایگان</a>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-8">
          {FEATURES.map((t, index) => (
            <div
              key={t}
              className={cn(
                "group flex flex-row-reverse items-center gap-3",
                index > 2 ? "hidden md:flex" : ""
              )}
            >
              <CheckCircle2 className="size-5 shrink-0 text-primary transition-transform group-hover:scale-110" />
              <span className="text-sm text-muted-foreground">{t}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="relative flex h-[600px] w-full flex-1 items-center justify-center"
      >
        <div className="absolute inset-0 rounded-full bg-primary/5 blur-[100px]" />

        <Card className="relative mx-auto aspect-9/16 h-full w-auto max-w-full overflow-hidden rounded-3xl border-border/60 bg-card/40 py-0 shadow-xl backdrop-blur-sm">
          <CardContent className="relative h-full p-0">
            <video
              src={HERO_VIDEO}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              aria-label="مجسمه مرمری یونانی"
              className="absolute inset-0 z-10 h-full w-full rounded-3xl object-cover object-center"
            />
            <div className="pointer-events-none absolute inset-0 z-20 rounded-3xl bg-linear-to-t from-surface/80 via-transparent to-transparent" />

            <Card className="absolute top-6 end-6 z-30 animate-bounce border-primary/30 bg-card/80 py-3 shadow-lg backdrop-blur-md animation-duration-[4s]">
              <CardContent className="px-4 py-0 text-start">
                <span className="mb-1 block text-xs tracking-widest text-primary">هدف</span>
                <span className="text-lg font-bold text-foreground">عضله‌سازی</span>
              </CardContent>
            </Card>

            <Card className="absolute bottom-6 start-6 z-30 animate-bounce border-chart-2/30 bg-card/80 py-3 shadow-lg backdrop-blur-md animation-duration-[5s]">
              <CardContent className="px-4 py-0 text-start">
                <span className="mb-1 block text-xs tracking-widest text-chart-2">سطح</span>
                <span className="text-lg font-bold text-foreground">متوسط تا حرفه‌ای</span>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
