"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const HERO_VIDEO = "/landing/statue.mp4";
const HERO_POSTER = "/landing/statue-poster.jpg";

const HERO_BADGE = "تلفیق هوش مصنوعی و مربیگری تخصصی برای تغییر ماندگار";

const HERO_FEATURES = [
  {
    title: "برنامه اختصاصی",
    desc: "طراحی دقیق تمرین و رژیم بر اساس فرم بدنی شما.",
  },
  {
    title: "پایش روزانه هوشمند",
    desc: "ارزیابی مداوم پیشرفت جهت پیشگیری از استپ وزنی.",
  },
  {
    title: "رژیم غذایی منعطف",
    desc: "تنظیم منو بر پایه سفره ایرانی و دسترسی آسان.",
  },
];

export default function Hero() {
  return (
    <section
      dir="rtl"
      className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col items-stretch justify-end overflow-hidden px-6 pt-10 pb-16 md:flex-row md:items-center md:justify-start md:gap-12 md:pt-16 md:pb-20"
    >
      {/* Mobile only: badge pinned to the very top of the hero */}
      <div className="absolute inset-x-0 top-3 z-20 flex justify-center px-4 md:hidden">
        <Badge
          variant="outline"
          className="max-w-full gap-2 border-border/80 bg-background/70 px-3 py-1.5 text-[11px] leading-relaxed tracking-wide shadow-sm backdrop-blur-md sm:text-xs"
        >
          <span className="size-2 shrink-0 animate-pulse rounded-full bg-primary" />
          <span className="line-clamp-2 text-center">⚡️ {HERO_BADGE}</span>
        </Badge>
      </div>

      {/*
        Mobile: absolute full-bleed background.
        Desktop: regular side panel in the flex row.
      */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="pointer-events-none absolute inset-0 z-0 md:pointer-events-auto md:relative md:inset-auto md:order-2 md:z-auto md:flex md:h-[600px] md:flex-1 md:items-center md:justify-center"
        aria-hidden
      >
        <div className="absolute inset-0 hidden rounded-full bg-primary/5 blur-[100px] md:block" />

        <div className="absolute inset-0 overflow-hidden md:relative md:mx-auto md:aspect-9/16 md:h-full md:w-auto md:max-w-full md:rounded-3xl md:border md:border-border/60 md:bg-card/40 md:shadow-xl md:backdrop-blur-sm">
          <video
            src={HERO_VIDEO}
            poster={HERO_POSTER}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-label="مجسمه مرمری یونانی"
            className="absolute inset-0 h-full w-full object-cover object-center md:rounded-3xl"
          />

          {/* Mobile scrim: clear top for subject, darker bottom for text */}
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/75 to-background/15 md:hidden" />
          <div className="absolute inset-0 bg-linear-to-l from-background/35 via-transparent to-transparent md:hidden" />

          {/* Desktop fade + floating chips */}
          <div className="pointer-events-none absolute inset-0 hidden rounded-3xl bg-linear-to-t from-background/80 via-transparent to-transparent md:block" />

          <Card className="absolute top-6 end-6 z-10 hidden max-w-[220px] animate-bounce border-primary/30 bg-card/80 py-3 shadow-lg backdrop-blur-md animation-duration-[4s] md:block">
            <CardContent className="px-4 py-0 text-start">
              <span className="mb-1 block text-xs tracking-widest text-primary">🎯 هدف</span>
              <span className="text-sm font-bold leading-snug text-foreground">
                عضله‌سازی و چربی‌سوزی همزمان
              </span>
            </CardContent>
          </Card>

          <Card className="absolute bottom-6 start-6 z-10 hidden max-w-[220px] animate-bounce border-chart-2/30 bg-card/80 py-3 shadow-lg backdrop-blur-md animation-duration-[5s] md:block">
            <CardContent className="px-4 py-0 text-start">
              <span className="mb-1 block text-xs tracking-widest text-chart-2">⚙️ طراحی</span>
              <span className="text-sm font-bold leading-snug text-foreground">
                اختصاصی برای شما
              </span>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 mt-[28vh] space-y-6 text-center sm:mt-[32vh] md:order-1 md:mt-0 md:flex-1 md:space-y-8 md:text-start"
      >
        <Badge
          variant="outline"
          className="mx-0 hidden max-w-xl gap-2 border-border/80 px-4 py-1.5 text-xs leading-relaxed tracking-wide md:inline-flex"
        >
          <span className="size-2 shrink-0 animate-pulse rounded-full bg-primary" />
          ⚡️ {HERO_BADGE}
        </Badge>

        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-[3.25rem]">
          برنامه تمرین و تغذیه‌ای که{" "}
          <span className="bg-linear-to-l from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
            دقیقاً متناسب با بدن شماست
          </span>
        </h1>

        <p className="mx-auto max-w-xl text-base leading-8 text-foreground/95 md:me-auto md:ms-0 md:text-lg md:text-foreground">
          در فیتینو، سیستم هوشمند روزانه تغییرات وزنی شما را تحلیل کرده و به مربی
          گزارش می‌دهد. این نظارت مداوم مانع از استپ وزنی شده و رسیدن شما به نتیجه قطعی
          را تضمین می‌کند.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
          <Button asChild size="lg" className="rounded-full px-8 shadow-md">
            <a href="/ali-rashidabadi" className="inline-flex items-center gap-2">
              شروع آنالیز رایگان بدنی 🚀
              <ArrowLeft className="size-4" />
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full border-border/80 bg-background/90 px-8 backdrop-blur-sm md:bg-background md:backdrop-blur-none"
          >
            <a href="#contact">مشاوره با تیم مربیگری 📞</a>
          </Button>
        </div>

        <div className="mx-auto grid w-full max-w-lg grid-cols-1 gap-4 border-t border-border/70 pt-8 text-start md:mx-0 md:max-w-none md:grid-cols-3 md:gap-5">
          {HERO_FEATURES.map((f) => (
            <div key={f.title} className="group flex gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary transition-transform group-hover:scale-110" />
              <div className="min-w-0 space-y-1">
                <span className="block text-sm font-semibold text-foreground">{f.title}</span>
                {f.desc ? (
                  <span className="block text-xs leading-6 text-foreground/80 md:text-muted-foreground">
                    {f.desc}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
