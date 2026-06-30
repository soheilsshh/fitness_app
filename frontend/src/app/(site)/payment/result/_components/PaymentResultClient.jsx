"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import Footer from "../../../_components/Footer";

export default function PaymentResultClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const txId = searchParams.get("tx_id");
  const refId = searchParams.get("ref_id");

  const success = status === "success";
  const [orderStatus, setOrderStatus] = useState(null);

  useEffect(() => {
    if (!txId) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get(`/orders/${txId}/status`);
        if (!cancelled) setOrderStatus(res.data?.status || null);
      } catch {
        if (!cancelled) setOrderStatus(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [txId]);

  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile || !txId) return;
    const deepLink = `fitinoo://payment?status=${encodeURIComponent(status || "failed")}&tx_id=${encodeURIComponent(txId)}${refId ? `&ref_id=${encodeURIComponent(refId)}` : ""}`;
    window.location.href = deepLink;
  }, [status, txId, refId]);

  const verifiedSuccess = useMemo(() => {
    if (orderStatus === "paid") return true;
    if (orderStatus === "failed") return false;
    return success;
  }, [orderStatus, success]);

  return (
    <>
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-8 text-center">
          {verifiedSuccess ? (
            <FiCheckCircle className="mx-auto text-5xl text-emerald-400" />
          ) : (
            <FiXCircle className="mx-auto text-5xl text-rose-400" />
          )}

          <h1 className="mt-4 text-xl font-extrabold text-white">
            {verifiedSuccess ? "پرداخت موفق" : "پرداخت ناموفق"}
          </h1>

          <p className="mt-2 text-sm text-zinc-300">
            {verifiedSuccess
              ? "اشتراک شما پس از تأیید نهایی فعال می‌شود."
              : "پرداخت انجام نشد یا لغو شد. می‌توانید دوباره تلاش کنید."}
          </p>

          {txId ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950/30 p-4 text-sm text-zinc-200">
              <div>شماره سفارش: <span className="font-bold text-white">{txId}</span></div>
              {refId ? (
                <div className="mt-2">کد پیگیری زرین‌پال: <span className="font-bold text-white">{refId}</span></div>
              ) : null}
              {orderStatus ? (
                <div className="mt-2">وضعیت سفارش: <span className="text-emerald-300">{orderStatus}</span></div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3">
            {verifiedSuccess && txId ? (
              <Link
                href={`/user/orders/${txId}`}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
              >
                مشاهده سفارش
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/payment")}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
              >
                تلاش مجدد
              </button>
            )}
            <Link href="/user/my-programs" className="text-sm text-zinc-400 hover:text-white">
              رفتن به برنامه‌های من
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
