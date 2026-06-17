"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiUsers } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";

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
    <section id="programs" className="relative scroll-mt-24 overflow-hidden py-12 md:py-16">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface via-surface-tint/5 to-surface" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-16 flex flex-col items-center space-y-8 text-center">
          <div className="glass inline-flex items-center gap-2 rounded-full border border-surface-tint/20 px-4 py-1 text-xs tracking-widest text-surface-tint">
            <span className="h-2 w-2 animate-pulse rounded-full bg-surface-tint" />
            مربیان تراز اول
          </div>

          <h2 className="text-4xl font-extrabold leading-tight text-primary md:text-6xl">
            با مربی <span className="gradient-text">خودت</span> شروع کن
          </h2>

          <p className="mx-auto max-w-2xl text-base leading-8 text-on-surface-variant md:text-lg">
            فیت‌پرو پلتفرم چندمربی است. ما بهترین مربیان ایران را در یک‌جا جمع
            کرده‌ایم تا شما بر اساس سلیقه و نیاز خود، راهبر مسیرتان را انتخاب کنید.
          </p>

          <div className="glass mx-auto mt-4 max-w-xl rounded-[2rem] border border-surface-tint/20 p-6">
            <h3 className="text-center text-2xl font-semibold text-primary">استاندارد طلایی تناسب</h3>
            <p className="mt-1 text-center text-on-surface-variant">
              ترکیبی از آناتومی کلاسیک و متدهای مدرن بیومکانیک برای دستیابی به تقارن مطلق.
            </p>
          </div>
        </div>

        {/* Coaches grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {loading ? (
            <div className="glass col-span-full rounded-[2rem] border border-white/5 p-6 text-sm text-on-surface-variant">
              در حال بارگذاری مربی‌ها...
            </div>
          ) : coaches.length === 0 ? (
            <div className="glass col-span-full rounded-[2rem] border border-white/5 p-6 text-sm text-on-surface-variant">
              هنوز مربی منتشرشده‌ای وجود ندارد. به‌زودی مربی‌های جدید اضافه می‌شوند.
            </div>
          ) : (
            coaches.map((coach, idx) => (
              <motion.div
                key={coach.coachId || coach.slug}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: idx * 0.06 }}
                className="glow-card flex h-full flex-col rounded-[2rem] p-6 text-right"
              >
                <div className="flex flex-row-reverse items-start gap-3">
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-surface-container">
                    {coach.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={apiAssetUrl(coach.avatarUrl)}
                        alt={coach.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FiUsers className="text-surface-tint" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-lg font-bold text-primary">{coach.displayName}</div>
                    <div className="mt-1 text-xs text-on-surface-variant">
                      {coach.title || coach.specialty || "مربی تناسب اندام"}
                    </div>
                  </div>
                </div>

                <p className="mt-4 flex-1 text-sm leading-7 text-on-surface-variant">
                  {coach.specialty
                    ? `تخصص: ${coach.specialty}`
                    : "برنامه تمرین و تغذیه اختصاصی با پشتیبانی مربی."}
                </p>

                  <Link
                    href={`/coach/${coach.slug}`}
                    className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-center text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
                  >
                    مشاهده صفحه و پلن‌ها
                  </Link>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Big CTA card with sculptor statue */}
        <div className="group relative mt-16">
          <div className="absolute -inset-4 rounded-full bg-surface-tint/10 opacity-0 blur-3xl transition-opacity duration-1000 group-hover:opacity-100" />
          <div className="glass relative grid overflow-hidden rounded-[2rem] border border-surface-tint/20 shadow-[0_0_30px_rgba(0,225,171,0.2)] md:grid-cols-2">
            {/* Statue side */}
            <div className="relative h-72 md:h-auto md:min-h-[480px]">
              <Image
                src={coachStatue}
                alt="پیکرتراش در حال تراشیدن مجسمه"
                fill
                className="rounded-[2rem] object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              {/* fade into the content panel (bottom on mobile, side on desktop) */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/10 to-surface md:bg-gradient-to-l md:from-transparent md:via-surface/20 md:to-surface" />
            </div>

            {/* Content side */}
            <div className="relative z-10 flex flex-col items-center justify-center space-y-6 p-8 text-center md:p-14">
              <h3 className="text-3xl font-extrabold text-primary md:text-4xl">آماده تغییر هستی؟</h3>
              <p className="max-w-md text-base leading-8 text-on-surface-variant md:text-lg">
                همین حالا برنامه اختصاصی خود را از مربی مورد علاقه‌تان دریافت کنید.
              </p>
              <Link
                href="/coaches"
                className="rounded-full bg-surface-tint px-12 py-5 text-xl font-bold text-on-primary shadow-2xl transition-transform hover:scale-105"
              >
                انتخاب مربی و شروع
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
