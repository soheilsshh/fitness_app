"use client";

import { FiChevronRight, FiChevronLeft } from "react-icons/fi";

export default function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  // Build a small page window
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-sm text-zinc-300">
        صفحه <span className="text-white font-bold">{page}</span> از{" "}
        <span className="text-white font-bold">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={!canPrev}
          onClick={() => onPage(page - 1)}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-3 py-2 text-sm text-white disabled:opacity-40"
        >
          <FiChevronRight />
          قبلی
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={[
                "h-9 w-9 rounded-2xl border text-sm font-bold transition",
                p === page
                  ? "border-white/0 bg-white text-zinc-950"
                  : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
              ].join(" ")}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          disabled={!canNext}
          onClick={() => onPage(page + 1)}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-3 py-2 text-sm text-white disabled:opacity-40"
        >
          بعدی
          <FiChevronLeft />
        </button>
      </div>
    </div>
  );
}
