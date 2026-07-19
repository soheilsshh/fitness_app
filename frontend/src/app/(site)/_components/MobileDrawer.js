"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FiX, FiLogOut, FiUser, FiChevronLeft } from "react-icons/fi";
import { cn } from "@/lib/utils";

function itemKey(item) {
  return item.href || item.id;
}

const easeOut = [0.16, 1, 0.3, 1];

export default function MobileDrawer({
  open,
  onClose,
  items,
  onItemClick,
  session,
  panelHref,
  onLogout,
  pathname,
}) {
  const reduceMotion = useReducedMotion();

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

  const isAuthed = Boolean(session?.token);

  const panelTransition = reduceMotion
    ? { duration: 0.01 }
    : { type: "spring", damping: 28, stiffness: 320, mass: 0.85 };

  const fadeTransition = reduceMotion
    ? { duration: 0.01 }
    : { duration: 0.22, ease: easeOut };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-x-0 bottom-0 top-16 z-[110] bg-foreground/35 backdrop-blur-[6px] sm:top-[4.25rem]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeTransition}
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            id="site-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="منوی فیتینو"
            className="fixed inset-x-0 top-16 z-[120] max-h-[min(calc(100dvh-4rem),560px)] overflow-hidden rounded-b-[1.75rem] border-b border-border/60 bg-background/95 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:top-[4.25rem] sm:max-h-[min(calc(100dvh-4.25rem),580px)]"
            initial={reduceMotion ? { opacity: 0 } : { y: "-105%", opacity: 0.96 }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "-105%", opacity: 0.96 }}
            transition={panelTransition}
          >
            <div className="mx-auto flex justify-center pt-2.5 pb-1" aria-hidden>
              <span className="h-1 w-10 rounded-full bg-border" />
            </div>

            <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-0.5">
              <p className="text-sm font-iranianSansDemiBold text-foreground">منو</p>
              <button
                type="button"
                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-foreground/80 transition-colors duration-200 hover:bg-muted hover:text-foreground"
                onClick={onClose}
                aria-label="بستن منو"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <nav
              className="max-h-[min(52dvh,420px)] overflow-y-auto overscroll-contain px-3 pb-2"
              aria-label="منوی موبایل"
            >
              <ul className="space-y-1">
                {items.map((it, index) => {
                  const active = it.type === "link" && it.href === pathname;
                  const className = cn(
                    "flex min-h-12 w-full cursor-pointer items-center justify-between rounded-2xl px-4 py-3.5 text-right text-[15px] transition-colors duration-200",
                    active
                      ? "bg-primary/12 font-iranianSansDemiBold text-primary"
                      : "font-iranianSansMedium text-foreground hover:bg-muted/80"
                  );

                  const motionProps = reduceMotion
                    ? {}
                    : {
                        initial: { opacity: 0, y: -10 },
                        animate: { opacity: 1, y: 0 },
                        transition: {
                          delay: 0.04 + index * 0.04,
                          duration: 0.28,
                          ease: easeOut,
                        },
                      };

                  if (it.type === "link") {
                    return (
                      <motion.li key={itemKey(it)} {...motionProps}>
                        <Link href={it.href} onClick={onClose} className={className}>
                          <span>{it.label}</span>
                          <FiChevronLeft className="text-muted-foreground" />
                        </Link>
                      </motion.li>
                    );
                  }

                  return (
                    <motion.li key={itemKey(it)} {...motionProps}>
                      <button
                        type="button"
                        className={className}
                        onClick={() => onItemClick(it)}
                      >
                        <span>{it.label}</span>
                        <FiChevronLeft className="text-muted-foreground" />
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            </nav>

            <div className="space-y-2 border-t border-border/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {isAuthed ? (
                <>
                  <Link
                    href={panelHref}
                    onClick={onClose}
                    className="flex min-h-12 items-center gap-3 rounded-2xl bg-muted/70 px-3.5 py-3 text-sm font-iranianSansDemiBold text-foreground transition-colors hover:bg-muted"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background text-primary shadow-sm ring-1 ring-border/60">
                      <FiUser className="text-lg" />
                    </span>
                    <span className="min-w-0 truncate">
                      {session.name || "پنل من"}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout?.();
                    }}
                    className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border px-3.5 py-3 text-sm font-iranianSansMedium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <FiLogOut />
                    خروج از حساب
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth"
                    onClick={onClose}
                    className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-border px-3.5 py-3 text-sm font-iranianSansDemiBold text-foreground transition-colors hover:bg-muted"
                  >
                    ورود / ثبت‌نام
                  </Link>
                  <Link
                    href="/auth/register/coach"
                    onClick={onClose}
                    className="gradient-bg flex min-h-12 w-full items-center justify-center rounded-2xl px-3.5 py-3 text-sm font-iranianSansBlack text-primary-foreground shadow-sm transition hover:opacity-90"
                  >
                    ثبت‌نام به‌عنوان مربی
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
