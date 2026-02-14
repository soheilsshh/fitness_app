"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function Pagination({ page, totalPages, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs text-zinc-400">
        صفحه <span className="font-bold text-white">{page}</span> از{" "}
        <span className="font-bold text-white">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10",
            page <= 1 ? "pointer-events-none opacity-50" : ""
          )}
        >
          <FiChevronRight />
          قبلی
        </button>

        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10",
            page >= totalPages ? "pointer-events-none opacity-50" : ""
          )}
        >
          بعدی
          <FiChevronLeft />
        </button>
      </div>
    </div>
  );
}
