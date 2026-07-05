"use client";

import { useMemo, useState } from "react";
import { Award, FileText, GraduationCap, Medal, X, ZoomIn } from "lucide-react";
import { apiAssetUrl } from "@/lib/api/assets";
import { cn } from "@/lib/utils";

const TYPE_ORDER = {
  certificate: 0,
  qualification: 1,
  honor: 2,
  medal: 3,
};

const ACHIEVEMENT_TYPE_META = {
  certificate: {
    label: "گواهینامه",
    icon: FileText,
    badge: "border-sky-400/30 bg-sky-400/10 text-sky-200",
    iconWrap: "bg-sky-400/15 text-sky-300 ring-sky-400/20",
  },
  honor: {
    label: "افتخار",
    icon: Award,
    badge: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    iconWrap: "bg-amber-400/15 text-amber-300 ring-amber-400/20",
  },
  medal: {
    label: "مدال",
    icon: Medal,
    badge: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    iconWrap: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/20",
  },
  qualification: {
    label: "مدرک",
    icon: GraduationCap,
    badge: "border-violet-400/30 bg-violet-400/10 text-violet-200",
    iconWrap: "bg-violet-400/15 text-violet-300 ring-violet-400/20",
  },
};

function getTypeMeta(type) {
  return ACHIEVEMENT_TYPE_META[type] || ACHIEVEMENT_TYPE_META.certificate;
}

function sortAchievements(items) {
  return [...items].sort((a, b) => {
    const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (orderDiff !== 0) return orderDiff;
    const typeDiff =
      (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99);
    if (typeDiff !== 0) return typeDiff;
    return (a.id ?? 0) - (b.id ?? 0);
  });
}

function AchievementCard({ item, onImageClick }) {
  const meta = getTypeMeta(item.type);
  const TypeIcon = meta.icon;
  const imageSrc = item.imageUrl ? apiAssetUrl(item.imageUrl) : "";

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[22px]",
        "border border-white/10 bg-zinc-950/40",
        "shadow-[0_8px_32px_-12px_rgba(0,0,0,0.55)]",
        "transition-all duration-300 hover:border-white/20 hover:bg-zinc-900/50",
      )}
    >
      {imageSrc ? (
        <button
          type="button"
          onClick={() => onImageClick({ src: imageSrc, title: item.title })}
          className="relative block w-full overflow-hidden border-b border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          aria-label={`بزرگ‌نمایی تصویر ${item.title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={item.title}
            loading="lazy"
            className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] md:h-40"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
          <span className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-zinc-950/70 px-2.5 py-1 text-xs font-medium text-zinc-200 ring-1 ring-white/15 backdrop-blur">
            <ZoomIn className="size-3.5" />
            مشاهده تصویر
          </span>
        </button>
      ) : (
        <div className="flex h-28 items-center justify-center border-b border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent md:h-32">
          <span
            className={cn(
              "flex size-14 items-center justify-center rounded-2xl ring-1",
              meta.iconWrap,
            )}
          >
            <TypeIcon className="size-7" aria-hidden="true" />
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5 text-right">
        <div className="flex flex-wrap items-center justify-start gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
              meta.badge,
            )}
          >
            <TypeIcon className="size-3.5" aria-hidden="true" />
            {meta.label}
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="flex items-start justify-start gap-2 text-base font-bold leading-snug text-white md:text-lg">
            <TypeIcon
              className="mt-0.5 size-4 shrink-0 text-emerald-300/90 md:size-5"
              aria-hidden="true"
            />
            <span>{item.title}</span>
          </h3>

          {(item.issuer || item.year) && (
            <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-1 text-sm text-zinc-400">
              {item.issuer ? <span>{item.issuer}</span> : null}
              {item.issuer && item.year ? (
                <span className="text-zinc-600" aria-hidden="true">
                  ·
                </span>
              ) : null}
              {item.year ? (
                <span dir="ltr" className="tabular-nums text-zinc-300">
                  {Number(item.year).toLocaleString("fa-IR")}
                </span>
              ) : null}
            </div>
          )}

          {item.description ? (
            <p className="text-sm leading-7 text-zinc-400">{item.description}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function CoachAchievementsSection({ achievements }) {
  const [lightbox, setLightbox] = useState(null);
  const items = useMemo(
    () => sortAchievements(achievements || []),
    [achievements],
  );

  if (!items.length) return null;

  return (
    <>
      <section
        id="achievements"
        className="mt-10 scroll-mt-20"
        dir="rtl"
        aria-labelledby="achievements-heading"
      >
        <div className="mb-6 flex flex-col gap-2 text-right md:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
            اعتبار و تخصص
          </p>
          <h2
            id="achievements-heading"
            className="text-xl font-extrabold text-white md:text-2xl"
          >
            مدارک و افتخارات
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-zinc-400">
            گواهینامه‌ها، مدارک و افتخارات حرفه‌ای این مربی — برای اطمینان بیشتر
            قبل از انتخاب پلن.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
          {items.map((item) => (
            <AchievementCard
              key={item.id}
              item={item}
              onImageClick={setLightbox}
            />
          ))}
        </div>
      </section>

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 end-4 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label="بستن"
          >
            <X className="size-5" />
          </button>
          <div
            className="relative max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl ring-1 ring-white/15"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.src}
              alt={lightbox.title}
              className="max-h-[85vh] w-full object-contain bg-zinc-900"
            />
            <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950 to-transparent px-4 pb-4 pt-10 text-center text-sm font-medium text-white">
              {lightbox.title}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
