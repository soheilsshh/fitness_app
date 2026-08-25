"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FUNNEL_PATH } from "@/lib/funnel/offer";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "fitino:contact-ai-cta:dismissed";
const MOBILE_STORAGE_KEY = "fitino:contact-ai-cta:mobile-dismissed";
const MOBILE_DURATION_MS = 7000;

/**
 * Desktop: slide-in CTA from the right while #contact is in view.
 * Mobile: full-width banner under the navbar; slides from top; 7s progress then auto-hide.
 */
export default function ContactAiRegisterPopup({ sectionId = "contact" }) {
  const reduceMotion = useReducedMotion();
  const [inSection, setInSection] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [mobileDismissed, setMobileDismissed] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(STORAGE_KEY) === "1");
      setMobileDismissed(sessionStorage.getItem(MOBILE_STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
      setMobileDismissed(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = document.getElementById(sectionId);
    if (!el || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setInSection(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [sectionId]);

  const dismissDesktop = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* private mode */
    }
  };

  const dismissMobile = () => {
    setMobileDismissed(true);
    try {
      sessionStorage.setItem(MOBILE_STORAGE_KEY, "1");
    } catch {
      /* private mode */
    }
  };

  const showDesktop = isDesktop && inSection && !dismissed;
  const showMobile = !isDesktop && inSection && !mobileDismissed;

  useEffect(() => {
    if (!showMobile) return;
    const t = window.setTimeout(dismissMobile, MOBILE_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [showMobile]);

  return (
    <AnimatePresence>
      {showDesktop ? (
        <motion.aside
          key="contact-ai-desktop"
          role="dialog"
          aria-label="ثبت‌نام با هوش مصنوعی فیتینو"
          aria-modal="false"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 32 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 28 }}
          transition={
            reduceMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 320, damping: 28 }
          }
          className={cn(
            "fixed z-[85] max-w-[min(20.5rem,calc(100vw-1.5rem))]",
            "bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-3 sm:right-5 sm:bottom-8",
            "left-auto"
          )}
          dir="rtl"
        >
          <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card p-4 pt-11 shadow-xl shadow-black/10 backdrop-blur-xl dark:bg-card/95 dark:shadow-black/40">
            <div
              aria-hidden
              className="pointer-events-none absolute -start-10 -top-10 size-28 rounded-full bg-primary/20 blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-8 -end-6 size-24 rounded-full bg-chart-2/15 blur-2xl"
            />

            <button
              type="button"
              onClick={dismissDesktop}
              aria-label="بستن"
              className="absolute left-2.5 top-2.5 z-10 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors duration-200 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4 stroke-[2.5]" aria-hidden />
            </button>

            <div className="relative space-y-3 text-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                <Sparkles className="size-3" aria-hidden />
                هوش مصنوعی فیتینو
              </span>

              <div className="space-y-1.5">
                <p className="text-sm font-iranianSansBlack leading-7 text-foreground">
                  ثبت‌نام کن تا با هوش مصنوعی فیتینو زودتر به جوابت برسی
                </p>
                <p className="text-xs leading-6 text-muted-foreground">
                  به‌جای منتظر ماندن برای تماس دستی، ارزیابی هوشمند بدنت را شروع کن و مسیر
                  اختصاصی‌ات را همین حالا ببین.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  asChild
                  size="sm"
                  className="gradient-bg h-10 w-full cursor-pointer rounded-xl font-iranianSansBlack text-primary-foreground hover:opacity-90"
                >
                  <Link href={FUNNEL_PATH}>شروع ارزیابی هوشمند</Link>
                </Button>
                <Link
                  href="/auth/register"
                  className="cursor-pointer text-center text-[11px] text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  یا همین حالا ثبت‌نام در فیتینو
                </Link>
              </div>
            </div>
          </div>
        </motion.aside>
      ) : null}

      {showMobile ? (
        <motion.aside
          key="contact-ai-mobile"
          role="status"
          aria-live="polite"
          aria-label="ثبت‌نام با هوش مصنوعی فیتینو"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -18 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={
            reduceMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 380, damping: 32 }
          }
          className="fixed inset-x-0 top-16 z-[85] w-full"
          dir="rtl"
        >
          <div className="relative overflow-hidden border-b border-border/70 bg-background/90 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.28)] backdrop-blur-xl dark:bg-background/88 dark:shadow-[0_12px_36px_-10px_rgba(0,0,0,0.55)]">
            {/* brand atmosphere — matches contact cards */}
            <div
              aria-hidden
              className="pointer-events-none absolute -start-8 -top-10 size-28 rounded-full bg-primary/20 blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-10 end-0 size-24 rounded-full bg-chart-2/15 blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px gradient-bg opacity-70"
            />

            <div className="relative flex items-start gap-3 px-3.5 py-3.5">
              <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
                <Sparkles className="size-4" aria-hidden />
              </span>

              <Link
                href={FUNNEL_PATH}
                onClick={dismissMobile}
                className="min-w-0 flex-1 cursor-pointer text-start transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-iranianSansMedium text-primary">
                  هوش مصنوعی فیتینو
                </span>
                <p className="text-[13px] font-iranianSansBlack leading-6 text-foreground sm:text-sm sm:leading-7">
                  ثبت‌نام کن تا با هوش مصنوعی فیتینو زودتر به جوابت برسی
                </p>
                <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-iranianSansDemiBold text-primary">
                  شروع ارزیابی هوشمند
                  <ChevronLeft className="size-3.5" aria-hidden />
                </span>
              </Link>

              <button
                type="button"
                onClick={dismissMobile}
                aria-label="بستن"
                className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border/80 bg-card/80 text-muted-foreground transition-colors duration-200 hover:border-destructive/35 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5 stroke-[2.5]" aria-hidden />
              </button>
            </div>

            {/* 7s auto-dismiss progress — site gradient */}
            <div aria-hidden className="relative h-[3px] w-full bg-primary/10">
              <motion.div
                className="absolute inset-y-0 end-0 h-full gradient-bg"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: reduceMotion ? 0 : MOBILE_DURATION_MS / 1000,
                  ease: "linear",
                }}
              />
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
