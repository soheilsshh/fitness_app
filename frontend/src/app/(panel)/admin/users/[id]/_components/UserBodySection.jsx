"use client";

import { useMemo, useState } from "react";
import { FiCamera, FiInfo } from "react-icons/fi";
import ImageLightboxModal from "./ImageLightboxModal";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function UserBodySection({ heightCm, weightKg, photos = [] }) {
  const safePhotos = useMemo(() => (Array.isArray(photos) ? photos.slice(0, 5) : []), [photos]);

  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const openAt = (i) => {
    setIdx(i);
    setOpen(true);
  };

  const onPrev = () => setIdx((p) => (p - 1 + safePhotos.length) % safePhotos.length);
  const onNext = () => setIdx((p) => (p + 1) % safePhotos.length);

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-base font-extrabold text-white">اطلاعات بدنی</div>
          <div className="mt-1 text-sm text-zinc-300">
            قد، وزن و تصاویر آپلود شده (حداکثر ۵ عکس)
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-3 py-2 text-xs text-zinc-200">
          <FiInfo />
          تصاویر: {safePhotos.length}/5
        </div>
      </div>

      {/* Height / Weight */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
          <div className="text-[11px] text-zinc-400">قد</div>
          <div className="mt-1 text-lg font-extrabold text-white">
            {heightCm ? `${heightCm} cm` : "—"}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
          <div className="text-[11px] text-zinc-400">وزن</div>
          <div className="mt-1 text-lg font-extrabold text-white">
            {weightKg ? `${weightKg} kg` : "—"}
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="mt-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-white">
          <FiCamera />
          تصاویر کاربر
        </div>

        {safePhotos.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4 text-sm text-zinc-300">
            هنوز تصویری آپلود نشده.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {safePhotos.map((p, i) => (
              <button
                key={p.id || p.url}
                onClick={() => openAt(i)}
                className={cn(
                  "group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5",
                  "focus:outline-none focus:ring-2 focus:ring-white/20"
                )}
                aria-label={`Open photo ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.name || "photo"}
                  className="h-28 w-full object-cover transition group-hover:scale-[1.03] sm:h-36"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <div className="truncate text-[11px] text-zinc-200">{p.name || "photo"}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <ImageLightboxModal
        open={open}
        photos={safePhotos}
        index={idx}
        onClose={() => setOpen(false)}
        onPrev={onPrev}
        onNext={onNext}
      />
    </div>
  );
}
