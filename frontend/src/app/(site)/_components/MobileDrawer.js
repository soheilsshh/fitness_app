"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";

export default function MobileDrawer({ open, onClose, items, onItemClick }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            className="fixed right-0 top-0 z-50 h-full w-[86%] max-w-sm border-l border-white/10 bg-zinc-950 p-4"
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-zinc-100">منو</div>
              <button
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10"
                onClick={onClose}
                aria-label="بستن"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="mt-4 space-y-1">
              {items.map((it) => (
                <button
                  key={it.id}
                  className="w-full rounded-xl px-3 py-3 text-right text-sm text-zinc-200 hover:bg-white/5"
                  onClick={() => onItemClick(it.id)}
                >
                  {it.label}
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <a
                href="#"
                className="block rounded-xl px-3 py-3 text-sm text-zinc-200 hover:bg-white/5"
              >
                وارد شوید
              </a>
              <a
                href="#"
                className="mt-2 block rounded-xl bg-white px-3 py-3 text-center text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
              >
                ثبت نام کنید
              </a>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
