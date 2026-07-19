"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Compass, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const QUICK_LINKS = [
  { href: "/#programs", label: "برنامه‌ها" },
  { href: "/#about", label: "داستان ما" },
  { href: "/#contact", label: "تماس با ما" },
  { href: "/auth", label: "ورود / ثبت‌نام" },
];

export default function NotFoundView() {
  const reduceMotion = useReducedMotion();

  return (
    <main
      dir="rtl"
      className="relative flex flex-1 flex-col overflow-hidden bg-surface text-on-surface"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-28 start-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-0 end-0 h-72 w-72 rounded-full bg-chart-2/12 blur-[100px]" />
        <div className="absolute top-1/3 -start-16 h-56 w-56 rounded-full bg-secondary-container/10 blur-[90px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center md:py-24">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-6 flex flex-col items-center gap-3"
        >
          <Logo className="h-14 w-14 object-contain sm:h-16 sm:w-16" />
          <span className="font-iranianSansBlack text-2xl tracking-tight text-foreground sm:text-3xl">
            فیتینو
          </span>
        </motion.div>

        <Badge
          variant="outline"
          className="mb-5 gap-2 border-border/80 bg-background/60 px-4 py-1.5 text-xs tracking-widest backdrop-blur-sm"
        >
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          صفحه پیدا نشد
        </Badge>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="font-iranianSansBlack text-[6.5rem] leading-none tracking-tight sm:text-[8rem] md:text-[9.5rem]"
          aria-hidden
        >
          <span className="bg-linear-to-l from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
            ۴۰۴
          </span>
        </motion.p>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12 }}
          className="mt-4 space-y-3"
        >
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
            این مسیر توی برنامه تمرین نیست
          </h1>
          <p className="mx-auto max-w-md text-sm leading-8 text-muted-foreground md:text-base">
            آدرسی که زدی وجود نداره یا جابه‌جا شده. برگرد به خانه فیتینو و از مسیر درست
            ادامه بده — برنامه‌ها، مربی‌ها و پشتیبانی اینجان.
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button asChild size="lg" className="gradient-bg rounded-full px-8 shadow-md">
            <Link href="/" className="inline-flex items-center gap-2">
              <Home className="size-4" />
              بازگشت به صفحه اصلی
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full border-border/80 bg-background/55 px-8 backdrop-blur-sm"
          >
            <Link href="/#programs" className="inline-flex items-center gap-2">
              <Compass className="size-4" />
              مشاهده برنامه‌ها
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </motion.div>

        <nav
          aria-label="میانبرهای مفید"
          className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border/60 pt-8 text-sm text-muted-foreground"
        >
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="min-h-11 inline-flex items-center transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
