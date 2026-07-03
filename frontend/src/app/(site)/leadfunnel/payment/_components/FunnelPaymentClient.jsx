"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/axios/client";
import { toastError } from "@/app/(site)/auth/_components/helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatToman(n) {
  return new Intl.NumberFormat("fa-IR").format(Number(n || 0)) + " تومان";
}

export default function FunnelPaymentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
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
        `/leadfunnel/success?token=${token}&code=${encodeURIComponent(checkout.trackingCode || "")}`
      );
    }
  }, [checkout, token, router]);

  const handlePay = async () => {
    if (!token || paying) return;
    setPaying(true);
    try {
      const res = await api.post(`/public/funnel/checkout/${token}/pay`);
      router.push(`/leadfunnel/success?token=${token}&code=${encodeURIComponent(res.data?.trackingCode || "")}`);
    } catch (err) {
      const msg = err?.response?.data?.error || "پرداخت ناموفق بود.";
      toastError("خطا", msg);
    } finally {
      setPaying(false);
    }
  };

  if (!token) {
    return (
      <div dir="rtl" className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-muted-foreground">لینک پرداخت نامعتبر است.</p>
        <Button asChild className="mt-4">
          <Link href="/leadfunnel">بازگشت به ارزیابی</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[60vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        در حال بارگذاری...
      </div>
    );
  }

  if (!checkout) {
    return (
      <div dir="rtl" className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-muted-foreground">اطلاعات پرداخت یافت نشد.</p>
        <Button asChild className="mt-4">
          <Link href="/leadfunnel">شروع مجدد</Link>
        </Button>
      </div>
    );
  }

  if (checkout.status === "paid") {
    return (
      <div dir="rtl" className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        در حال انتقال...
      </div>
    );
  }

  return (
    <div dir="rtl" className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 start-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-lg px-4 py-10 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <Badge variant="outline" className="mb-4 gap-2">
            <CreditCard className="size-3.5" />
            پرداخت امن
          </Badge>
          <h1 className="text-2xl font-extrabold text-foreground">تکمیل خرید پکیج</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {checkout.firstName} {checkout.lastName} · {checkout.phone}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden border-border/80 bg-card/90 py-0 shadow-xl backdrop-blur-sm">
            <div className="bg-linear-to-l from-primary/15 to-transparent px-6 py-5">
              <p className="text-xs text-muted-foreground">مربی</p>
              <p className="text-lg font-bold text-foreground">{checkout.coachName}</p>
            </div>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-sm text-muted-foreground">{checkout.packageTitle}</p>
                <p className="mt-1 text-3xl font-extrabold text-foreground">
                  {formatToman(checkout.amount)}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm leading-7 text-muted-foreground">
                <p className="font-medium text-foreground">{checkout.analysisTitle}</p>
                <p className="mt-1">تحلیل شما ثبت شده و پس از پرداخت برای تیم مربی ارسال می‌شود.</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" />
                پرداخت دمو — پس از اتصال درگاه واقعی، همین صفحه به درگاه بانکی متصل می‌شود.
              </div>

              <Button
                type="button"
                size="lg"
                disabled={paying}
                onClick={handlePay}
                className="w-full rounded-full py-6 text-base font-bold"
              >
                {paying ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    در حال پردازش...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-5" />
                    پرداخت
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
