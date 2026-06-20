"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearCart,
  selectCartCoach,
  selectCartItems,
  selectCartTotal,
} from "@/store/slices/cartSlice";
import { FiChevronRight, FiShield, FiCheckCircle, FiUser } from "react-icons/fi";
import Footer from "./Footer";
import { api } from "@/lib/axios/client";
import { toastError } from "../auth/_components/helpers";
import { isLoggedIn } from "@/lib/auth/session";
import { buildAuthUrl } from "@/lib/auth/postAuthRedirect";

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
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  const loginHref = buildAuthUrl("/auth/login", "/payment");
  const registerHref = buildAuthUrl("/auth/register", "/payment");

  const canPay = useMemo(() => items.length > 0 && !paying, [items.length, paying]);

  const redirectToAuth = () => {
    router.push(loginHref);
  };

  const handleCheckout = async () => {
    if (!canPay) return;

    if (!isLoggedIn()) {
      toastError("ورود لازم است", "برای پرداخت ابتدا وارد شوید یا ثبت‌نام کنید.");
      redirectToAuth();
      return;
    }

    setPaying(true);
    try {
      const payload = {
        items: items.map((it) => ({
          planId: Number(it.planId || it.id),
          qty: 1,
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
        redirectToAuth();
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

        {!loggedIn && items.length > 0 ? (
          <div className="mb-6 rounded-[26px] border border-amber-400/30 bg-amber-400/10 p-5">
            <div className="flex items-start gap-3">
              <FiUser className="mt-0.5 shrink-0 text-amber-300" />
              <div>
                <div className="text-sm font-extrabold text-amber-100">
                  برای پرداخت باید وارد حساب شوید
                </div>
                <p className="mt-1 text-sm text-amber-100/80">
                  محصولات شما در سبد خرید ذخیره شده‌اند. پس از ورود یا ثبت‌نام، به همین صفحه
                  برمی‌گردید و می‌توانید پرداخت را انجام دهید.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={loginHref}
                    className="rounded-2xl bg-white px-4 py-2.5 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
                  >
                    ورود
                  </Link>
                  <Link
                    href={registerHref}
                    className="rounded-2xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-white/10"
                  >
                    ثبت‌نام
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}

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
                        اشتراک تمرینی
                      </div>
                    </div>
                    <div className="text-sm font-extrabold text-white">
                      {formatToman(it.price)}
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
              {paying
                ? "در حال ثبت سفارش..."
                : loggedIn
                  ? "ادامه به درگاه (دمو)"
                  : "ورود و ادامه پرداخت"}
            </button>

            <div className="mt-3 text-[11px] text-zinc-500">
              {loggedIn
                ? "پرداخت فعلاً به صورت دمو است."
                : "برای خرید باید با حساب دانشجو وارد شده باشید. پرداخت فعلاً به صورت دمو است."}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
