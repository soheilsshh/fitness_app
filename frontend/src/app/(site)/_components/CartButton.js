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
          className="site-chip relative inline-flex items-center justify-center rounded-2xl p-3"
          aria-label="Cart"
          title="سبد خرید"
        >
          <FiShoppingCart className="text-xl" />
          {count > 0 && (
            <span className="absolute -top-2 -left-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-tint px-1 text-[11px] font-extrabold text-on-primary">
              {count}
            </span>
          )}
        </button>

        <AnimatePresence>
          {hover && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="site-panel absolute left-0 mt-3 w-[320px] origin-top-left rounded-3xl p-4 shadow-2xl backdrop-blur"
            >
              <div className="mb-2 text-sm font-extrabold text-on-surface">سبد خرید</div>

              {items.length === 0 ? (
                <div className="site-chip rounded-2xl p-3 text-sm site-muted">
                  سبد خرید خالی است.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {topItems.map((it) => (
                      <div
                        key={it.id}
                        className="site-chip flex items-center justify-between gap-3 rounded-2xl px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-on-surface">{it.title}</div>
                          <div className="mt-1 text-[11px] site-muted">
                            {formatToman(it.price)}
                          </div>
                        </div>
                        <div className="text-sm font-extrabold text-on-surface">
                          {formatToman(it.price)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {items.length > topItems.length && (
                    <div className="mt-2 text-[11px] site-muted">
                      +{items.length - topItems.length} مورد دیگر
                    </div>
                  )}

                  <div className="site-chip mt-3 flex items-center justify-between rounded-2xl px-3 py-2">
                    <span className="text-[11px] site-muted">جمع کل</span>
                    <span className="text-sm font-extrabold text-on-surface">{formatToman(total)}</span>
                  </div>

                  <button
                    onClick={() => setOpen(true)}
                    className="mt-3 w-full rounded-2xl gradient-bg px-4 py-3 text-sm font-extrabold text-on-primary hover:opacity-90"
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
