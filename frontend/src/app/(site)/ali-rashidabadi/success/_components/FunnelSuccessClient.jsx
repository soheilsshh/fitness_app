"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Phone } from "lucide-react";
import { api } from "@/lib/axios/client";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { SUCCESS_COPY } from "../../_lib/funnelConfig";
import FunnelShell, { FunnelCta, FunnelGlass } from "../../_components/FunnelShell";
import { LogoAnchor } from "../../_components/FunnelLogoLayer";
import { cn } from "@/lib/utils";

function formatToman(n) {
  return new Intl.NumberFormat("fa-IR").format(Number(n || 0)) + " تومان";
}

export default function FunnelSuccessClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const codeParam = searchParams.get("code");

  const [checkout, setCheckout] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .get(`/public/funnel/checkout/${token}`)
      .then((res) => setCheckout(res.data))
      .catch(() => {});
  }, [token]);

  const trackingCode = codeParam || checkout?.trackingCode || "";

  const handleBook = () => {
    if (!selectedSlot) {
      return toastError("زمان را انتخاب کنید", "یکی از بازه‌های مشاوره را انتخاب کنید.");
    }
    setBooked(true);
    toastSuccess("رزرو شد", `زمان ${selectedSlot} برای تماس اولیه ثبت شد.`);
  };

  return (
    <FunnelShell>
      <div className="mx-auto max-w-lg space-y-8 text-center">
        <LogoAnchor id="success" size={72} className="mx-auto rounded-full" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto flex size-20 items-center justify-center rounded-full border border-primary/40 bg-primary/15 shadow-[0_0_40px_-8px_oklch(0.58_0.11_187_/_0.45)]"
        >
          <CheckCircle2 className="size-10 text-primary" />
        </motion.div>

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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <FunnelGlass className="text-start" glow="green">
            <div className="space-y-3 p-6">
              {checkout && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/45">نام</span>
                    <span className="font-medium text-white">
                      {checkout.firstName} {checkout.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/45">موبایل</span>
                    <span className="font-medium text-white" dir="ltr">
                      {checkout.phone}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/45">مبلغ</span>
                    <span className="font-bold text-white">{formatToman(checkout.amount)}</span>
                  </div>
                </>
              )}
              {trackingCode && (
                <div className="flex justify-between border-t border-white/10 pt-3 text-sm">
                  <span className="text-white/45">کد پیگیری</span>
                  <span className="font-bold text-primary">{trackingCode}</span>
                </div>
              )}
            </div>
          </FunnelGlass>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <p className="text-sm leading-8 text-white/60">{SUCCESS_COPY.bookingPrompt}</p>

          <FunnelGlass className="p-4">
            <div className="grid grid-cols-2 gap-2">
              {SUCCESS_COPY.slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  disabled={booked}
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-xs font-medium transition",
                    selectedSlot === slot
                      ? "border-primary/50 bg-primary/15 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25",
                    booked && selectedSlot !== slot && "opacity-40"
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          </FunnelGlass>

          {!booked ? (
            <FunnelCta onClick={handleBook}>
              <Phone className="size-5" />
              {SUCCESS_COPY.cta}
            </FunnelCta>
          ) : (
            <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              زمان {selectedSlot} رزرو شد. تیم مربی با شما هماهنگ می‌کند.
            </div>
          )}

          <Link href="/" className="inline-block text-sm text-white/40 hover:text-white/70">
            بازگشت به صفحه اصلی
          </Link>
        </motion.div>
      </div>
    </FunnelShell>
  );
}
