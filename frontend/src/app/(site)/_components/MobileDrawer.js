"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiLogOut } from "react-icons/fi";

function itemKey(item) {
  return item.href || item.id;
}

export default function MobileDrawer({ open, onClose, items, onItemClick, session, panelHref, onLogout }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-[120] h-full w-[86%] max-w-sm border-l border-white/15 bg-zinc-950/80 p-4 backdrop-blur-2xl"
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-white">منو</div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10"
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
                    className="block w-full rounded-xl px-3 py-3 text-right text-sm font-medium text-zinc-200 hover:bg-white/8"
                  >
                    {it.label}
                  </Link>
                ) : (
                  <button
                    key={itemKey(it)}
                    type="button"
                    className="w-full rounded-xl px-3 py-3 text-right text-sm font-medium text-zinc-200 hover:bg-white/8"
                    onClick={() => onItemClick(it)}
                  >
                    {it.label}
                  </button>
                )
              )}
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              {session?.token ? (
                <>
                  <Link
                    href={panelHref}
                    onClick={onClose}
                    className="block rounded-xl px-3 py-3 text-sm text-zinc-200 hover:bg-white/8"
                  >
                    {session.name || "پنل من"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout?.();
                    }}
                    className="mt-2 flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-zinc-200 hover:bg-white/10"
                  >
                    <FiLogOut />
                    خروج
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={onClose}
                    className="block rounded-xl px-3 py-3 text-sm text-zinc-200 hover:bg-white/8"
                  >
                    ورود
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={onClose}
                    className="mt-2 block rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-sm font-medium text-zinc-100 hover:bg-white/10"
                  >
                    ثبت‌نام دانشجو
                  </Link>
                  <Link
                    href="/auth/register/coach"
                    onClick={onClose}
                    className="mt-2 block rounded-xl bg-gradient-to-l from-emerald-400 to-cyan-400 px-3 py-3 text-center text-sm font-extrabold text-zinc-950"
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
