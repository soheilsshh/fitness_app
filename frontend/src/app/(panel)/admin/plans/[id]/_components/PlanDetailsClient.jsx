"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiChevronLeft } from "react-icons/fi";
import { api } from "@/lib/axios/client";

function formatNumber(v) {
  try {
    return new Intl.NumberFormat("fa-IR").format(Number(v) || 0);
  } catch {
    return String(v ?? 0);
  }
}

export default function PlanDetailsClient({ id }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/admin/plans/${id}`);
        if (!cancelled) setPlan(res.data);
      } catch {
        if (!cancelled) setPlan(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">در حال بارگذاری...</div>;
  }

  if (!plan) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
        پلن پیدا نشد.
      </div>
    );
  }

  const price = Number(plan.price || 0);
  const discountPrice = Number(plan.discountPrice || 0);
  const finalPrice = discountPrice > 0 ? discountPrice : price;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/plans"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
          >
            <FiChevronLeft />
            بازگشت
          </Link>
          <div className="text-lg font-extrabold text-white">جزئیات پلن (فقط مشاهده)</div>
        </div>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-sm text-zinc-400">تیتر</div>
            <div className="mt-1 truncate text-xl font-extrabold text-white">{plan.title || "—"}</div>
            <div className="mt-2 text-sm text-zinc-300">{plan.subtitle || "—"}</div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-300">
              <span className="rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1">
                نام دوره: <span className="font-bold text-white">{plan.courseName || "—"}</span>
              </span>
              {plan.isPopular ? (
                <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 font-bold text-amber-100">
                  محبوب
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4 text-[11px] text-zinc-400">
            <div>شناسه پلن: <span className="font-bold text-zinc-200">{plan.id}</span></div>
            <div className="mt-2">
              مربی:{" "}
              <span className="font-bold text-zinc-200">
                {plan.coachName || (plan.coachId ? `#${plan.coachId}` : "—")}
              </span>
            </div>
            <div className="mt-2">قیمت: <span className="font-bold text-white">{formatNumber(finalPrice)} تومان</span></div>
            {plan.updatedAt ? (
              <div className="mt-2">
                آخرین بروزرسانی:
                <div className="mt-1 text-zinc-200">{new Date(plan.updatedAt).toLocaleString("fa-IR")}</div>
              </div>
            ) : null}
          </div>
        </div>

        {plan.featuresText ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
            <div className="text-sm font-bold text-white">ویژگی‌ها</div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{plan.featuresText}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
