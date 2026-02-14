"use client";

import Link from "next/link";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatNumber(v) {
  try {
    return new Intl.NumberFormat("fa-IR").format(Number(v) || 0);
  } catch {
    return String(v ?? 0);
  }
}

export default function PlanRow({ plan }) {
  const hasDiscount = Number(plan.discountPercent || 0) > 0 || Number(plan.discountPrice || 0) > 0;

  const price = Number(plan.price || 0);
  const discountPrice = Number(plan.discountPrice || 0);
  const finalPrice = discountPrice > 0 ? discountPrice : price;

  return (
    <Link href={`/admin/plans/${plan.id}`} className="block px-4 py-4 hover:bg-white/10">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-12 md:gap-2">
        <div className="md:col-span-5">
          <div className="text-sm font-extrabold text-white">{plan.title || "—"}</div>
          <div className="mt-1 text-[11px] text-zinc-400">{plan.subtitle || "—"}</div>
        </div>

        <div className="md:col-span-3">
          <div className="text-sm text-zinc-200">{plan.courseName || "—"}</div>
        </div>

        <div className="md:col-span-2">
          <div className="text-sm font-extrabold text-white">
            {formatNumber(finalPrice)}
          </div>
          {hasDiscount && price > 0 ? (
            <div className="mt-1 text-[11px] text-zinc-400 line-through">
              {formatNumber(price)}
            </div>
          ) : null}
        </div>

        <div className="md:col-span-2 md:text-left">
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {plan.isPopular ? (
              <span className="inline-flex rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[11px] font-bold text-amber-100">
                محبوب
              </span>
            ) : null}

            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-[11px] font-bold",
                hasDiscount
                  ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                  : "border-white/10 bg-zinc-950/30 text-zinc-200"
              )}
            >
              {hasDiscount ? "تخفیف‌دار" : "عادی"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
