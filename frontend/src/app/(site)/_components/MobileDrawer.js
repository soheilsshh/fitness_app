"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiLogOut, FiUser, FiChevronLeft } from "react-icons/fi";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

function itemKey(item) {
  return item.href || item.id;
}

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

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[110] bg-foreground/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            id="site-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="منوی فیتینو"
            className="fixed inset-y-0 start-0 z-[120] flex h-full w-[min(100%,22rem)] flex-col border-e border-border bg-background shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
              <Link
                href="/"
                onClick={onClose}
                className="flex min-w-0 items-center gap-2.5"
              >
                <Logo className="h-9 w-9 object-contain" />
                <span className="font-iranianSansBlack text-lg text-foreground">
                  فیتینو
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <ThemeToggle buttonClassName="h-11 w-11 rounded-full border-0 bg-transparent shadow-none hover:bg-muted" />
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                  onClick={onClose}
                  aria-label="بستن منو"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="منوی موبایل">
              <ul className="space-y-1">
                {items.map((it) => {
                  const active =
                    it.type === "link" && it.href === pathname;
                  const className = cn(
                    "flex w-full items-center justify-between rounded-2xl px-3.5 py-3.5 text-right text-[15px] transition-colors",
                    active
                      ? "bg-primary/10 font-iranianSansDemiBold text-primary"
                      : "font-iranianSansMedium text-foreground hover:bg-muted"
                  );

                  if (it.type === "link") {
                    return (
                      <li key={itemKey(it)}>
                        <Link
                          href={it.href}
                          onClick={onClose}
                          className={className}
                        >
                          <span>{it.label}</span>
                          <FiChevronLeft className="text-muted-foreground" />
                        </Link>
                      </li>
                    );
                  }

                  return (
                    <li key={itemKey(it)}>
                      <button
                        type="button"
                        className={className}
                        onClick={() => onItemClick(it)}
                      >
                        <span>{it.label}</span>
                        <FiChevronLeft className="text-muted-foreground" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="space-y-2 border-t border-border p-4">
              {isAuthed ? (
                <>
                  <Link
                    href={panelHref}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-2xl bg-muted/70 px-3.5 py-3.5 text-sm font-iranianSansDemiBold text-foreground transition-colors hover:bg-muted"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background text-primary shadow-sm">
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
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-3.5 py-3.5 text-sm font-iranianSansMedium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                    className="flex w-full items-center justify-center rounded-2xl border border-border px-3.5 py-3.5 text-sm font-iranianSansDemiBold text-foreground transition-colors hover:bg-muted"
                  >
                    ورود / ثبت‌نام
                  </Link>
                  <Link
                    href="/auth/register/coach"
                    onClick={onClose}
                    className="gradient-bg flex w-full items-center justify-center rounded-2xl px-3.5 py-3.5 text-sm font-iranianSansBlack text-primary-foreground shadow-sm transition hover:opacity-90"
                  >
                    ثبت‌نام به‌عنوان مربی
                  </Link>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
