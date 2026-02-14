"use client";

import { FiClock, FiActivity, FiChevronLeft, FiTag } from "react-icons/fi";
import ProgressBar from "./ProgressBar";

export default function ProgramCard({
  program,
  timeline,
  selected,
  onSelect,
}) {
  const statusText = timeline.isExpired
    ? "پایان‌یافته"
    : timeline.isActive
    ? "فعال"
    : "شروع نشده";

  const statusClass = timeline.isExpired
    ? "border-white/10 bg-white/5 text-zinc-200"
    : timeline.isActive
    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
    : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100";

  return (
    <button
      onClick={onSelect}
      className={[
        "group h-full w-full text-right",
        "rounded-[26px] border border-white/10 bg-white/5 p-5 transition",
        "hover:bg-white/10",
        selected ? "ring-1 ring-emerald-400/30" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={["rounded-full border px-3 py-1 text-[11px]", statusClass].join(" ")}>
              {statusText}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1 text-[11px] text-zinc-200">
              <FiClock />
              {timeline.remainingDays <= 0 ? "اتمام" : `${timeline.remainingDays} روز`}
            </span>
          </div>

          <div className="mt-3 truncate text-base font-extrabold text-white">
            {program.title}
          </div>

          <div className="mt-1 text-sm text-zinc-300">{program.goal}</div>
        </div>

        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/30 text-zinc-100 group-hover:bg-zinc-900/40">
          <FiChevronLeft className="text-xl" />
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <FiActivity />
            پیشرفت
          </span>
          <span className="text-zinc-200">{timeline.percent}%</span>
        </div>
        <div className="mt-2">
          <ProgressBar value={timeline.percent} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-300">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/30 p-3">
          <div className="text-[11px] text-zinc-400">تمرین امروز</div>
          <div className="mt-1 line-clamp-1 font-bold text-white">
            {program.today.workout.title}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            {program.today.workout.durationMin} دقیقه • {program.today.workout.calories} کالری
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950/30 p-3">
          <div className="text-[11px] text-zinc-400">هدف تغذیه</div>
          <div className="mt-1 font-bold text-white">
            {program.today.nutrition.caloriesTarget} kcal
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            پروتئین: {program.today.nutrition.proteinTarget}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {program.tags.slice(0, 3).map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-zinc-200"
          >
            <FiTag />
            {t}
          </span>
        ))}
      </div>
    </button>
  );
}
