"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearCart,
  selectCartCoach,
  selectCartItems,
  selectCartTotal,
} from "@/store/slices/cartSlice";
import { FiChevronRight, FiShield, FiCheckCircle } from "react-icons/fi";
import Footer from "./Footer";
import { api } from "@/lib/axios/client";
import { toastError } from "../auth/_components/helpers";

function formatToman(n) {
  const num = Number(n) || 0;
  return `${num.toLocaleString("fa-IR")} تومان`;
}

export default function PaymentClient() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);
  const coach = useAppSelector(selectCartCoach);
  const [paying, setPaying] = useState(false);

  const canPay = useMemo(() => items.length > 0 && !paying, [items.length, paying]);

  const handleCheckout = async () => {
    if (!canPay) return;
    setPaying(true);
    try {
      const payload = {
        items: items.map((it) => ({
          planId: Number(it.planId || it.id),
          qty: it.qty,
        })),
      };
      const res = await api.post("/orders/checkout", payload);
      const { orderId, paymentGatewayUrl } = res.data || {};
      dispatch(clearCart());
      const target =
        paymentGatewayUrl || (orderId ? `/payment/bank?orderId=${orderId}` : "/payment/bank");
      router.push(target);
    } catch (error) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.error || "ثبت سفارش ناموفق بود";
      if (status === 409) {
        toastError("محدودیت خرید", "شما قبلاً زیر نظر یک مربی هستید و نمی‌توانید دوباره خرید کنید.");
      } else if (status === 401 || status === 403) {
        toastError("ورود لازم است", "برای خرید باید به عنوان دانشجو وارد شوید.");
        router.push("/auth/login?next=/payment");
      } else {
        toastError("خطا", msg);
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 hover:bg-white/10"
          >
            <FiChevronRight />
            برگشت به سایت
          </Link>
        </div>

        <div className="mb-10 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[26px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <FiCheckCircle className="text-emerald-300" />
              تایید نهایی محصولات
            </div>

            {coach.coachName ? (
              <div className="mt-3 text-sm text-zinc-400">
                مربی: <span className="text-emerald-300">{coach.coachName}</span>
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
                  سبد خرید خالی است.
                </div>
              ) : (
                items.map((it) => (
                  <div
                    key={it.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-zinc-950/30 p-4"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-white">
                        {it.title}
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-400">
                        {it.qty} × {formatToman(it.price)}
                      </div>
                    </div>
                    <div className="text-sm font-extrabold text-white">
                      {formatToman(it.price * it.qty)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <FiShield className="text-cyan-300" />
              پرداخت
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">مبلغ قابل پرداخت</span>
                <span className="text-base font-extrabold text-white">
                  {formatToman(total)}
                </span>
              </div>
            </div>

            <button
              disabled={!canPay}
              onClick={handleCheckout}
              className={[
                "mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200",
                !canPay ? "pointer-events-none opacity-50" : "",
              ].join(" ")}
            >
              {paying ? "در حال ثبت سفارش..." : "ادامه به درگاه (دمو)"}
            </button>

            <div className="mt-3 text-[11px] text-zinc-500">
              برای خرید باید با حساب دانشجو وارد شده باشید. پرداخت فعلاً به صورت دمو است.
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
