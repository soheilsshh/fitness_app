"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Check,
  Crown,
  Loader2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound,
  Utensils,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { toastError } from "@/app/(site)/auth/_components/helpers";
import { PAYMENT_COPY } from "../../_lib/funnelConfig";
import { clearFunnelDraft, saveFunnelDraft } from "../../_lib/funnelDraft";
import { formatToman } from "@/lib/funnel/offer";
import FunnelShell, {
  FunnelCta,
  FunnelGlass,
  FunnelStickyBar,
} from "../../_components/FunnelShell";
import { LogoAnchor } from "../../_components/FunnelLogoLayer";
import { cn } from "@/lib/utils";

const FEATURE_ICONS = {
  bot: Bot,
  user: UserRound,
  utensils: Utensils,
  smartphone: Smartphone,
};

/** @typedef {"features" | "proof" | "plans"} PayStep */

export default function FunnelPaymentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [paying, setPaying] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [slide, setSlide] = useState(0);
  /** @type {[PayStep, function]} */
  const [step, setStep] = useState("features");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get(`/public/funnel/checkout/${token}`);
        if (!cancelled) setCheckout(res.data);
      } catch {
        if (!cancelled) setCheckout(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    saveFunnelDraft({ stage: "checkout", checkoutToken: token });
  }, [token]);

  useEffect(() => {
    if (checkout?.status === "paid" && token) {
      clearFunnelDraft();
      router.replace(
        `/ali-rashidabadi/success?token=${token}&code=${encodeURIComponent(checkout.trackingCode || "")}`
      );
    }
  }, [checkout, token, router]);

  useEffect(() => {
    const transforms = PAYMENT_COPY.transformations;
    if (step !== "proof" || !transforms.length) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % transforms.length), 4500);
    return () => clearInterval(id);
  }, [step]);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step]);

  const plans = Array.isArray(checkout?.plans) ? checkout.plans : [];
  const selectedKey =
    checkout?.packageKey ||
    (checkout?.planId ? String(checkout.planId) : "") ||
    (plans[0] ? String(plans[0].id || plans[0].key) : "");

  const handleSelectPlan = async (plan) => {
    const planId = Number(plan?.id || plan?.key);
    const packageKey = String(plan?.key || plan?.id || "");
    if (!token || paying || selecting || !planId) return;
    if (String(planId) === String(selectedKey) || packageKey === selectedKey) return;
    setSelecting(true);
    try {
      const res = await api.post(`/public/funnel/checkout/${token}/plan`, {
        planId,
        packageKey,
      });
      setCheckout(res.data);
    } catch (err) {
      const msg = err?.response?.data?.error || "انتخاب پلن ناموفق بود.";
      toastError("خطا", msg);
    } finally {
      setSelecting(false);
    }
  };

  const handlePay = async () => {
    if (!token || paying || selecting) return;
    if (!selectedKey || plans.length === 0) {
      toastError("پلن لازم است", "ابتدا یکی از پلن‌ها را انتخاب کنید.");
      return;
    }
    setPaying(true);
    try {
      const res = await api.post(`/public/funnel/checkout/${token}/pay`);
      const paymentUrl = res.data?.paymentUrl;
      if (!paymentUrl) {
        throw new Error("آدرس درگاه دریافت نشد");
      }
      clearFunnelDraft();
      window.location.href = paymentUrl;
    } catch (err) {
      const msg =
        err?.response?.data?.error || err?.message || "اتصال به درگاه زرین‌پال ناموفق بود.";
      toastError("خطا", msg);
      setPaying(false);
    }
  };

  if (!token) {
    return (
      <FunnelShell centered>
        <p className="text-center text-white/55">لینک پرداخت نامعتبر است.</p>
        <Link href="/ali-rashidabadi" className="mt-4 block text-center text-primary underline">
          بازگشت به ارزیابی
        </Link>
      </FunnelShell>
    );
  }

  if (loading) {
    return (
      <FunnelShell centered>
        <div className="flex items-center justify-center gap-2 text-white/55">
          <Loader2 className="size-5 animate-spin" />
          در حال بارگذاری...
        </div>
      </FunnelShell>
    );
  }

  if (!checkout) {
    return (
      <FunnelShell centered>
        <p className="text-center text-white/55">اطلاعات پرداخت یافت نشد.</p>
        <Link href="/ali-rashidabadi" className="mt-4 block text-center text-primary underline">
          شروع مجدد
        </Link>
      </FunnelShell>
    );
  }

  if (checkout.status === "paid") {
    return (
      <FunnelShell centered>
        <p className="text-center text-white/55">در حال انتقال...</p>
      </FunnelShell>
    );
  }

  const transforms = PAYMENT_COPY.transformations;
  const current = transforms[slide] || transforms[0];

  const selectedPlan = plans.find(
    (p) => String(p.key || p.id) === String(selectedKey)
  );
  const selectedTitle = String(selectedPlan?.title || checkout?.packageTitle || "");
  const valueTable = selectedTitle.includes("CIP")
    ? PAYMENT_COPY.cipValueTable
    : PAYMENT_COPY.vipValueTable;
  const valueEmoji = selectedTitle.includes("CIP") ? "👑" : "💎";

  return (
    <FunnelShell contentClassName="pb-2">
      <AnimatePresence mode="wait">
        {step === "features" && (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-5"
          >
            <div className="text-center">
              <LogoAnchor id="payment-features" size={56} className="mx-auto mb-2 rounded-full" />
              <p className="mb-2 text-xs text-primary/80">فیتینو · پیشنهاد نهایی</p>
              <h1 className="text-xl font-extrabold leading-relaxed text-white md:text-2xl">
                {PAYMENT_COPY.title}
              </h1>
              <p className="mt-2 text-xs text-white/45">
                {checkout.firstName} {checkout.lastName} · {checkout.phone}
              </p>
            </div>

            {/* Mobile: horizontal snap slider · Desktop: 2×2 grid */}
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0">
              {PAYMENT_COPY.features.map((feat) => {
                const Icon = FEATURE_ICONS[feat.icon] || Bot;
                return (
                  <FunnelGlass
                    key={feat.title}
                    className="w-[82vw] max-w-sm shrink-0 snap-center p-4 md:w-auto md:max-w-none"
                  >
                    <div className="mb-2 flex size-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                      <Icon className="size-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-white">{feat.title}</h3>
                    <p className="mt-1.5 text-xs leading-6 text-white/55">{feat.body}</p>
                  </FunnelGlass>
                );
              })}
            </div>

            <FunnelStickyBar>
              <FunnelCta onClick={() => setStep("proof")}>{PAYMENT_COPY.ctaFeatures}</FunnelCta>
            </FunnelStickyBar>
          </motion.div>
        )}

        {step === "proof" && (
          <motion.div
            key="proof"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            <div className="text-center">
              <LogoAnchor id="payment-proof" size={56} className="mx-auto mb-2 rounded-full" />
              <h2 className="text-lg font-extrabold leading-relaxed text-white md:text-xl">
                {PAYMENT_COPY.socialProof}
              </h2>
            </div>

            <FunnelGlass className="overflow-hidden p-2.5" glow="green">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-2 gap-2"
                >
                  {[
                    { src: current.before, label: "قبل" },
                    { src: current.after, label: "بعد" },
                  ].map((img) => (
                    <div
                      key={img.label}
                      className="relative overflow-hidden rounded-xl border border-white/10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.src}
                        alt={`${current.name} — ${img.label}`}
                        className="aspect-[3/4] w-full object-cover"
                      />
                      <span className="absolute bottom-2 start-2 rounded-md border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                        {img.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
              <div className="mt-2.5 flex justify-center gap-2">
                {transforms.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`اسلاید ${i + 1}`}
                    onClick={() => setSlide(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === slide ? "w-6 bg-primary" : "w-1.5 bg-white/25"
                    }`}
                  />
                ))}
              </div>
            </FunnelGlass>

            <FunnelStickyBar>
              <FunnelCta onClick={() => setStep("plans")}>{PAYMENT_COPY.ctaProof}</FunnelCta>
            </FunnelStickyBar>
          </motion.div>
        )}

        {step === "plans" && (
          <motion.div
            key="plans"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-3"
          >
            <div className="text-center">
              <LogoAnchor id="payment-plans" size={48} className="mx-auto mb-1.5 rounded-full" />
              <h2 className="text-lg font-extrabold text-white">انتخاب پلن</h2>
              <p className="mt-1 text-xs text-white/45">
                {checkout.coachName} · {formatToman(checkout.amount)}
              </p>
            </div>

            {plans.length === 0 ? (
              <FunnelGlass className="p-4 text-center text-sm text-white/55">
                هنوز پلنی برای این مربی در سیستم ثبت نشده است.
              </FunnelGlass>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {plans.map((plan) => {
                  const planKey = String(plan.key || plan.id);
                  const active = planKey === String(selectedKey);
                  const Icon = plan.popular ? Crown : Sparkles;
                  return (
                    <button
                      key={planKey}
                      type="button"
                      disabled={selecting || paying}
                      onClick={() => handleSelectPlan(plan)}
                      className={cn(
                        "relative rounded-2xl border p-3 text-start transition",
                        active
                          ? "border-primary/55 bg-primary/10 shadow-[0_0_28px_-12px_oklch(0.58_0.11_187_/_0.5)]"
                          : "border-white/12 bg-white/[0.03]"
                      )}
                    >
                      {plan.popular ? (
                        <span className="mb-1.5 inline-block rounded-full border border-primary/35 bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                          پیشنهاد اصلی
                        </span>
                      ) : (
                        <span className="mb-1.5 block h-[18px]" aria-hidden />
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                          <Icon className="size-3.5 text-primary" />
                        </span>
                        <p className="truncate text-sm font-bold text-white">{plan.title}</p>
                        {active ? <Check className="ms-auto size-4 shrink-0 text-primary" /> : null}
                      </div>
                      <p className="mt-2 text-lg font-extrabold text-white">
                        {formatToman(plan.amount)}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {(plan.features || []).slice(0, 2).map((f) => (
                          <li key={f} className="flex items-start gap-1 text-[10px] leading-4 text-white/50">
                            <Check className="mt-0.5 size-3 shrink-0 text-primary" />
                            <span className="line-clamp-2">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            )}

            {valueTable ? (
              <FunnelGlass className="overflow-hidden p-0">
                <div className="border-b border-white/10 px-3 py-2.5">
                  <p className="text-xs font-bold text-white md:text-sm">
                    {valueTable.title}{" "}
                    <span aria-hidden>{valueEmoji}</span>
                  </p>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-x-2 border-b border-white/10 px-3 py-2 text-[10px] text-white/45">
                  <span>{valueTable.serviceHeader}</span>
                  <span className="text-end">{valueTable.marketHeader}</span>
                </div>
                <ul className="divide-y divide-white/10">
                  {valueTable.rows.map((row) => (
                    <li
                      key={row.service}
                      className="grid grid-cols-[1fr_auto] items-start gap-x-2 px-3 py-2.5"
                    >
                      <span className="text-[11px] leading-5 text-white/75">{row.service}</span>
                      <span className="whitespace-nowrap text-[11px] font-bold text-white">
                        {formatToman(row.value)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 border-t border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <span className="text-[11px] text-white/55">{valueTable.marketTotalLabel}</span>
                  <span className="whitespace-nowrap text-[11px] font-bold text-white/50 line-through">
                    {formatToman(valueTable.marketTotal)}
                  </span>
                </div>
                <div className="space-y-1.5 border-t border-primary/25 bg-primary/10 px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold text-primary">{valueTable.investLabel}</span>
                    <span className="whitespace-nowrap text-sm font-extrabold text-white">
                      {formatToman(valueTable.investAmount)}
                    </span>
                  </div>
                  <p className="text-[11px] leading-5 text-primary/90">{valueTable.dailyPitch}</p>
                </div>
              </FunnelGlass>
            ) : null}

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/40">
              <ShieldCheck className="size-3.5 text-primary" />
              پرداخت امن از طریق درگاه زرین‌پال
            </div>

            <FunnelStickyBar>
              <FunnelCta onClick={handlePay} disabled={paying || selecting || plans.length === 0}>
                {paying ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    در حال اتصال به زرین‌پال...
                  </>
                ) : (
                  PAYMENT_COPY.cta
                )}
              </FunnelCta>
            </FunnelStickyBar>
          </motion.div>
        )}
      </AnimatePresence>
    </FunnelShell>
  );
}
