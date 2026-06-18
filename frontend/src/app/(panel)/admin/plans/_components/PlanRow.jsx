"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function formatNumber(v) {
  try {
    return new Intl.NumberFormat("fa-IR").format(Number(v) || 0);
  } catch {
    return String(v ?? 0);
  }
}

export default function PlanRow({ plan, basePath = "/admin/plans" }) {
  const hasDiscount =
    Number(plan.discountPercent || 0) > 0 || Number(plan.discountPrice || 0) > 0;

  const price = Number(plan.price || 0);
  const discountPrice = Number(plan.discountPrice || 0);
  const finalPrice = discountPrice > 0 ? discountPrice : price;

  return (
    <Link
      href={`${basePath}/${plan.id}`}
      className={cn(
        "block border-b px-4 py-4 transition-colors last:border-b-0",
        "hover:bg-muted/50"
      )}
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-12 md:gap-2">
        <div className="md:col-span-5">
          <div className="text-sm font-semibold">{plan.title || "—"}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {plan.subtitle || "—"}
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="text-sm">{plan.courseName || "—"}</div>
          {plan.coachName ? (
            <div className="mt-1 text-xs text-muted-foreground">
              مربی: {plan.coachName}
            </div>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <div className="text-sm font-semibold tabular-nums">
            {formatNumber(finalPrice)}
          </div>
          {hasDiscount && price > 0 ? (
            <div className="mt-1 text-xs text-muted-foreground line-through tabular-nums">
              {formatNumber(price)}
            </div>
          ) : null}
        </div>

        <div className="md:col-span-2 md:text-left">
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {plan.isPopular ? (
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              >
                محبوب
              </Badge>
            ) : null}

            <Badge
              variant="outline"
              className={
                hasDiscount
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : undefined
              }
            >
              {hasDiscount ? "تخفیف‌دار" : "عادی"}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}
