"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const HERO_VIDEO = "/landing/statue.mp4";
const HERO_POSTER = "/landing/statue-poster.jpg";

const DEFAULT_FEATURES = [
  "برنامه غذایی اختصاصی",
  "پشتیبانی ۲۴ ساعته",
  "آنالیز پیشرفته عضلانی",
  "تمرینات اصلاحی",
  "مشاوره تخصصی",
  "دسترسی نامحدود",
];

function resolveHeroFeatures(items) {
  if (!Array.isArray(items) || items.length < 3) return DEFAULT_FEATURES;
  const cleaned = items.map((t) => String(t || "").trim()).filter(Boolean);
  // Guard against accidental CMS wipe / tiny placeholders from bad saves.
  if (cleaned.length < 3 || cleaned.every((t) => t.length < 4)) {
    return DEFAULT_FEATURES;
  }
  return cleaned;
}

export default function Hero({ settings }) {
  const FEATURES = resolveHeroFeatures(settings?.featureBullets?.items);

  return (
    <section
      dir="rtl"
      className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col items-stretch justify-end overflow-hidden px-6 pt-10 pb-16 md:flex-row md:items-center md:justify-start md:gap-12 md:pt-16 md:pb-20"
    >
      {/* Mobile only: badge pinned to the very top of the hero */}
      <div className="absolute inset-x-0 top-3 z-20 flex justify-center px-4 md:hidden">
        <Badge
          variant="outline"
          className="gap-2 border-border/80 bg-background/70 px-4 py-1.5 text-xs tracking-widest shadow-sm backdrop-blur-md"
        >
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          آکادمی اختصاصی تناسب اندام
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

          <Card className="absolute top-6 end-6 z-10 hidden animate-bounce border-primary/30 bg-card/80 py-3 shadow-lg backdrop-blur-md animation-duration-[4s] md:block">
            <CardContent className="px-4 py-0 text-start">
              <span className="mb-1 block text-xs tracking-widest text-primary">هدف</span>
              <span className="text-lg font-bold text-foreground">عضله‌سازی</span>
            </CardContent>
          </Card>

          <Card className="absolute bottom-6 start-6 z-10 hidden animate-bounce border-chart-2/30 bg-card/80 py-3 shadow-lg backdrop-blur-md animation-duration-[5s] md:block">
            <CardContent className="px-4 py-0 text-start">
              <span className="mb-1 block text-xs tracking-widest text-chart-2">سطح</span>
              <span className="text-lg font-bold text-foreground">متوسط تا حرفه‌ای</span>
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
          className="mx-0 hidden gap-2 border-border/80 px-4 py-1.5 text-xs tracking-widest md:inline-flex"
        >
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

        <p className="mx-auto max-w-xl text-base leading-8 text-foreground/95 md:me-auto md:ms-0 md:text-lg md:text-foreground">
          در فیتینو، ما ورزش را یک علم و بدن را یک بوم نقاشی می‌بینیم. با استفاده از
          متدهای علمی و مربیان تراز اول، مسیر حرفه‌ای شما را برای رسیدن به اوج
          توانایی‌های جسمی طراحی می‌کنیم.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
          <Button asChild size="lg" className="rounded-full px-8 shadow-md">
            <a href="#programs" className="inline-flex items-center gap-2">
              <ArrowLeft className="size-4" />
              مشاهده برنامه‌ها
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full border-border/80 bg-background/55 px-8 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none"
          >
            <a href="#contact">مشاوره رایگان</a>
          </Button>
        </div>

        <div className="mx-auto grid w-full max-w-lg grid-cols-3 justify-items-center gap-2 border-t border-border/70 pt-8 md:mx-0 md:max-w-none md:grid-cols-2 md:justify-items-stretch md:gap-4">
          {FEATURES.map((t, index) => (
            <div
              key={t}
              className={cn(
                "group flex max-w-full flex-col items-center justify-center gap-1.5 text-center md:flex-row md:justify-start md:gap-3 md:text-start",
                index > 2 ? "hidden md:flex" : ""
              )}
            >
              <CheckCircle2 className="size-4 shrink-0 text-primary transition-transform group-hover:scale-110 md:size-5" />
              <span className="text-[11px] leading-snug text-foreground/85 sm:text-xs md:text-sm md:text-muted-foreground">
                {t}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
