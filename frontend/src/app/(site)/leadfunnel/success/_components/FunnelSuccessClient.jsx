"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Phone, Sparkles } from "lucide-react";
import { api } from "@/lib/axios/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatToman(n) {
  return new Intl.NumberFormat("fa-IR").format(Number(n || 0)) + " تومان";
}

export default function FunnelSuccessClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const codeParam = searchParams.get("code");

  const [checkout, setCheckout] = useState(null);

  useEffect(() => {
    if (!token) return;
    api.get(`/public/funnel/checkout/${token}`).then((res) => setCheckout(res.data)).catch(() => {});
  }, [token]);

  const trackingCode = codeParam || checkout?.trackingCode || "";

  return (
    <div dir="rtl" className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 start-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-lg px-4 py-16 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-teal-500/15"
        >
          <CheckCircle2 className="size-10 text-teal-500" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Badge variant="outline" className="mb-4 gap-2">
            <Sparkles className="size-3.5 text-teal-500" />
            پرداخت موفق
          </Badge>
          <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">
            ثبت‌نام شما با موفقیت انجام شد
          </h1>
          <p className="mt-4 text-base leading-8 text-muted-foreground">
            تیم استاد {checkout?.coachName || "علی رشید آبادی"} در اسرع وقت با شماره ثبت‌شده
            تماس خواهند گرفت تا مراحل بعدی را هماهنگ کنند.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-8"
        >
          <Card className="border-teal-500/20 bg-card/90 text-start shadow-lg backdrop-blur-sm">
            <CardContent className="space-y-3 p-6">
              {checkout && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">نام</span>
                    <span className="font-medium">{checkout.firstName} {checkout.lastName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">موبایل</span>
                    <span className="font-medium" dir="ltr">{checkout.phone}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">مبلغ</span>
                    <span className="font-bold">{formatToman(checkout.amount)}</span>
                  </div>
                </>
              )}
              {trackingCode && (
                <div className="flex justify-between border-t border-border pt-3 text-sm">
                  <span className="text-muted-foreground">کد پیگیری</span>
                  <span className="font-bold text-primary">{trackingCode}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="size-4 text-primary" />
            منتظر تماس تیم مربی باشید
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">بازگشت به صفحه اصلی</Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
