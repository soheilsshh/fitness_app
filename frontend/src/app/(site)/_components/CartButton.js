"use client";

import { useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import {
  selectCartCount,
  selectCartItems,
  selectCartTotal,
} from "@/store/slices/cartSlice";
import { AnimatePresence, motion } from "framer-motion";
import { FiShoppingCart } from "react-icons/fi";
import CartDrawer from "./CartDrawer";

function formatToman(n) {
  const num = Number(n) || 0;
  return `${num.toLocaleString("fa-IR")} تومان`;
}

export default function CartButton({ open: openProp, onOpenChange } = {}) {
  const count = useAppSelector(selectCartCount);
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const controlled = typeof openProp === "boolean";
  const open = controlled ? openProp : uncontrolledOpen;
  const setOpen = (next) => {
    if (!controlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
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
          type="button"
          onClick={() => setOpen(!open)}
          className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            open
              ? "bg-muted text-foreground"
              : "text-foreground/80 hover:bg-muted hover:text-foreground"
          }`}
          aria-label={open ? "بستن سبد خرید" : "سبد خرید"}
          aria-expanded={open}
          title="سبد خرید"
        >
          <FiShoppingCart className="text-xl" />
          {count > 0 && (
            <span className="absolute -top-0.5 -start-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-iranianSansBlack text-primary-foreground">
              {count.toLocaleString("fa-IR")}
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
              className="absolute end-0 mt-3 hidden w-[320px] origin-top rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-xl md:block"
            >
              <div className="mb-2 text-sm font-iranianSansBlack">سبد خرید</div>

              {items.length === 0 ? (
                <div className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                  سبد خرید خالی است.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {topItems.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-iranianSansDemiBold">
                            {it.title}
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {formatToman(it.price)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {items.length > topItems.length && (
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      +{(items.length - topItems.length).toLocaleString("fa-IR")} مورد دیگر
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                    <span className="text-[11px] text-muted-foreground">جمع کل</span>
                    <span className="text-sm font-iranianSansBlack">
                      {formatToman(total)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="gradient-bg mt-3 w-full rounded-xl px-4 py-3 text-sm font-iranianSansBlack text-primary-foreground transition hover:opacity-90"
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
