"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Users } from "lucide-react";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import { getCoachPublicPath } from "@/lib/routes/coach-public";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import coachStatue from "@/assets/landing-page/coach_section_statue.png";

export default function ProgramsSection() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get("/coaches", { params: { page: 1, pageSize: 6 } });
        if (!cancelled) setCoaches(res.data?.items || []);
      } catch {
        if (!cancelled) setCoaches([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="programs" dir="rtl" className="relative scroll-mt-24 py-12 md:py-16">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-background via-primary/[0.04] to-background" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6">
        {/* Header */}
        <div className="mb-8 space-y-3 text-center md:mb-10">
          <p className="inline-flex items-center gap-2 text-xs font-iranianSansDemiBold tracking-wide text-primary">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            مربیان تراز اول
          </p>
          <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
            با مربی{" "}
            <span className="bg-linear-to-l from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
              خودت
            </span>{" "}
            شروع کن
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-7 text-foreground/85 md:text-base">
            بهترین مربیان ایران در یک‌جا — بر اساس سلیقه و هدف، راهبرت را انتخاب کن.
          </p>
          <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-start">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="size-3.5" />
            </span>
            <p className="text-xs leading-6 text-foreground/90 md:text-sm">
              استاندارد طلایی تناسب: آناتومی کلاسیک + بیومکانیک مدرن.
            </p>
          </div>
        </div>

        {/* Coaches grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-12 w-full" />
                <Skeleton className="mt-4 h-10 w-full rounded-xl" />
              </div>
            ))
          ) : coaches.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-border/70 bg-card px-6 py-10 text-center text-sm text-foreground/80">
              هنوز مربی منتشرشده‌ای وجود ندارد. به‌زودی مربی‌های جدید اضافه می‌شوند.
            </div>
          ) : (
            coaches.map((coach, idx) => {
              const specialty =
                coach.title || coach.specialty || "مربی تناسب اندام";
              return (
                <motion.article
                  key={coach.coachId || coach.slug}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: idx * 0.05 }}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12 rounded-xl ring-2 ring-primary/15 transition-transform group-hover:scale-105">
                      {coach.avatarUrl ? (
                        <AvatarImage
                          src={apiAssetUrl(coach.avatarUrl)}
                          alt={coach.displayName}
                          className="rounded-xl object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="rounded-xl bg-primary/10">
                        <Users className="size-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 text-start">
                      <h3 className="truncate text-base font-iranianSansBlack text-foreground">
                        {coach.displayName}
                      </h3>
                      <p className="truncate text-xs text-primary/90">{specialty}</p>
                    </div>
                  </div>

                  <p className="mt-4 flex-1 text-start text-sm leading-7 text-foreground/85">
                    {coach.specialty
                      ? `تخصص: ${coach.specialty}`
                      : "برنامه تمرین و تغذیه اختصاصی با پشتیبانی مستقیم مربی."}
                  </p>

                  <Button
                    asChild
                    className="mt-4 h-10 w-full rounded-xl font-iranianSansDemiBold"
                    variant="outline"
                  >
                    <Link
                      href={getCoachPublicPath(coach.slug)}
                      className="inline-flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="size-4" />
                      مشاهده صفحه و پلن‌ها
                    </Link>
                  </Button>
                </motion.article>
              );
            })
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm md:mt-12">
          <div className="grid md:grid-cols-2">
            <div className="relative h-56 md:h-auto md:min-h-[320px]">
              <Image
                src={coachStatue}
                alt="پیکرتراش در حال تراشیدن مجسمه"
                fill
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-linear-to-b from-transparent via-background/20 to-background md:bg-linear-to-l md:from-transparent md:via-background/30 md:to-card" />
            </div>

            <div className="flex flex-col items-center justify-center gap-4 p-6 text-center sm:p-8 md:p-10">
              <h3 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl md:text-3xl">
                آماده تغییر هستی؟
              </h3>
              <p className="max-w-md text-sm leading-7 text-foreground/85 md:text-base">
                همین حالا برنامه اختصاصی خودت را از مربی مورد علاقه‌ات بگیر.
              </p>
              <Button
                asChild
                size="lg"
                className="gradient-bg h-11 rounded-xl px-8 font-iranianSansBlack text-primary-foreground hover:opacity-90"
              >
                <Link href="/coaches" className="inline-flex items-center gap-2">
                  <ArrowLeft className="size-4" />
                  انتخاب مربی و شروع
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
