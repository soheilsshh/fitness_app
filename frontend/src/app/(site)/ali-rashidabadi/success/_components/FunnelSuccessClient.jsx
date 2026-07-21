"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, LayoutDashboard, Loader2 } from "lucide-react";
import { api } from "@/lib/axios/client";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { persistAuthSession } from "@/lib/auth/session";
import { SUCCESS_COPY } from "../../_lib/funnelConfig";
import { clearFunnelDraft } from "../../_lib/funnelDraft";
import FunnelShell, { FunnelCta, FunnelGlass, FunnelStickyBar } from "../../_components/FunnelShell";
import { LogoAnchor } from "../../_components/FunnelLogoLayer";

function formatToman(n) {
  return new Intl.NumberFormat("fa-IR").format(Number(n || 0)) + " تومان";
}

export default function FunnelSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const codeParam = searchParams.get("code");

  const [checkout, setCheckout] = useState(null);
  const [entering, setEntering] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    clearFunnelDraft();
  }, []);

  useEffect(() => {
    if (!token) return;
    api
      .get(`/public/funnel/checkout/${token}`)
      .then((res) => setCheckout(res.data))
      .catch(() => {});
  }, [token]);

  const trackingCode = codeParam || checkout?.trackingCode || "";

  const copyTracking = async () => {
    if (!trackingCode) return;
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      toastSuccess("کپی شد", SUCCESS_COPY.copiedTracking);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toastError("خطا", "کپی کد پیگیری ممکن نشد.");
    }
  };

  const enterDashboard = async () => {
    if (!token || entering) return;
    setEntering(true);
    try {
      const res = await api.post(`/public/funnel/checkout/${token}/session`);
      persistAuthSession(res.data);
      router.replace("/user/dashboard");
    } catch (err) {
      const msg = err?.response?.data?.error || "ورود به پنل ممکن نشد.";
      toastError("خطا", msg);
      setEntering(false);
    }
  };

  return (
    <FunnelShell>
      <div className="mx-auto max-w-lg space-y-7 text-center">
        <LogoAnchor id="success" size={72} className="mx-auto rounded-full" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto flex size-20 items-center justify-center rounded-full border border-primary/40 bg-primary/15 shadow-[0_0_40px_-8px_oklch(0.58_0.11_187_/_0.45)]"
        >
          <CheckCircle2 className="size-10 text-primary" />
        </motion.div>

        {/* 1) Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h1 className="text-2xl font-extrabold leading-relaxed text-white md:text-3xl">
            {SUCCESS_COPY.title}
          </h1>
          <p className="mt-4 text-sm leading-8 text-white/55 md:text-base">
            {SUCCESS_COPY.subtitle}
          </p>
        </motion.div>

        {/* 2) Receipt */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <FunnelGlass className="text-start" glow="green">
            <div className="space-y-3 p-6">
              {checkout && (
                <>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-white/45">نام</span>
                    <span className="font-medium text-white">
                      {checkout.firstName} {checkout.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-white/45">موبایل</span>
                    <span className="font-medium text-white" dir="ltr">
                      {checkout.phone}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-white/45">مبلغ</span>
                    <span className="font-bold text-white">{formatToman(checkout.amount)}</span>
                  </div>
                  {checkout.packageTitle ? (
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-white/45">پلن</span>
                      <span className="font-medium text-white">{checkout.packageTitle}</span>
                    </div>
                  ) : null}
                </>
              )}
              {trackingCode ? (
                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-sm">
                  <span className="text-white/45">کد پیگیری</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary" dir="ltr">
                      {trackingCode}
                    </span>
                    <button
                      type="button"
                      onClick={copyTracking}
                      className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary transition hover:bg-primary/20"
                    >
                      <Copy className="size-3" />
                      {copied ? SUCCESS_COPY.copiedTracking : SUCCESS_COPY.copyTracking}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </FunnelGlass>
        </motion.div>

        {/* 3) Consultation registered — no time slot */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <FunnelGlass className="p-5 text-start" glow="teal">
            <p className="text-base font-extrabold text-white">{SUCCESS_COPY.consultationTitle}</p>
            <p className="mt-2 text-sm leading-8 text-white/60">{SUCCESS_COPY.consultationBody}</p>
          </FunnelGlass>

          <FunnelStickyBar>
            <FunnelCta onClick={enterDashboard} disabled={entering || !token}>
              {entering ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  در حال ورود...
                </>
              ) : (
                <>
                  <LayoutDashboard className="size-5" />
                  {SUCCESS_COPY.dashboardCta}
                </>
              )}
            </FunnelCta>
          </FunnelStickyBar>
        </motion.div>
      </div>
    </FunnelShell>
  );
}
