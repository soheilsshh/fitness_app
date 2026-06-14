"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiChevronLeft, FiPlus, FiSave, FiX } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import { toastError } from "@/app/(site)/auth/_components/helpers";
import { DAY_KEYS, DAY_LABELS, emptyPlanByDay } from "../../../_components/programDays";

function applyCaloriesToPlan(planByDay, calories) {
  const value = Math.round(Number(calories));
  if (!value) return planByDay;
  const next = { ...planByDay };
  for (const key of DAY_KEYS) {
    const day = { ...next[key] };
    day.nutrition = {
      ...(day.nutrition || { meals: [] }),
      caloriesTarget: value,
    };
    next[key] = day;
  }
  return next;
}

export default function NutritionEditorClient({ studentId }) {
  const searchParams = useSearchParams();
  const caloriesFromQuery = searchParams.get("calories");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [programId, setProgramId] = useState(null);
  const [title, setTitle] = useState("برنامه غذایی");
  const [selectedDay, setSelectedDay] = useState("sat");
  const [planByDay, setPlanByDay] = useState(emptyPlanByDay());
  const [mealTitle, setMealTitle] = useState("");
  const [mealDetail, setMealDetail] = useState("");
  const [caloriesTarget, setCaloriesTarget] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/coach/students/${studentId}/programs`);
        if (cancelled) return;
        const data = res.data || {};
        setProgramId(data.nutritionProgramId || null);
        if (data.planByDay) {
          const merged = emptyPlanByDay();
          for (const key of DAY_KEYS) {
            if (data.planByDay[key]?.nutrition) {
              merged[key].nutrition = { ...data.planByDay[key].nutrition };
            }
          }
          setPlanByDay(
            caloriesFromQuery ? applyCaloriesToPlan(merged, caloriesFromQuery) : merged,
          );
        } else if (caloriesFromQuery) {
          setPlanByDay((prev) => applyCaloriesToPlan(prev, caloriesFromQuery));
        }
      } catch {
        if (!cancelled) toastError("خطا", "بارگذاری برنامه ناموفق بود");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [studentId, caloriesFromQuery]);

  useEffect(() => {
    const n = planByDay[selectedDay]?.nutrition;
    setCaloriesTarget(n?.caloriesTarget ? String(n.caloriesTarget) : "");
    setProteinTarget(n?.proteinTarget || "");
  }, [selectedDay, planByDay]);

  const updateDayNutrition = (updater) => {
    setPlanByDay((prev) => {
      const next = { ...prev };
      const day = { ...next[selectedDay] };
      day.nutrition = updater(day.nutrition || { meals: [] });
      next[selectedDay] = day;
      return next;
    });
  };

  const addMeal = () => {
    const t = mealTitle.trim();
    if (!t) return;
    updateDayNutrition((n) => ({
      ...n,
      meals: [...(n.meals || []), { title: t, detail: mealDetail.trim() }],
    }));
    setMealTitle("");
    setMealDetail("");
  };

  const removeMeal = (index) => {
    updateDayNutrition((n) => ({
      ...n,
      meals: (n.meals || []).filter((_, i) => i !== index),
    }));
  };

  const saveTargets = () => {
    updateDayNutrition((n) => ({
      ...n,
      caloriesTarget: Number(caloriesTarget) || 0,
      proteinTarget: proteinTarget.trim(),
    }));
  };

  const handleSave = async () => {
    saveTargets();
    setSaving(true);
    try {
      const payload = {
        title,
        durationWeeks: 4,
        planByDay,
      };
      if (programId) {
        await api.patch(`/coach/students/${studentId}/nutrition-programs/${programId}`, payload);
      } else {
        const res = await api.post(`/coach/students/${studentId}/nutrition-programs`, payload);
        setProgramId(res.data?.nutritionProgramId || null);
      }
    } catch (error) {
      toastError("خطا", error?.response?.data?.error || "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  const meals = planByDay[selectedDay]?.nutrition?.meals || [];

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
          className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/40"
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
                ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                : "border-white/10 bg-zinc-950/30 text-zinc-200",
            ].join(" ")}
          >
            {DAY_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={caloriesTarget}
          onChange={(e) => setCaloriesTarget(e.target.value)}
          placeholder="هدف کالری روزانه"
          className="rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 text-sm text-white outline-none"
        />
        <input
          value={proteinTarget}
          onChange={(e) => setProteinTarget(e.target.value)}
          placeholder="هدف پروتئین (مثلاً ۱۸۰g)"
          className="rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 text-sm text-white outline-none"
        />
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 space-y-3">
        <div className="text-sm font-extrabold text-white">وعده‌های {DAY_LABELS[selectedDay]}</div>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            value={mealTitle}
            onChange={(e) => setMealTitle(e.target.value)}
            placeholder="نام وعده (صبحانه)"
            className="rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 text-sm text-white outline-none"
          />
          <input
            value={mealDetail}
            onChange={(e) => setMealDetail(e.target.value)}
            placeholder="جزئیات"
            className="rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 text-sm text-white outline-none"
          />
        </div>
        <button
          onClick={addMeal}
          className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100"
        >
          <FiPlus />
          افزودن وعده
        </button>
        <div className="space-y-2">
          {meals.map((meal, i) => (
            <div key={i} className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2 text-sm text-zinc-200">
              <div>
                <div className="font-bold text-white">{meal.title}</div>
                {meal.detail ? <div className="text-[11px] text-zinc-400">{meal.detail}</div> : null}
              </div>
              <button onClick={() => removeMeal(i)} className="text-zinc-400 hover:text-rose-300">
                <FiX />
              </button>
            </div>
          ))}
          {meals.length === 0 ? (
            <div className="text-sm text-zinc-500">وعده‌ای ثبت نشده</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
