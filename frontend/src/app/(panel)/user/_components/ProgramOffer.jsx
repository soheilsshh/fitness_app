"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Crown,
  Lock,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FUNNEL_PATH, GET_PROGRAM_LABEL, formatToman } from "@/lib/funnel/offer";
import { PAYMENT_COPY } from "@/app/(site)/ali-rashidabadi/_lib/funnelConfig";
import Enamad from "@/components/enamad";

const TRUST_ICONS = {
  lock: Lock,
  zap: Zap,
  shield: ShieldCheck,
};

/**
 * Inline plan offer for unpaid students — loads Funnel 1 (علی) plans from DB
 * via /public/funnel/config (same ServicePlan rows as coach panel).
 */
export default function ProgramOffer({
  title = PAYMENT_COPY.plansTitle,
  description = PAYMENT_COPY.plansSubtitle,
  showIntro = true,
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
      {showIntro ? (
        <div className="text-center">
          <p className="font-iranianSansDemiBold text-base text-foreground sm:text-lg">
            {title}
          </p>
          <p className="mx-auto mt-1.5 max-w-lg text-sm font-iranianSansMedium leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      ) : null}

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">در حال بارگذاری پلن‌ها...</p>
      ) : plans.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          هنوز پلنی برای این مربی ثبت نشده. از دکمه زیر وارد ارزیابی شوید.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => {
            const isVip =
              plan.popular || String(plan.title || "").includes("VIP");
            const meta = isVip
              ? PAYMENT_COPY.planMeta.vip
              : PAYMENT_COPY.planMeta.cip;
            const Icon = isVip ? Crown : Sparkles;
            // Marketing copy is source of truth (avoids stale DB feature strings).
            const features = meta.features;
            return (
              <div
                key={plan.id || plan.key}
                className={cn(
                  "relative flex flex-col overflow-hidden rounded-2xl border p-5",
                  isVip
                    ? "border-primary/40 bg-primary/[0.06] shadow-[0_0_28px_-14px_rgba(38,252,227,0.45)]"
                    : "border-border/70 bg-card/60"
                )}
              >
                <span
                  className={cn(
                    "w-fit rounded-full px-2.5 py-0.5 text-[10px] font-iranianSansDemiBold",
                    isVip
                      ? "bg-primary/15 text-primary"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-200"
                  )}
                >
                  {isVip ? PAYMENT_COPY.vipBadge : PAYMENT_COPY.cipBadge}
                </span>
                <div className="mt-3 flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                    <Icon className="size-4 text-primary" />
                  </span>
                  <div>
                    <p className="font-iranianSansDemiBold text-foreground">
                      {plan.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {plan.subtitle || meta.subtitle}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-2xl font-iranianSansDemiBold tabular-nums text-foreground">
                  {formatToman(plan.amount)}
                </p>
                <p className="mt-1 text-xs text-primary">({meta.dailyNote})</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-5 w-full" size="sm">
                  <Link href={FUNNEL_PATH}>{meta.cta}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-4">
        <ul className="flex flex-wrap items-center justify-center gap-2">
          {(PAYMENT_COPY.trustItems || []).map((item) => {
            const label = typeof item === "string" ? item : item.label;
            const iconKey = typeof item === "string" ? "shield" : item.icon;
            const pillClass =
              typeof item === "string"
                ? "border-border/60 bg-muted text-muted-foreground"
                : item.className;
            const TrustIcon = TRUST_ICONS[iconKey] || ShieldCheck;
            return (
              <li
                key={item.id || label}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-iranianSansMedium",
                  pillClass
                )}
              >
                <TrustIcon className="size-3.5 shrink-0" aria-hidden />
                <span>{label}</span>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col items-center gap-1">
          <Enamad className="h-14 w-14" />
          <p className="text-[10px] text-muted-foreground">نماد اعتماد الکترونیکی (اینماد)</p>
        </div>
      </div>

      <div className="flex justify-center">
        <Button asChild size="lg" variant="outline">
          <Link href={FUNNEL_PATH}>{GET_PROGRAM_LABEL}</Link>
        </Button>
      </div>
    </div>
  );
}
