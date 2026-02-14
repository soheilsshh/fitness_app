"use client";

import { motion } from "framer-motion";
import { FiHash, FiCreditCard, FiInfo, FiTag } from "react-icons/fi";
import { calcTotals, formatDateTimeFa, formatToman, statusMeta } from "./helpers";

export default function OrderDetailsPanel({ order }) {
  const meta = statusMeta(order.status);
  const { subtotal, discount, total } = calcTotals(order.items, order.discountPercent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-[26px] border border-white/10 bg-white/5 p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
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

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <FiCreditCard />
              {order.paymentMethod}
            </span>
            <span>
              کد پیگیری: <span className="text-zinc-200">{order.trackingCode}</span>
            </span>
          </div>

          {order.note ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-950/30 p-3 text-sm text-zinc-200">
              <div className="mb-1 text-[11px] text-zinc-400">یادداشت</div>
              {order.note}
            </div>
          ) : null}
        </div>

        {/* Totals */}
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-white">
            <FiInfo className="text-emerald-300" />
            خلاصه پرداخت
          </div>

          <div className="mt-3 space-y-2 text-sm">
            <Row label="جمع جزء" value={formatToman(subtotal)} />
            <Row
              label="تخفیف"
              value={order.discountPercent ? `(${order.discountPercent}%) ${formatToman(discount)}` : formatToman(0)}
              muted={!order.discountPercent}
            />
            <div className="h-px bg-white/10" />
            <Row label="مبلغ نهایی" value={formatToman(total)} strong />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950/30 p-5">
        <div className="text-sm font-extrabold text-white">آیتم‌های سفارش</div>

        <div className="mt-4 space-y-3">
          {order.items.map((it) => (
            <div
              key={it.refId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4"
            >
              <div>
                <div className="text-sm font-bold text-white">{it.title}</div>
                <div className="mt-1 text-[11px] text-zinc-400">
                  نوع: <span className="text-zinc-200">{it.type === "program" ? "برنامه" : "افزونه"}</span> • تعداد:{" "}
                  <span className="text-zinc-200">{it.qty}</span>
                </div>
              </div>

              <div className="text-sm font-extrabold text-white">
                {formatToman((Number(it.price) || 0) * (Number(it.qty) || 1))}
              </div>
            </div>
          ))}
        </div>

        {order.discountPercent ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200">
            <FiTag />
            تخفیف اعمال شده: <span className="font-bold text-white">{order.discountPercent}%</span>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function Row({ label, value, strong, muted }) {
  return (
    <div className="flex items-center justify-between">
      <span className={["text-zinc-400", muted ? "opacity-70" : ""].join(" ")}>{label}</span>
      <span className={["text-zinc-200", strong ? "font-extrabold text-white" : ""].join(" ")}>
        {value}
      </span>
    </div>
  );
}
