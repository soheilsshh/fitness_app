"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeFromCart,
  selectCartCoach,
  selectCartItems,
  selectCartTotal,
} from "@/store/slices/cartSlice";
import { FiShoppingBag, FiTrash2, FiX } from "react-icons/fi";
import { useIsMobile } from "@/hooks/use-mobile";

function formatToman(n) {
  const num = Number(n) || 0;
  return `${num.toLocaleString("fa-IR")} تومان`;
}

const easeOut = [0.16, 1, 0.3, 1];

export default function CartDrawer({ open, onClose }) {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);
  const coach = useAppSelector(selectCartCoach);
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const panelTransition = reduceMotion
    ? { duration: 0.01 }
    : { type: "spring", damping: 28, stiffness: 320, mass: 0.85 };

  const fadeTransition = reduceMotion
    ? { duration: 0.01 }
    : { duration: 0.22, ease: easeOut };

  const overlayClass = isMobile
    ? "fixed inset-x-0 bottom-0 top-16 z-[110] bg-foreground/35 backdrop-blur-[6px] sm:top-[4.25rem]"
    : "fixed inset-0 z-[110] bg-foreground/35 backdrop-blur-[6px]";

  const panelClass = isMobile
    ? "fixed inset-x-0 top-16 z-[120] flex max-h-[min(calc(100dvh-4rem),620px)] flex-col overflow-hidden rounded-b-[1.75rem] border-b border-border/60 bg-background/95 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:top-[4.25rem] sm:max-h-[min(calc(100dvh-4.25rem),640px)]"
    : "fixed inset-y-0 left-0 z-[120] flex h-dvh w-[min(100%,26rem)] flex-col overflow-hidden border-r border-border/60 bg-background/98 shadow-[24px_0_80px_-24px_rgba(0,0,0,0.45)] backdrop-blur-2xl";

  // Mobile: drop from top. Desktop: slide from the physical left edge.
  const panelMotion = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : isMobile
      ? {
          initial: { y: "-105%", opacity: 0.96 },
          animate: { y: 0, opacity: 1 },
          exit: { y: "-105%", opacity: 0.96 },
        }
      : {
          initial: { x: "-100%", opacity: 0.96 },
          animate: { x: 0, opacity: 1 },
          exit: { x: "-100%", opacity: 0.96 },
        };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={overlayClass}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeTransition}
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            className={panelClass}
            initial={panelMotion.initial}
            animate={panelMotion.animate}
            exit={panelMotion.exit}
            transition={panelTransition}
            role="dialog"
            aria-modal="true"
            aria-label="سبد خرید"
          >
            {isMobile ? (
              <div className="mx-auto flex justify-center pt-2 pb-1" aria-hidden>
                <span className="h-1 w-10 rounded-full bg-border" />
              </div>
            ) : (
              <div className="h-3" aria-hidden />
            )}

            <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-1">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <FiShoppingBag className="text-lg" />
                </span>
                <div className="min-w-0 text-start">
                  <div className="font-iranianSansBlack text-base text-foreground">
                    سبد خرید
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {items.length === 0
                      ? "هنوز موردی اضافه نشده"
                      : `${items.length.toLocaleString("fa-IR")} مورد در سبد`}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-foreground/80 transition-colors duration-200 hover:bg-muted hover:text-foreground"
                aria-label="بستن سبد"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {coach.coachName ? (
              <div className="border-b border-border/50 px-5 py-2.5 text-xs text-muted-foreground">
                مربی:{" "}
                <span className="font-iranianSansDemiBold text-primary">
                  {coach.coachName}
                </span>
              </div>
            ) : null}

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center text-sm text-muted-foreground">
                  سبد خرید خالی است.
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {items.map((it, index) => (
                    <motion.li
                      key={it.id}
                      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : {
                              delay: 0.05 + index * 0.04,
                              duration: 0.28,
                              ease: easeOut,
                            }
                      }
                      className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 text-start">
                          <div className="truncate text-sm font-iranianSansBlack text-foreground">
                            {it.title}
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            اشتراک تمرینی — یک پلن
                          </div>
                          <div className="mt-3 text-sm font-iranianSansDemiBold text-foreground">
                            {formatToman(it.price)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => dispatch(removeFromCart(it.id))}
                          className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border/70 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label="حذف از سبد"
                        >
                          <FiTrash2 className="text-lg" />
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-border/60 bg-background/80 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-border/60 bg-muted/40 px-4 py-3">
                <span className="text-sm text-muted-foreground">قیمت کل</span>
                <span className="text-base font-iranianSansBlack text-foreground">
                  {formatToman(total)}
                </span>
              </div>

              <Link
                href="/payment"
                onClick={onClose}
                className={[
                  "gradient-bg flex min-h-12 w-full items-center justify-center rounded-2xl px-4 py-3 text-center text-sm font-iranianSansBlack text-primary-foreground transition hover:opacity-90",
                  items.length === 0 ? "pointer-events-none opacity-45" : "",
                ].join(" ")}
              >
                ثبت سفارش
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
