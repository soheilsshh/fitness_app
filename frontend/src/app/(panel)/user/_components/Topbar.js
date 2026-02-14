"use client";

import { FiMenu, FiSearch, FiBell } from "react-icons/fi";

export default function Topbar({ onOpenMobile }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/65 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMobile}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-100 hover:bg-white/10 lg:hidden"
            aria-label="Open menu"
          >
            <FiMenu className="text-xl" />
          </button>

          <div className="hidden md:block">
            <div className="text-sm font-extrabold text-white">پنل کاربر</div>
            <div className="text-[11px] text-zinc-400">مدیریت برنامه‌ها و سفارش‌ها</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <FiSearch className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              placeholder="جستجو..."
              className="w-[260px] rounded-2xl border border-white/10 bg-white/5 py-2 pl-3 pr-9 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
            />
          </div>

          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
            aria-label="Notifications"
          >
            <FiBell className="text-xl" />
          </button>

          <div className="h-11 w-11 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-400/15 to-cyan-400/10" />
        </div>
      </div>
    </header>
  );
}
