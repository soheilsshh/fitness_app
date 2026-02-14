"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FiChevronRight } from "react-icons/fi";
import { mockOrders } from "./ordersMock";
import OrderDetailsPanel from "./OrderDetailsPanel";

export default function OrderDetailsClient() {
  const params = useParams();
  const rawId = params?.id;
  const id = decodeURIComponent(String(rawId || "")).trim();

  const order = mockOrders.find((o) => String(o.id) === id);

  if (!rawId) {
    return (
      <div className="space-y-4">
        <Link
          href="/user/orders"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 hover:bg-white/10"
        >
          <FiChevronRight />
          برگشت به سفارش‌ها
        </Link>

        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
          پارامتر آیدی دریافت نشد.
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link
          href="/user/orders"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 hover:bg-white/10"
        >
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
      <Link
        href="/user/orders"
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 hover:bg-white/10"
      >
        <FiChevronRight />
        برگشت به سفارش‌ها
      </Link>

      <OrderDetailsPanel order={order} />
    </div>
  );
}
