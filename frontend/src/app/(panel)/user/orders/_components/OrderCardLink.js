"use client";

import Link from "next/link";
import { FiChevronLeft, FiHash, FiCreditCard } from "react-icons/fi";
import { calcTotals, formatDateTimeFa, formatToman, statusMeta } from "./helpers";

export default function OrderCardLink({ order }) {
  const meta = statusMeta(order.status);
  const { total } = calcTotals(order.items, order.discountPercent);

  return (
    <Link
      href={`/user/orders/${encodeURIComponent(order.id)}`}
      className="block rounded-[26px] border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={["rounded-full border px-3 py-1 text-[11px]", meta.badge].join(" ")}>
              {meta.label}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1 text-[11px] text-zinc-200">
              <FiHash />
              {order.id}
            </span>
          </div>

          <div className="mt-2 text-sm text-zinc-300">{formatDateTimeFa(order.createdAt)}</div>

          <div className="mt-3 text-base font-extrabold text-white">
            مبلغ پرداختی: {formatToman(total)}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <FiCreditCard />
              {order.paymentMethod}
            </span>
            <span>کد پیگیری: <span className="text-zinc-200">{order.trackingCode}</span></span>
          </div>
        </div>

        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/30 text-zinc-100">
          <FiChevronLeft className="text-xl" />
        </span>
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
        <div className="text-[11px] text-zinc-400">آیتم‌ها</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {order.items.slice(0, 3).map((it) => (
            <span
              key={it.refId}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-zinc-200"
            >
              {it.title}
            </span>
          ))}
          {order.items.length > 3 && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-zinc-200">
              +{order.items.length - 3} مورد دیگر
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
