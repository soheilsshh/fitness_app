"use client";

import { useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectCartCount, selectCartItems, selectCartTotal } from "@/store/slices/cartSlice";
import { AnimatePresence, motion } from "framer-motion";
import { FiShoppingCart } from "react-icons/fi";
import CartDrawer from "./CartDrawer";

function formatToman(n) {
  const num = Number(n) || 0;
  return `${num.toLocaleString("fa-IR")} تومان`;
}

export default function CartButton() {
  const count = useAppSelector(selectCartCount);
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);

  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);

  const topItems = useMemo(() => items.slice(0, 4), [items]);

  return (
    <>
      <div
        className="relative"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <button
          onClick={() => setOpen(true)}
          className="relative inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-3 text-zinc-100 hover:bg-white/10"
          aria-label="Cart"
          title="سبد خرید"
        >
          <FiShoppingCart className="text-xl" />
          {count > 0 && (
            <span className="absolute -top-2 -left-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-extrabold text-zinc-950">
              {count}
            </span>
          )}
        </button>

        {/* Hover Preview */}
        <AnimatePresence>
          {hover && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="absolute left-0 mt-3 w-[320px] origin-top-left rounded-3xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur"
            >
              <div className="mb-2 text-sm font-extrabold text-white">سبد خرید</div>

              {items.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-300">
                  سبد خرید خالی است.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {topItems.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-white">{it.title}</div>
                          <div className="mt-1 text-[11px] text-zinc-400">
                            {it.qty} × {formatToman(it.price)}
                          </div>
                        </div>
                        <div className="text-sm font-extrabold text-zinc-200">
                          {formatToman(it.price * it.qty)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {items.length > topItems.length && (
                    <div className="mt-2 text-[11px] text-zinc-400">
                      +{items.length - topItems.length} مورد دیگر
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950/40 px-3 py-2">
                    <span className="text-[11px] text-zinc-400">جمع کل</span>
                    <span className="text-sm font-extrabold text-white">{formatToman(total)}</span>
                  </div>

                  <button
                    onClick={() => setOpen(true)}
                    className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
                  >
                    مشاهده سبد و ثبت سفارش
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
