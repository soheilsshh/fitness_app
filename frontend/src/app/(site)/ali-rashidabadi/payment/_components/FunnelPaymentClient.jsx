"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  CreditCard,
  Loader2,
  ShieldCheck,
  Smartphone,
  UserRound,
  Utensils,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { toastError } from "@/app/(site)/auth/_components/helpers";
import { PAYMENT_COPY } from "../../_lib/funnelConfig";
import FunnelShell, { FunnelCta, FunnelGlass } from "../../_components/FunnelShell";
import { LogoAnchor } from "../../_components/FunnelLogoLayer";

function formatToman(n) {
  return new Intl.NumberFormat("fa-IR").format(Number(n || 0)) + " تومان";
}

const FEATURE_ICONS = {
  bot: Bot,
  user: UserRound,
  utensils: Utensils,
  smartphone: Smartphone,
};

export default function FunnelPaymentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [paying, setPaying] = useState(false);
  const [slide, setSlide] = useState(0);

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
    if (checkout?.status === "paid" && token) {
      router.replace(
        `/ali-rashidabadi/success?token=${token}&code=${encodeURIComponent(checkout.trackingCode || "")}`
      );
    }
  }, [checkout, token, router]);

  useEffect(() => {
    const transforms = PAYMENT_COPY.transformations;
    if (!transforms.length) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % transforms.length), 4500);
    return () => clearInterval(id);
  }, []);

  const handlePay = async () => {
    if (!token || paying) return;
    setPaying(true);
    try {
      const res = await api.post(`/public/funnel/checkout/${token}/pay`);
      router.push(
        `/ali-rashidabadi/success?token=${token}&code=${encodeURIComponent(res.data?.trackingCode || "")}`
      );
    } catch (err) {
      const msg = err?.response?.data?.error || "پرداخت ناموفق بود.";
      toastError("خطا", msg);
    } finally {
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

  return (
    <FunnelShell>
      <div className="space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <LogoAnchor id="payment" size={64} className="mx-auto mb-3 rounded-full" />
          <p className="mb-3 text-xs text-primary/80">فیتینو · پیشنهاد نهایی</p>
          <h1 className="text-2xl font-extrabold leading-relaxed text-white md:text-3xl">
            {PAYMENT_COPY.title}
          </h1>
          <p className="mt-2 text-sm text-white/45">
            {checkout.firstName} {checkout.lastName} · {checkout.phone}
          </p>
        </motion.div>

        <section className="grid gap-3 sm:grid-cols-2">
          {PAYMENT_COPY.features.map((feat, i) => {
            const Icon = FEATURE_ICONS[feat.icon] || Bot;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <FunnelGlass className="h-full p-5">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{feat.title}</h3>
                  <p className="mt-2 text-xs leading-7 text-white/55">{feat.body}</p>
                </FunnelGlass>
              </motion.div>
            );
          })}
        </section>

        <section className="space-y-4">
          <h2 className="text-center text-base font-bold text-white md:text-lg">
            {PAYMENT_COPY.socialProof}
          </h2>
          <FunnelGlass className="overflow-hidden p-3" glow="green">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                className="grid gap-3 sm:grid-cols-2"
              >
                {[
                  { src: current.before, label: "قبل" },
                  { src: current.after, label: "بعد" },
                ].map((img) => (
                  <div
                    key={img.label}
                    className="relative overflow-hidden rounded-2xl border border-white/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      alt={`${current.name} — ${img.label}`}
                      className="aspect-[3/4] w-full object-cover"
                    />
                    <span className="absolute bottom-3 start-3 rounded-lg border border-white/20 bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                      {img.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
            <div className="mt-3 flex justify-center gap-2">
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
        </section>

        <FunnelGlass className="overflow-hidden">
          <div className="border-b border-white/10 bg-gradient-to-l from-primary/15 to-transparent px-6 py-5">
            <p className="text-xs text-white/45">مربی</p>
            <p className="text-lg font-bold text-white">{checkout.coachName}</p>
            <p className="mt-1 text-sm text-white/55">{checkout.packageTitle}</p>
          </div>
          <div className="space-y-4 p-6">
            <p className="text-3xl font-extrabold text-white">{formatToman(checkout.amount)}</p>
            {checkout.analysisTitle && (
              <p className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm leading-7 text-white/55">
                <span className="font-medium text-white">{checkout.analysisTitle}</span>
                <br />
                تحلیل شما ثبت شده و پس از پرداخت برای تیم مربی ارسال می‌شود.
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-white/40">
              <ShieldCheck className="size-4 text-primary" />
              پرداخت امن — در صورت نیاز به درگاه واقعی، همین صفحه متصل می‌شود.
            </div>
            <FunnelCta onClick={handlePay} disabled={paying}>
              {paying ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  در حال پردازش...
                </>
              ) : (
                <>
                  <CreditCard className="size-5" />
                  {PAYMENT_COPY.cta}
                </>
              )}
            </FunnelCta>
          </div>
        </FunnelGlass>
      </div>
    </FunnelShell>
  );
}
