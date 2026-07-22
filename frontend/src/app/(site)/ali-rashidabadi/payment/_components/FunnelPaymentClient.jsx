"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Crown,
  Loader2,
  Quote,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { toastError, toPersianDigits } from "@/app/(site)/auth/_components/helpers";
import { persistAuthSession } from "@/lib/auth/session";
import { PAYMENT_COPY } from "../../_lib/funnelConfig";
import { detectGenderFromName } from "../../_lib/persianGender";
import { clearFunnelDraft, saveFunnelDraft } from "../../_lib/funnelDraft";
import { formatToman } from "@/lib/funnel/offer";
import FunnelShell, {
  FunnelGlass,
  FunnelStickyBar,
} from "../../_components/FunnelShell";
import { LogoAnchor } from "../../_components/FunnelLogoLayer";
import FeatureCarousel3D from "../../_components/FeatureCarousel3D";
import PaymentConversionBlocks from "../../_components/PaymentConversionBlocks";
import Typewriter from "../../_components/Typewriter";
import DelayedFunnelCta from "../../_components/DelayedFunnelCta";
import Enamad from "@/components/enamad";
import { cn } from "@/lib/utils";

/** @typedef {"features" | "proof" | "plans"} PayStep */

const PAY_PENDING_KEY = "fitino:funnel:payPending";

