"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios/client";
import { toastError } from "@/app/(site)/auth/_components/helpers";

function formatToman(n) {
  return `${Number(n || 0).toLocaleString("fa-IR")} تومان`;
}

export default function BankPaymentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(!!orderId);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get(`/orders/${orderId}/status`);
        if (!cancelled) setOrder(res.data);
      } catch {
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const total = order?.items?.reduce((sum, it) => sum + (it.price || 0) * (it.qty || 0), 0) || 0;

  const onConfirm = () => {
    if (orderId) {
      router.push(`/user/orders/detail?id=${encodeURIComponent(orderId)}`);
      return;
    }
    toastError("خطا", "شناسه سفارش یافت نشد");
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-8 text-center">
        <div className="text-xl font-extrabold text-white">درگاه بانکی (دمو)</div>
        <div className="mt-2 text-sm text-zinc-300">
          پرداخت در بکند به صورت خودکار تأیید شده است.
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-zinc-400">در حال بارگذاری سفارش...</div>
        ) : order ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950/30 p-5 text-right text-sm text-zinc-200">
            <div>کد پیگیری: <span className="font-bold text-white">{order.trackingCode}</span></div>
            <div className="mt-2">وضعیت: <span className="text-teal-300">{order.status}</span></div>
            {order.coachName ? (
              <div className="mt-2">مربی: <span className="text-teal-300">{order.coachName}</span></div>
            ) : null}
            <div className="mt-2">مبلغ: <span className="font-bold text-white">{formatToman(total)}</span></div>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950/30 p-5 text-sm text-zinc-200">
            سفارش شما ثبت شد. برای مشاهده جزئیات وارد پنل شوید.
          </div>
        )}

        <button
          type="button"
          onClick={onConfirm}
          className="mt-6 w-full rounded-2xl bg-teal-500 px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-teal-400"
        >
          پرداخت موفق (دمو) — مشاهده سفارش
        </button>

        <Link
          href="/user/orders"
          className="mt-3 inline-block text-sm text-zinc-400 hover:text-white"
        >
          رفتن به لیست سفارش‌ها
        </Link>
      </div>
    </div>
  );
}
