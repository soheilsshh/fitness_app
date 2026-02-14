"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiCoffee,
  FiInfo,
} from "react-icons/fi";
import { FaDumbbell } from "react-icons/fa";
import ProgressBar from "./ProgressBar";
import { formatDateFa, shortRemaining } from "./helpers";

const DAYS = [
  { key: "sat", label: "شنبه" },
  { key: "sun", label: "یکشنبه" },
  { key: "mon", label: "دوشنبه" },
  { key: "tue", label: "سه‌شنبه" },
  { key: "wed", label: "چهارشنبه" },
  { key: "thu", label: "پنجشنبه" },
  { key: "fri", label: "جمعه" },
];

// Map JS day (0..6) to our keys. JS: 0 Sunday ... 6 Saturday
function jsDayToKey(jsDay) {
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[jsDay] || "sat";
}

export default function ProgramDetailsPanel({ program, timeline }) {
  const restSet = useMemo(
    () => new Set(program?.schedule?.restDays || []),
    [program?.id],
  );
  const activeSet = useMemo(
    () => new Set(program?.schedule?.weekly || []),
    [program?.id],
  );

  const defaultDay = useMemo(() => {
    if (!program) return "sat";

    const todayKey = jsDayToKey(new Date().getDay());
    if (!restSet.has(todayKey) && program.planByDay?.[todayKey])
      return todayKey;

    const firstSelectable = DAYS.find(
      (d) => !restSet.has(d.key) && program.planByDay?.[d.key],
    );
    return firstSelectable?.key || "sat";
  }, [program?.id, restSet]);

  const [selectedDay, setSelectedDay] = useState(defaultDay);

  // Keep selected day in sync when program changes
  useEffect(() => {
    setSelectedDay(defaultDay);
  }, [defaultDay]);

  // Now it's safe to early-render UI based on program after hooks are called
  if (!program) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
        یک برنامه را انتخاب کنید.
      </div>
    );
  }

  const dayPlan = program.planByDay?.[selectedDay] || {};
  const workout = dayPlan.workout || null;
  const nutrition = dayPlan.nutrition || null;

  const statusText = timeline?.isExpired
    ? "پایان‌یافته"
    : timeline?.isActive
      ? "فعال"
      : "شروع نشده";

  const canSelectDay = (key) => {
    // Disable rest days OR missing plan
    if (restSet.has(key)) return false;
    if (!program.planByDay?.[key]) return false;
    return true;
  };

  return (
    <motion.div
      key={program.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-[26px] border border-white/10 bg-white/5 p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">
            {program.title}
          </div>
          <div className="mt-1 text-sm text-zinc-300">{program.goal}</div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-300">
            <span className="rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1">
              {statusText}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1">
              <FiCalendar />
              شروع: {formatDateFa(program.startDate)}
            </span>

            <span className="rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1">
              مدت: {program.durationDays} روز
            </span>

            <span className="rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1">
              {shortRemaining(timeline.remainingDays)}
            </span>
          </div>
        </div>

        {/* <div className="w-full max-w-xs rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <FiInfo />
              پیشرفت دوره
            </span>
            <span className="text-zinc-200">{timeline.percent}%</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={timeline.percent} />
          </div>
          <div className="mt-3 text-[11px] text-zinc-400">
            {program.coach} • سطح:{" "}
            <span className="text-zinc-200">{program.level}</span>
          </div>
        </div> */}
      </div>

      {/* Day selector */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-extrabold text-white">
            انتخاب روز هفته
          </div>
          <div className="text-[11px] text-zinc-400">
            روزهای استراحت غیرقابل انتخاب هستند
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DAYS.map((d) => {
            const selectable = canSelectDay(d.key);
            const isSelected = selectedDay === d.key;

            return (
              <button
                key={d.key}
                disabled={!selectable}
                onClick={() => setSelectedDay(d.key)}
                className={[
                  "relative rounded-2xl border px-3 py-2 text-xs font-bold transition",
                  selectable
                    ? "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                    : "border-white/5 bg-white/5 text-zinc-500 opacity-50 cursor-not-allowed",
                ].join(" ")}
              >
                {/* Animated pill behind selected */}
                {isSelected && (
                  <motion.div
                    layoutId="dayPill"
                    className="absolute inset-0 rounded-2xl bg-white"
                    transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  />
                )}

                <span
                  className={[
                    "relative z-10",
                    isSelected ? "text-zinc-950" : "",
                  ].join(" ")}
                >
                  {d.label}
                </span>

                {/* Small hint for active/rest */}
                <span
                  className={[
                    "relative z-10 mt-1 block text-[10px]",
                    isSelected
                      ? "text-zinc-700"
                      : selectable
                        ? "text-zinc-400"
                        : "text-zinc-600",
                  ].join(" ")}
                >
                  {restSet.has(d.key)
                    ? "استراحت"
                    : activeSet.has(d.key)
                      ? "فعال"
                      : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day content */}
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {/* Workout */}
        <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <FaDumbbell className="text-emerald-300" />
              برنامه تمرین
            </div>
            <span className="text-[11px] text-zinc-400">
              {DAYS.find((x) => x.key === selectedDay)?.label}
            </span>
          </div>

          {!workout ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
              برای این روز برنامه تمرینی تعریف نشده.
            </div>
          ) : (
            <>
              <div className="mt-2 text-sm text-zinc-200">{workout.title}</div>
              <div className="mt-1 text-[11px] text-zinc-400">
                {workout.durationMin} دقیقه • {workout.calories} کالری
              </div>

              <div className="mt-4 space-y-2">
                {(workout.steps || []).map((s) => (
                  <div
                    key={s}
                    className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200"
                  >
                    <FiCheckCircle className="mt-0.5 text-emerald-300" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Nutrition */}
        <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <FiCoffee className="text-cyan-300" />
              برنامه تغذیه
            </div>
            <span className="text-[11px] text-zinc-400">
              {DAYS.find((x) => x.key === selectedDay)?.label}
            </span>
          </div>

          {!nutrition ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
              برای این روز برنامه غذایی تعریف نشده.
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] text-zinc-400">کالری هدف</div>
                  <div className="mt-1 text-sm font-bold text-white">
                    {nutrition.caloriesTarget} kcal
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] text-zinc-400">پروتئین هدف</div>
                  <div className="mt-1 text-sm font-bold text-white">
                    {nutrition.proteinTarget}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {(nutrition.meals || []).map((m) => (
                  <div
                    key={m.title}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <FiClipboard className="text-zinc-200" />
                      {m.title}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-300">
                      {m.detail}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hint */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950/30 p-5 text-[11px] text-zinc-500">
        نکته: روزهای استراحت قابل انتخاب نیستند.
      </div>
    </motion.div>
  );
}
