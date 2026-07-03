"use client";

import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function ImageLightboxModal({
  open,
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}) {
  if (!open) return null;

  const current = photos?.[index];

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // click outside closes
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-white hover:bg-black/60"
        aria-label="Close"
      >
        <FiX className="text-xl" />
      </button>

      <button
        onClick={onPrev}
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2",
          "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-white hover:bg-black/60"
        )}
        aria-label="Previous"
      >
        <FiChevronLeft className="text-xl" />
      </button>

      <button
        onClick={onNext}
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2",
          "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-white hover:bg-black/60"
        )}
        aria-label="Next"
      >
        <FiChevronRight className="text-xl" />
      </button>

      <div className="w-full max-w-5xl">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current?.url}
            alt={current?.name || "photo"}
            className="max-h-[78vh] w-full object-contain"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-zinc-200">
          <div className="truncate">{current?.name || "photo"}</div>
          <div className="text-zinc-400">
            {index + 1}/{photos?.length || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
