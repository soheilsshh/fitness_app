"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeFromCart,
  selectCartItems,
  selectCartTotal,
  setQty,
} from "@/store/slices/cartSlice";
import { FiMinus, FiPlus, FiTrash2, FiX } from "react-icons/fi";

function formatToman(n) {
  const num = Number(n) || 0;
  return `${num.toLocaleString("fa-IR")} تومان`;
}

export default function CartDrawer({ open, onClose }) {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Left drawer */}
          <motion.aside
            className={[
              "fixed left-0 top-0 z-[61] isolate",
              "h-dvh min-h-dvh w-[92vw] max-w-md",
              "border-r border-white/10 bg-zinc-950/95",
              "shadow-[20px_0_60px_-20px_rgba(0,0,0,0.9)]",
            ].join(" ")}
            initial={{ x: "-110%" }}
            animate={{ x: 0 }}
            exit={{ x: "-110%" }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex h-full min-h-dvh flex-col">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div>
                  <div className="text-sm font-extrabold text-white">سبد خرید</div>
                  <div className="mt-1 text-[11px] text-zinc-400">
                    آیتم‌ها را بررسی کنید و ثبت سفارش بزنید
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-2 text-zinc-100 hover:bg-white/10"
                  aria-label="Close"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-auto p-5">
                {items.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
                    سبد خرید خالی است.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((it) => (
                      <div
                        key={it.id}
                        className="rounded-3xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-extrabold text-white">
                              {it.title}
                            </div>
                            <div className="mt-1 text-[11px] text-zinc-400">
                              قیمت واحد: {formatToman(it.price)}
                            </div>
                          </div>

                          <button
                            onClick={() => dispatch(removeFromCart(it.id))}
                            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/40 p-2 text-zinc-200 hover:bg-white/10"
                            aria-label="Remove"
                          >
                            <FiTrash2 className="text-lg" />
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-2 py-2">
                            <button
                              onClick={() =>
                                dispatch(setQty({ id: it.id, qty: it.qty - 1 }))
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                            >
                              <FiMinus />
                            </button>

                            <input
                              value={it.qty}
                              onChange={(e) =>
                                dispatch(setQty({ id: it.id, qty: e.target.value }))
                              }
                              className="w-10 bg-transparent text-center text-sm font-extrabold text-white outline-none"
                            />

                            <button
                              onClick={() =>
                                dispatch(setQty({ id: it.id, qty: it.qty + 1 }))
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                            >
                              <FiPlus />
                            </button>
                          </div>

                          <div className="text-sm font-extrabold text-white">
                            {formatToman(it.price * it.qty)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer (safe-area friendly) */}
              <div className="border-t border-white/10 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <div className="mb-3 flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="text-sm text-zinc-300">قیمت کل</span>
                  <span className="text-base font-extrabold text-white">
                    {formatToman(total)}
                  </span>
                </div>

                <Link
                  href="/payment"
                  onClick={onClose}
                  className={[
                    "block w-full rounded-2xl bg-white px-4 py-3 text-center text-sm font-extrabold text-zinc-950 hover:bg-zinc-200",
                    items.length === 0 ? "pointer-events-none opacity-50" : "",
                  ].join(" ")}
                >
                  ثبت سفارش
                </Link>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
