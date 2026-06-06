"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FiChevronRight } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import OrderDetailsPanel from "./OrderDetailsPanel";

export default function OrderDetailsClient() {
  const params = useParams();
  const rawId = params?.id;
  const id = decodeURIComponent(String(rawId || "")).trim();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/me/orders/${id}`);
        if (!cancelled) setOrder(res.data);
      } catch {
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (!rawId) {
    return (
      <div className="space-y-4">
        <Link href="/user/orders" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 hover:bg-white/10">
          <FiChevronRight />
          برگشت به سفارش‌ها
        </Link>
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
          پارامتر آیدی دریافت نشد.
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-sm text-zinc-400">در حال بارگذاری...</div>;
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link href="/user/orders" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 hover:bg-white/10">
          <FiChevronRight />
          برگشت به سفارش‌ها
        </Link>
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
          سفارش پیدا نشد.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/user/orders" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 hover:bg-white/10">
        <FiChevronRight />
        برگشت به سفارش‌ها
      </Link>
      <OrderDetailsPanel order={order} />
    </div>
  );
}
