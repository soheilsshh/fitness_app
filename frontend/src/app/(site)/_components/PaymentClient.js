"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectCartItems, selectCartTotal } from "@/store/slices/cartSlice";
import { FiChevronRight, FiShield, FiCheckCircle } from "react-icons/fi";
import Footer from "./Footer";

function formatToman(n) {
  const num = Number(n) || 0;
  return `${num.toLocaleString("fa-IR")} تومان`;
}

export default function PaymentClient() {
  const router = useRouter();
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);

  const [form, setForm] = useState({
    firstName: "شهاب",
    lastName: "صفری",
    phone: "09xxxxxxxxx",
    nationalId: "",
  });

  const canPay = useMemo(() => {
    if (items.length === 0) return false;
    if (!form.firstName.trim() || !form.lastName.trim()) return false;
    if (!form.phone.trim()) return false;
    return true;
  }, [items.length, form]);

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

        <div className="grid gap-4 mb-10 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Items */}
          <div className="rounded-[26px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <FiCheckCircle className="text-emerald-300" />
              تایید نهایی محصولات
            </div>

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

          {/* User info + Pay */}
          <div className="rounded-[26px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <FiShield className="text-cyan-300" />
              اطلاعات خریدار
            </div>

            <div className="mt-4 grid gap-3">
              <Field
                label="نام"
                value={form.firstName}
                onChange={(v) => setForm((p) => ({ ...p, firstName: v }))}
              />
              <Field
                label="نام خانوادگی"
                value={form.lastName}
                onChange={(v) => setForm((p) => ({ ...p, lastName: v }))}
              />
              <Field
                label="شماره تماس"
                value={form.phone}
                onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
              />
              <Field
                label="کد ملی (اختیاری)"
                value={form.nationalId}
                onChange={(v) => setForm((p) => ({ ...p, nationalId: v }))}
              />
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
              onClick={() => router.push("/payment/bank")}
              className={[
                "mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200",
                !canPay ? "opacity-50 pointer-events-none" : "",
              ].join(" ")}
            >
              پرداخت
            </button>

            <div className="mt-3 text-[11px] text-zinc-500">
              در نسخه دمو، با کلیک روی پرداخت به صفحه شبیه‌سازی درگاه بانکی
              می‌روید.
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-bold text-zinc-300">{label}</div>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/20"
      />
    </label>
  );
}