export default function FunnelPaymentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [paying, setPaying] = useState(false);
  const [freeStarting, setFreeStarting] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [slide, setSlide] = useState(0);
  /** @type {[PayStep, function]} */
  const [step, setStep] = useState("features");
  const [typedStep, setTypedStep] = useState(null);
  const typingDone = typedStep === step;

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

  // Browser back / bfcache from ZarinPal leaves paying=true — always unlock UI.
  useEffect(() => {
    const unlock = () => {
      setPaying(false);
      setFreeStarting(false);
      try {
        sessionStorage.removeItem(PAY_PENDING_KEY);
      } catch {
        /* ignore */
      }
    };
    unlock();
    const onPageShow = () => unlock();
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [token]);

  const visitorGender = detectGenderFromName(
    [checkout?.firstName, checkout?.lastName].filter(Boolean).join(" ")
  );
  const transforms = (PAYMENT_COPY.transformations || []).filter(
    (t) => (t.gender || "male") === visitorGender
  );
  const safeTransforms =
    transforms.length > 0
      ? transforms
      : (PAYMENT_COPY.transformations || []).filter((t) => t.gender === "male");

  useEffect(() => {
    setSlide(0);
  }, [visitorGender]);

  useEffect(() => {
    if (step !== "proof" || !safeTransforms.length) return;
    const id = setInterval(
      () => setSlide((s) => (s + 1) % safeTransforms.length),
      5200
    );
    return () => clearInterval(id);
  }, [step, safeTransforms.length, visitorGender]);

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
    if (!token || paying || selecting || freeStarting || !planId) return;
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
    if (!token || paying || selecting || freeStarting) return;
    if (!selectedKey || plans.length === 0) {
      toastError("پلن لازم است", "ابتدا یکی از پلن‌ها را انتخاب کنید.");
      return;
    }
    setPaying(true);
    try {
      sessionStorage.setItem(PAY_PENDING_KEY, token);
    } catch {
      /* ignore */
    }
    const safety = setTimeout(() => setPaying(false), 12000);
    try {
      const res = await api.post(`/public/funnel/checkout/${token}/pay`);
      const paymentUrl = res.data?.paymentUrl;
      if (!paymentUrl) {
        throw new Error("آدرس درگاه دریافت نشد");
      }
      // Keep draft so back-from-gateway can resume this checkout.
      window.location.assign(paymentUrl);
    } catch (err) {
      clearTimeout(safety);
      const msg =
        err?.response?.data?.error || err?.message || "اتصال به درگاه زرین‌پال ناموفق بود.";
      toastError("خطا", msg);
      setPaying(false);
      try {
        sessionStorage.removeItem(PAY_PENDING_KEY);
      } catch {
        /* ignore */
      }
    }
  };

  const handleFreeStart = async () => {
    if (!token || paying || selecting || freeStarting) return;
    setFreeStarting(true);
    try {
      const res = await api.post(`/public/funnel/checkout/${token}/free`);
      persistAuthSession(res.data);
      clearFunnelDraft();
      router.replace("/user/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.error || err?.message || "شروع رایگان ممکن نشد.";
      toastError("خطا", msg);
      setFreeStarting(false);
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

  const current = safeTransforms[slide] || safeTransforms[0];
  const weightLabel =
    current?.weightBefore != null && current?.weightAfter != null
      ? `${toPersianDigits(current.weightBefore)}←${toPersianDigits(current.weightAfter)} کیلو`
      : current?.weightKg != null
        ? `${toPersianDigits(current.weightKg)} کیلو`
        : "";

  const selectedPlan = plans.find(
    (p) => String(p.key || p.id) === String(selectedKey)
  );
  const selectedTitle = String(selectedPlan?.title || checkout?.packageTitle || "");
  const valueTable = selectedTitle.includes("CIP")
    ? PAYMENT_COPY.cipValueTable
    : PAYMENT_COPY.vipValueTable;
  const valueEmoji = selectedTitle.includes("CIP") ? "👑" : "💎";

  return (
    <FunnelShell contentClassName="flex min-h-[100dvh] flex-col !py-0 px-4 pt-6 md:pt-8 lg:px-8">
      <div className="flex min-h-0 flex-1 flex-col">
      <AnimatePresence mode="wait">
        {step === "features" && (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-1 py-4">
              <div className="w-full text-center">
                <LogoAnchor
                  id="payment-features"
                  size={56}
                  thinking={!typingDone}
                  className="mx-auto mb-5 rounded-full"
                />
                <p className="mb-2 text-xs text-primary/80">فیتینو · پیشنهاد نهایی</p>
                <h1 className="min-h-[3.5rem] text-xl font-extrabold leading-relaxed text-white md:text-2xl">
                  <Typewriter
                    key="pay-tw-features"
                    text={PAYMENT_COPY.title}
                    onDone={() => setTypedStep("features")}
                  />
                </h1>
                {typingDone ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto mt-4 max-w-xs rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3"
                  >
                    <p className="text-sm font-extrabold text-white">
                      {checkout.firstName} {checkout.lastName}
                    </p>
                    <p className="mt-1 text-sm font-bold text-primary" dir="ltr">
                      {toPersianDigits(checkout.phone)}
                    </p>
                  </motion.div>
                ) : null}
              </div>

              {typingDone ? (
                <div className="flex w-full justify-center">
                  <FeatureCarousel3D features={PAYMENT_COPY.features} />
                </div>
              ) : null}
            </div>

            {typingDone ? (
              <FunnelStickyBar>
                <DelayedFunnelCta typingDone={typingDone} onClick={() => setStep("proof")}>
                  {PAYMENT_COPY.ctaFeatures}
                </DelayedFunnelCta>
              </FunnelStickyBar>
            ) : (
              <div className="h-24 shrink-0" aria-hidden />
            )}
          </motion.div>
        )}

        {step === "proof" && (
          <motion.div
            key="proof"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-5 px-1 py-4">
              <div className="w-full text-center">
                <LogoAnchor
                  id="payment-proof"
                  size={56}
                  thinking={!typingDone}
                  className="mx-auto mb-5 rounded-full"
                />
                <h2 className="min-h-[3rem] text-lg font-extrabold leading-relaxed text-white md:text-xl">
                  <Typewriter
                    key="pay-tw-proof"
                    text={PAYMENT_COPY.socialProof}
                    onDone={() => setTypedStep("proof")}
                  />
                </h2>
              </div>

              {typingDone ? (
              <div className="w-full">
                <FunnelGlass className="overflow-hidden p-3" glow="green">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slide}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="space-y-3"
                    >
                      <div className="relative grid grid-cols-2 gap-2">
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
                        <motion.div
                          className="pointer-events-none absolute start-1/2 top-1/2 z-10 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/40 bg-black/70 text-primary shadow-lg backdrop-blur"
                          animate={{ x: [6, -6, 6], scale: [1, 1.08, 1] }}
                          transition={{
                            duration: 1.35,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          aria-hidden
                        >
                          <ArrowLeft className="size-4" strokeWidth={2.5} />
                        </motion.div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/25 px-3.5 py-3 text-center">
                        <p className="text-sm font-extrabold text-white">{current.name}</p>
                        <p className="mt-1.5 text-[11px] leading-5 text-white/50">
                          سن {toPersianDigits(current.age)} · قد{" "}
                          {toPersianDigits(current.heightCm)}
                          {weightLabel ? ` · وزن ${weightLabel}` : ""} · تیپ{" "}
                          {current.bodyType}
                        </p>
                        {current.quote ? (
                          <blockquote className="mt-3 flex gap-2 text-start text-[11px] leading-6 text-white/65">
                            <Quote
                              className="mt-0.5 size-3.5 shrink-0 text-primary/80"
                              aria-hidden
                            />
                            <span>{current.quote}</span>
                          </blockquote>
                        ) : null}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="mt-3 flex justify-center gap-2">
                    {safeTransforms.map((_, i) => (
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
              </div>
              ) : null}
            </div>

            {typingDone ? (
              <FunnelStickyBar>
                <DelayedFunnelCta typingDone={typingDone} onClick={() => setStep("plans")}>
                  {PAYMENT_COPY.ctaProof}
                </DelayedFunnelCta>
              </FunnelStickyBar>
            ) : (
              <div className="h-24 shrink-0" aria-hidden />
            )}
          </motion.div>
        )}

        {step === "plans" && (
          <motion.div
            key="plans"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mx-auto w-full max-w-lg space-y-4 pt-2"
          >
            <div className="text-center">
              <LogoAnchor
                id="payment-plans"
                size={52}
                thinking={!typingDone}
                className="mx-auto mb-2 rounded-full"
              />
              <p className="mb-1 text-[11px] font-medium text-primary/85">
                {PAYMENT_COPY.plansEyebrow}
              </p>
              <h2 className="min-h-[3.25rem] text-lg font-extrabold leading-relaxed text-white md:text-xl">
                <Typewriter
                  key="pay-tw-plans"
                  text={PAYMENT_COPY.plansTitle}
                  onDone={() => setTypedStep("plans")}
                />
              </h2>
              {typingDone ? (
                <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-white/50">
                  {PAYMENT_COPY.plansSubtitle}
                </p>
              ) : null}
            </div>

            {typingDone ? (
              <>
            {plans.length === 0 ? (
              <FunnelGlass className="p-4 text-center text-sm text-white/55">
                هنوز پلنی برای این مربی در سیستم ثبت نشده است.
              </FunnelGlass>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {plans.map((plan) => {
                  const planKey = String(plan.key || plan.id);
                  const active = planKey === String(selectedKey);
                  const isVip =
                    plan.popular ||
                    String(plan.title || "").includes("VIP");
                  const Icon = isVip ? Crown : Sparkles;
                  const badge = isVip
                    ? PAYMENT_COPY.vipBadge
                    : PAYMENT_COPY.cipBadge;
                  const featureLines = isVip
                    ? [
                        "برنامه تمرین و تغذیه اختصاصی",
                        "پشتیبانی از طریق پنل و تیکت",
                      ]
                    : [
                        "همه امکانات پلن VIP",
                        "پشتیبانی اختصاصی مربی علی رشیدآبادی",
                      ];
                  return (
                    <button
                      key={planKey}
                      type="button"
                      disabled={selecting || paying}
                      onClick={() => handleSelectPlan(plan)}
                      className={cn(
                        "relative rounded-2xl border p-3.5 text-start transition duration-200",
                        active
                          ? "border-primary/60 bg-gradient-to-b from-primary/20 to-primary/5 shadow-[0_0_32px_-10px_oklch(0.58_0.11_187_/_0.55)]"
                          : "border-white/12 bg-white/[0.03] hover:border-white/20"
                      )}
                    >
                      <span
                        className={cn(
                          "mb-1.5 inline-block rounded-md border px-1.5 py-0.5 text-[9px] font-bold",
                          isVip
                            ? "border-primary/35 bg-primary/15 text-primary"
                            : "border-amber-400/35 bg-amber-500/10 text-amber-200"
                        )}
                      >
                        {badge}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                          <Icon className="size-3.5 text-primary" />
                        </span>
                        <p className="truncate text-sm font-bold text-white">{plan.title}</p>
                        {active ? <Check className="ms-auto size-4 shrink-0 text-primary" /> : null}
                      </div>
                      <p className="mt-2.5 text-lg font-extrabold tracking-tight text-white">
                        {formatToman(plan.amount)}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {featureLines.map((f) => (
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
                <div className="border-b border-white/10 bg-gradient-to-l from-primary/10 to-transparent px-3 py-2.5">
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

            <PaymentConversionBlocks storageKey={token || "checkout"} />

            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] leading-5 text-white/45">
              <ShieldCheck className="size-3.5 text-primary/80" aria-hidden />
              {PAYMENT_COPY.securePay}
            </p>

            <div className="flex flex-col items-center gap-2 pb-2 pt-1">
              <Enamad className="h-16 w-16" />
              <p className="text-[10px] text-white/35">نماد اعتماد الکترونیکی</p>
            </div>

            <FunnelStickyBar>
              <DelayedFunnelCta
                typingDone={typingDone}
                onClick={handlePay}
                disabled={paying || selecting || freeStarting || plans.length === 0}
              >
                {paying ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    در حال اتصال به درگاه...
                  </>
                ) : (
                  PAYMENT_COPY.cta
                )}
              </DelayedFunnelCta>
              <button
                type="button"
                onClick={handleFreeStart}
                disabled={paying || selecting || freeStarting}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75 transition hover:border-white/25 hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
              >
                {freeStarting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    در حال ورود...
                  </span>
                ) : (
                  PAYMENT_COPY.freeStartCta
                )}
              </button>
              <p className="mt-2 text-center text-[10px] leading-5 text-white/35">
                {PAYMENT_COPY.freeStartHint}
              </p>
            </FunnelStickyBar>
              </>
            ) : (
              <div className="h-24" aria-hidden />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </FunnelShell>
  );
}
