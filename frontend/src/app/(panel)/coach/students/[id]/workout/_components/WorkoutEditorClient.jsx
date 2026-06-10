"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiChevronLeft, FiPlus, FiSave, FiTrash2, FiX } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { DAY_KEYS, DAY_LABELS } from "../../../_components/programDays";
import {
  dayExercisesToPlanByDay,
  emptyDayExercises,
  formatExerciseEntry,
  planByDayToDayExercises,
} from "../../../_components/exerciseHelpers";
import ExercisePickerModal from "./ExercisePickerModal";
import ManualExerciseModal from "./ManualExerciseModal";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function WorkoutEditorClient({ studentId, embedded = false, onSaved }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [programId, setProgramId] = useState(null);
  const [title, setTitle] = useState("برنامه تمرین");
  const [selectedDay, setSelectedDay] = useState("sat");
  const [restDays, setRestDays] = useState([]);
  const [dayExercises, setDayExercises] = useState(emptyDayExercises());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/coach/students/${studentId}/programs`);
        if (cancelled) return;
        const data = res.data || {};
        setProgramId(data.workoutProgramId || null);
        if (data.workoutProgramId && data.schedule?.restDays) {
          setRestDays(data.schedule.restDays);
        } else {
          setRestDays([]);
        }
        if (data.planByDay) {
          setDayExercises(planByDayToDayExercises(data.planByDay));
        }
      } catch {
        // برنامه جدید
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [studentId]);

  const isRestDay = restDays.includes(selectedDay);
  const currentExercises = dayExercises[selectedDay] || [];

  const addExercise = (entry) => {
    setDayExercises((prev) => ({
      ...prev,
      [selectedDay]: [
        ...(prev[selectedDay] || []),
        { uid: uid(), ...entry },
      ],
    }));
    if (restDays.includes(selectedDay)) {
      setRestDays((prev) => prev.filter((d) => d !== selectedDay));
    }
  };

  const removeExercise = (exerciseUid) => {
    setDayExercises((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).filter((e) => e.uid !== exerciseUid),
    }));
  };

  const updateExercise = (exerciseUid, field, value) => {
    setDayExercises((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map((e) =>
        e.uid === exerciseUid ? { ...e, [field]: value } : e
      ),
    }));
  };

  const toggleRestDay = () => {
    if (isRestDay) {
      setRestDays((prev) => prev.filter((d) => d !== selectedDay));
    } else {
      setRestDays((prev) => [...prev, selectedDay]);
      setDayExercises((prev) => ({ ...prev, [selectedDay]: [] }));
    }
  };

  const hasAnyExercise = DAY_KEYS.some(
    (k) => (dayExercises[k] || []).length > 0
  );

  const weekly = DAY_KEYS.filter((k) => !restDays.includes(k));

  const handleSave = async () => {
    if (!hasAnyExercise) {
      toastError("خطا", "حداقل یک حرکت به برنامه اضافه کنید.");
      return;
    }
    setSaving(true);
    try {
      const planByDay = dayExercisesToPlanByDay(dayExercises);
      const payload = {
        title,
        durationWeeks: 4,
        schedule: { weekly, restDays },
        planByDay,
      };
      if (programId) {
        await api.patch(`/coach/students/${studentId}/workout-programs/${programId}`, payload);
      } else {
        const res = await api.post(`/coach/students/${studentId}/workout-programs`, payload);
        setProgramId(res.data?.workoutProgramId || null);
      }
      await toastSuccess("موفق", "برنامه تمرین با موفقیت برای دانشجو ارسال شد.");
      onSaved?.();
      if (embedded) router.refresh();
    } catch (error) {
      toastError("خطا", error?.response?.data?.error || "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-zinc-400">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!embedded ? (
          <Link
            href={`/coach/students/${studentId}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
          >
            <FiChevronLeft />
            بازگشت
          </Link>
        ) : (
          <div className="text-sm font-extrabold text-white">ساخت برنامه تمرین</div>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
        >
          <FiSave />
          {saving ? "در حال ارسال..." : "ارسال برنامه به دانشجو"}
        </button>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
        <label className="text-sm text-zinc-400">عنوان برنامه</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/40"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {DAY_KEYS.map((key) => {
          const count = (dayExercises[key] || []).length;
          const isRest = restDays.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDay(key)}
              className={[
                "relative rounded-2xl border px-4 py-2.5 text-sm font-bold transition",
                selectedDay === key
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                  : "border-white/10 bg-zinc-950/30 text-zinc-200 hover:bg-white/10",
                isRest ? "opacity-60" : "",
              ].join(" ")}
            >
              {DAY_LABELS[key]}
              {count > 0 ? (
                <span className="mr-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400/20 px-1 text-[10px] text-emerald-200">
                  {count}
                </span>
              ) : null}
              {isRest ? (
                <span className="mt-0.5 block text-[9px] font-normal text-zinc-500">استراحت</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-base font-extrabold text-white">
            برنامه {DAY_LABELS[selectedDay]}
          </div>
          <button
            type="button"
            onClick={toggleRestDay}
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            {isRestDay ? "لغو روز استراحت" : "علامت‌گذاری به‌عنوان روز استراحت"}
          </button>
        </div>

        {isRestDay ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/30 p-6 text-center text-sm text-zinc-400">
            این روز به‌عنوان روز استراحت تنظیم شده است.
            <button
              type="button"
              onClick={toggleRestDay}
              className="mt-2 block w-full text-emerald-300 hover:text-emerald-200"
            >
              فعال‌سازی و افزودن حرکت
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3.5 text-sm font-extrabold text-emerald-100 hover:bg-emerald-400/15"
            >
              <FiPlus className="text-lg" />
              اضافه کردن حرکت
            </button>

            {currentExercises.length > 0 ? (
              <div className="space-y-3">
                {currentExercises.map((ex, index) => (
                  <div
                    key={ex.uid}
                    className="flex gap-3 rounded-2xl border border-white/10 bg-zinc-950/40 p-3"
                  >
                    {ex.imageUrl ? (
                      <img
                        src={mediaUrl(ex.imageUrl)}
                        alt={ex.name}
                        className="h-16 w-16 shrink-0 rounded-xl object-cover"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-[10px] text-zinc-600">
                        {index + 1}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="text-sm font-bold text-white">{ex.name}</div>
                      <div className="flex flex-wrap gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-zinc-400">
                          ست
                          <input
                            type="number"
                            min="1"
                            value={ex.sets}
                            onChange={(e) => updateExercise(ex.uid, "sets", e.target.value)}
                            className="w-14 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none"
                          />
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-zinc-400">
                          تکرار
                          <input
                            value={ex.reps}
                            onChange={(e) => updateExercise(ex.uid, "reps", e.target.value)}
                            placeholder="۱۲"
                            className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none"
                          />
                        </label>
                        <span className="self-center text-[11px] text-zinc-500">
                          {formatExerciseEntry(ex)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExercise(ex.uid)}
                      className="self-start rounded-xl p-2 text-zinc-500 hover:bg-rose-400/10 hover:text-rose-300"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/20 p-5 text-center text-sm text-zinc-500">
                هنوز حرکتی برای {DAY_LABELS[selectedDay]} اضافه نشده
              </div>
            )}

            <button
              type="button"
              onClick={() => setManualOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm font-bold text-zinc-200 hover:bg-white/10"
            >
              <FiPlus />
              افزودن حرکت دستی (جدید)
            </button>
          </>
        )}
      </div>

      <ExercisePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        dayLabel={DAY_LABELS[selectedDay]}
        onAdd={(entry) => addExercise(entry)}
      />

      <ManualExerciseModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        dayLabel={DAY_LABELS[selectedDay]}
        onAdd={(entry) => addExercise(entry)}
      />
    </div>
  );
}
