"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { api } from "@/lib/axios/client";
import { toastError } from "@/app/(site)/auth/_components/helpers";
import { PAY_RESULT_COPY } from "../../../_lib/funnelConfig";
import { clearFunnelDraft } from "../../../_lib/funnelDraft";
import FunnelShell, { FunnelCta, FunnelGlass, FunnelStickyBar } from "../../../_components/FunnelShell";
import { LogoAnchor } from "../../../_components/FunnelLogoLayer";

export default function FunnelPaymentResultClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = (searchParams.get("status") || "").toLowerCase();
  const token = searchParams.get("token") || "";
  const code = searchParams.get("code") || searchParams.get("ref_id") || "";

  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (status === "success" && token) {
      clearFunnelDraft();
      router.replace(
        `/ali-rashidabadi/success?token=${encodeURIComponent(token)}&code=${encodeURIComponent(code)}`
      );
    }
  }, [status, token, code, router]);

  // Unlock retry CTA if user returns via browser back / bfcache.
  useEffect(() => {
    const unlock = () => setRetrying(false);
    unlock();
    const onPageShow = () => unlock();
    const onVisible = () => {
      if (document.visibilityState === "visible") unlock();
    };
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token]);

  const handleRetry = async () => {
    if (!token || retrying) return;
    setRetrying(true);
    const safety = setTimeout(() => setRetrying(false), 12000);
    try {
      const res = await api.post(`/public/funnel/checkout/${token}/pay`);
      const paymentUrl = res.data?.paymentUrl;
      if (!paymentUrl) throw new Error("آدرس درگاه دریافت نشد");
      window.location.assign(paymentUrl);
    } catch (err) {
      clearTimeout(safety);
      const msg =
        err?.response?.data?.error || err?.message || "اتصال مجدد به درگاه ناموفق بود.";
      toastError("خطا", msg);
      setRetrying(false);
    }
  };

  if (status === "success") {
    return (
      <FunnelShell centered>
        <div className="flex items-center justify-center gap-2 text-white/55">
          <Loader2 className="size-5 animate-spin text-primary" />
          {PAY_RESULT_COPY.successRedirect}
        </div>
      </FunnelShell>
    );
  }

  return (
    <FunnelShell>
      <div className="mx-auto flex min-h-[calc(100dvh-6rem)] max-w-lg flex-col justify-center space-y-7 text-center">
        <LogoAnchor id="pay-failed" size={64} className="mx-auto rounded-full" />

        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
          className="mx-auto flex size-20 items-center justify-center rounded-full border border-orange-400/40 bg-orange-400/10 shadow-[0_0_40px_-8px_rgba(251,146,60,0.4)]"
        >
          <AlertTriangle className="size-9 text-orange-300" />
        </motion.div>

        <div>
          <h1 className="text-2xl font-extrabold leading-relaxed text-white">
            {PAY_RESULT_COPY.failedTitle}
          </h1>
          <p className="mt-3 text-sm leading-8 text-white/55">{PAY_RESULT_COPY.failedSubtitle}</p>
        </div>

        <FunnelGlass className="p-5 text-start" glow="warn">
          <ul className="space-y-2 text-xs leading-6 text-white/60">
            <li>• مبلغ از حساب شما کسر نشده یا در حال برگشت است.</li>
            <li>• می‌توانید بلافاصله دوباره پرداخت را امتحان کنید.</li>
            <li>• اگر مشکل ادامه داشت، چند دقیقه بعد دوباره تلاش کنید.</li>
          </ul>
        </FunnelGlass>

        <FunnelStickyBar>
          {token ? (
            <FunnelCta onClick={handleRetry} disabled={retrying}>
              {retrying ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  در حال اتصال...
                </>
              ) : (
                <>
                  <RefreshCw className="size-5" />
                  {PAY_RESULT_COPY.retryCta}
                </>
              )}
            </FunnelCta>
          ) : (
            <Link href="/ali-rashidabadi" className="btn-cta block text-center">
              شروع مجدد ارزیابی
            </Link>
          )}
          {token ? (
            <Link
              href={`/ali-rashidabadi/payment?token=${encodeURIComponent(token)}`}
              className="mt-2 block text-center text-xs text-white/45 underline-offset-2 hover:text-white/70 hover:underline"
            >
              {PAY_RESULT_COPY.backToPlans}
            </Link>
          ) : null}
        </FunnelStickyBar>
      </div>
    </FunnelShell>
  );
}
