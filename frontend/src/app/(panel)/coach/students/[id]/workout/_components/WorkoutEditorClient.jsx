"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiChevronLeft, FiDatabase, FiPlus, FiSave, FiX } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import { toastError } from "@/app/(site)/auth/_components/helpers";
import { DAY_KEYS, DAY_LABELS, emptyPlanByDay } from "../../../_components/programDays";
import ExercisePickerModal from "./ExercisePickerModal";

export default function WorkoutEditorClient({ studentId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [programId, setProgramId] = useState(null);
  const [title, setTitle] = useState("برنامه تمرین");
  const [selectedDay, setSelectedDay] = useState("sat");
  const [restDays, setRestDays] = useState([]);
  const [planByDay, setPlanByDay] = useState(emptyPlanByDay());
  const [stepInput, setStepInput] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/coach/students/${studentId}/programs`);
        if (cancelled) return;
        const data = res.data || {};
        setProgramId(data.workoutProgramId || null);
        if (data.schedule?.restDays) setRestDays(data.schedule.restDays);
        if (data.planByDay) {
          const merged = emptyPlanByDay();
          for (const key of DAY_KEYS) {
            if (data.planByDay[key]?.workout) {
              merged[key].workout = {
                title: data.planByDay[key].workout.title || "",
                steps: data.planByDay[key].workout.steps || [],
              };
            }
          }
          setPlanByDay(merged);
        }
      } catch {
        if (!cancelled) toastError("خطا", "بارگذاری برنامه ناموفق بود");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [studentId]);

  const toggleRest = (key) => {
    setRestDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const addStep = () => {
    const step = stepInput.trim();
    if (!step) return;
    setPlanByDay((prev) => {
      const next = { ...prev };
      const day = { ...next[selectedDay] };
      const workout = { ...(day.workout || { steps: [] }) };
      workout.steps = [...(workout.steps || []), step];
      day.workout = workout;
      next[selectedDay] = day;
      return next;
    });
    setStepInput("");
  };

  const removeStep = (index) => {
    setPlanByDay((prev) => {
      const next = { ...prev };
      const day = { ...next[selectedDay] };
      const workout = { ...(day.workout || { steps: [] }) };
      workout.steps = workout.steps.filter((_, i) => i !== index);
      day.workout = workout;
      next[selectedDay] = day;
      return next;
    });
  };

  const weekly = DAY_KEYS.filter((k) => !restDays.includes(k));

  const handleSave = async () => {
    setSaving(true);
    try {
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
    } catch (error) {
      toastError("خطا", error?.response?.data?.error || "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  const steps = planByDay[selectedDay]?.workout?.steps || [];

  if (loading) {
    return <div className="text-sm text-zinc-400">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/coach/students/${studentId}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
        >
          <FiChevronLeft />
          بازگشت
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
        >
          <FiSave />
          {saving ? "در حال ذخیره..." : "ذخیره برنامه"}
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
        {DAY_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setSelectedDay(key)}
            className={[
              "rounded-2xl border px-3 py-2 text-sm font-bold",
              selectedDay === key
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                : "border-white/10 bg-zinc-950/30 text-zinc-200",
              restDays.includes(key) ? "opacity-50" : "",
            ].join(" ")}
          >
            {DAY_LABELS[key]}
          </button>
        ))}
      </div>

      <button
        onClick={() => toggleRest(selectedDay)}
        className="text-sm text-zinc-400 hover:text-white"
      >
        {restDays.includes(selectedDay) ? "حذف از روز استراحت" : "علامت‌گذاری به عنوان روز استراحت"}
      </button>

      {!restDays.includes(selectedDay) ? (
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 space-y-3">
          <div className="text-sm font-extrabold text-white">
            حرکات {DAY_LABELS[selectedDay]}
          </div>
          <button
            onClick={() => setPickerOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-extrabold text-emerald-100 hover:bg-emerald-400/15"
          >
            <FiDatabase />
            انتخاب از دیتاست حرکات
          </button>
          <div className="flex gap-2">
            <input
              value={stepInput}
              onChange={(e) => setStepInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addStep())}
              placeholder="یا دستی وارد کنید: پرس سینه — ۴ ست — ۱۰ تکرار"
              className="flex-1 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/40"
            />
            <button
              onClick={addStep}
              className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100"
            >
              <FiPlus />
              افزودن
            </button>
          </div>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2 text-sm text-zinc-200">
                <span>{step}</span>
                <button onClick={() => removeStep(i)} className="text-zinc-400 hover:text-rose-300">
                  <FiX />
                </button>
              </div>
            ))}
            {steps.length === 0 ? (
              <div className="text-sm text-zinc-500">حرکتی ثبت نشده</div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 text-sm text-zinc-400">
          روز استراحت
        </div>
      )}

      <ExercisePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(step) => {
          setPlanByDay((prev) => {
            const next = { ...prev };
            const day = { ...next[selectedDay] };
            const workout = { ...(day.workout || { steps: [] }) };
            workout.steps = [...(workout.steps || []), step];
            day.workout = workout;
            next[selectedDay] = day;
            return next;
          });
        }}
      />
    </div>
  );
}
