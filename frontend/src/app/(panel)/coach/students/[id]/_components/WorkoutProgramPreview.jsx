"use client";

import { useState } from "react";
import Link from "next/link";
import { FiActivity, FiCheckCircle, FiEdit2 } from "react-icons/fi";
import { DAY_KEYS, DAY_LABELS } from "../../_components/programDays";

export default function WorkoutProgramPreview({ studentId, programs }) {
  const [selectedDay, setSelectedDay] = useState(
    programs?.schedule?.weekly?.[0] || "sat"
  );

  if (!programs?.workoutProgramId) return null;

  const restDays = new Set(programs?.schedule?.restDays || []);
  const steps = programs?.planByDay?.[selectedDay]?.workout?.steps || [];

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10">
            <FiActivity className="text-lg text-emerald-200" />
          </span>
          <div>
            <div className="text-sm font-extrabold text-white">برنامه تمرین اختصاصی</div>
            <div className="mt-0.5 text-[11px] text-zinc-400">برنامه فعال دانشجو</div>
          </div>
        </div>
        <Link
          href={`/coach/students/${studentId}/workout`}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
        >
          <FiEdit2 />
          ویرایش
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {DAY_KEYS.map((key) => {
          const isRest = restDays.has(key);
          const hasSteps = (programs?.planByDay?.[key]?.workout?.steps || []).length > 0;
          if (isRest && !hasSteps) return null;
          return (
            <button
              key={key}
              onClick={() => setSelectedDay(key)}
              className={[
                "rounded-2xl border px-3 py-2 text-xs font-bold transition",
                selectedDay === key
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                  : "border-white/10 bg-zinc-950/30 text-zinc-200 hover:bg-white/10",
                isRest ? "opacity-50" : "",
              ].join(" ")}
            >
              {DAY_LABELS[key]}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        {restDays.has(selectedDay) ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-950/30 p-4 text-sm text-zinc-400">
            روز استراحت
          </div>
        ) : steps.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-950/30 p-4 text-sm text-zinc-400">
            حرکتی برای این روز ثبت نشده
          </div>
        ) : (
          steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 text-sm text-zinc-200"
            >
              <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-300" />
              <span>{step}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
