"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Crown, Sparkles } from "lucide-react";
import { api } from "@/lib/axios/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FUNNEL_PATH, GET_PROGRAM_LABEL, formatToman } from "@/lib/funnel/offer";

/**
 * Inline plan offer for unpaid students — loads Funnel 1 (علی) plans from DB
 * via /public/funnel/config (same ServicePlan rows as coach panel).
 */
export default function ProgramOffer({
  title = "برای ادامه، برنامه تهیه کنید",
  description = "فانل ۱ · پلن‌های VIP و CIP علی رشیدآبادی را ببینید و وارد ارزیابی شوید.",
  className,
}) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/public/funnel/config")
      .then((res) => {
        const list = res.data?.plans;
        if (!cancelled && Array.isArray(list)) {
          setPlans(list);
        }
      })
      .catch(() => {
        if (!cancelled) setPlans([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={cn("space-y-5", className)} dir="rtl">
      <div className="text-center">
        <p className="font-iranianSansDemiBold text-base text-foreground">{title}</p>
        <p className="mx-auto mt-1.5 max-w-md text-sm font-iranianSansMedium leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">در حال بارگذاری پلن‌ها...</p>
      ) : plans.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          هنوز پلنی برای این مربی ثبت نشده. از دکمه زیر وارد ارزیابی شوید.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => {
            const Icon = plan.popular ? Crown : Sparkles;
            return (
              <div
                key={plan.id || plan.key}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-5",
                  plan.popular
                    ? "border-primary/40 bg-primary/[0.06] shadow-[0_0_28px_-14px_rgba(38,252,227,0.45)]"
                    : "border-border/70 bg-card/60"
                )}
              >
                {plan.popular ? (
                  <span className="absolute start-3 top-3 rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-iranianSansDemiBold text-primary">
                    پیشنهاد اصلی
                  </span>
                ) : null}
                <div className="mt-4 flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                    <Icon className="size-4 text-primary" />
                  </span>
                  <div>
                    <p className="font-iranianSansDemiBold text-foreground">{plan.title}</p>
                    <p className="text-xs text-muted-foreground">{plan.subtitle}</p>
                  </div>
                </div>
                <p className="mt-4 text-2xl font-iranianSansDemiBold tabular-nums text-foreground">
                  {formatToman(plan.amount)}
                </p>
                {plan.durationDays ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    مدت {new Intl.NumberFormat("fa-IR").format(plan.durationDays)} روز
                  </p>
                ) : null}
                <ul className="mt-4 space-y-2">
                  {(plan.features || []).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-center">
        <Button asChild size="lg">
          <Link href={FUNNEL_PATH}>{GET_PROGRAM_LABEL}</Link>
        </Button>
      </div>
    </div>
  );
}
