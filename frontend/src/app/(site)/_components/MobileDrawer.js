"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiLogOut } from "react-icons/fi";

function itemKey(item) {
  return item.href || item.id;
}

const drawerItemClass =
  "w-full rounded-xl px-3 py-3 text-right text-sm font-medium text-on-surface-variant transition hover:bg-[var(--landing-nav-hover)] hover:text-on-surface";

export default function MobileDrawer({ open, onClose, items, onItemClick, session, panelHref, onLogout }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="site-panel fixed right-0 top-0 z-[120] h-full w-[86%] max-w-sm border-l border-outline-variant/25 p-4 backdrop-blur-2xl"
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-on-surface">منو</div>
              <button
                type="button"
                className="site-chip inline-flex items-center justify-center rounded-xl p-2"
                onClick={onClose}
                aria-label="بستن"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="mt-4 space-y-1">
              {items.map((it) =>
                it.type === "link" ? (
                  <Link
                    key={itemKey(it)}
                    href={it.href}
                    onClick={onClose}
                    className={`block ${drawerItemClass}`}
                  >
                    {it.label}
                  </Link>
                ) : (
                  <button
                    key={itemKey(it)}
                    type="button"
                    className={drawerItemClass}
                    onClick={() => onItemClick(it)}
                  >
                    {it.label}
                  </button>
                )
              )}
            </div>

            <div className="mt-6 border-t border-outline-variant/20 pt-4">
              {session?.token ? (
                <>
                  <Link href={panelHref} onClick={onClose} className={`block ${drawerItemClass}`}>
                    {session.name || "پنل من"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout?.();
                    }}
                    className={`mt-2 flex items-center gap-2 px-3 py-3 text-sm site-chip rounded-xl ${drawerItemClass}`}
                  >
                    <FiLogOut />
                    خروج
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={onClose} className={`block ${drawerItemClass}`}>
                    ورود
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={onClose}
                    className={`mt-2 block px-3 py-3 text-center text-sm font-medium site-chip rounded-xl ${drawerItemClass}`}
                  >
                    ثبت‌نام دانشجو
                  </Link>
                  <Link
                    href="/auth/register/coach"
                    onClick={onClose}
                    className="mt-2 block rounded-xl gradient-bg px-3 py-3 text-center text-sm font-extrabold text-on-primary"
                  >
                    ثبت‌نام مربی
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
