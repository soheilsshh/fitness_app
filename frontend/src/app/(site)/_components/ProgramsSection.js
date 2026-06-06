"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowDownRight, FiUsers } from "react-icons/fi";
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
    <section id="programs" className="scroll-mt-24 py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200">
              مربی‌های منتخب
              <span className="h-1 w-1 rounded-full bg-white/30" />
              برنامه اختصاصی برای هر هدف
            </div>
            <h2 className="mt-3 text-2xl font-extrabold md:text-3xl">
              با <span className="text-emerald-300">مربی خودت</span> شروع کن
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
              FitPro پلتفرم چندمربی است؛ هر مربی صفحه اختصاصی و پلن‌های خودش را دارد.
              مربی مناسب را انتخاب کن و از همان‌جا خرید را انجام بده.
            </p>
          </div>

          <Link
            href="/coaches"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/10"
          >
            همه مربی‌ها <FiArrowDownRight />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {loading ? (
            <div className="col-span-full rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
              در حال بارگذاری مربی‌ها...
            </div>
          ) : coaches.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
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
                className="relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]"
              >
                <div className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
                <div className="flex h-full flex-col p-5 md:p-6">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/40">
                      {coach.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={apiAssetUrl(coach.avatarUrl)}
                          alt={coach.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FiUsers className="text-emerald-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-lg font-extrabold text-white">
                        {coach.displayName}
                      </div>
                      <div className="mt-1 text-xs text-zinc-400">{coach.title || coach.specialty || "مربی تناسب اندام"}</div>
                    </div>
                  </div>

                  <p className="mt-4 flex-1 text-sm leading-7 text-zinc-300">
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

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
          اگر مطمئن نیستی کدام مربی مناسب است، از بخش{" "}
          <a href="#contact" className="font-semibold text-emerald-200">
            تماس با ما
          </a>{" "}
          پیام بده تا راهنماییت کنیم.
        </div>
      </div>
    </section>
  );
}
