"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Plus, Save, X } from "lucide-react";
import { api } from "@/lib/axios/client";
import { toastError } from "@/app/(site)/auth/_components/helpers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
            caloriesFromQuery ? applyCaloriesToPlan(merged, caloriesFromQuery) : merged
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
    return () => {
      cancelled = true;
    };
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
    return (
      <div className="space-y-4" dir="rtl">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/coach/students/${studentId}`}>
            <ChevronLeft data-icon="inline-start" />
            بازگشت
          </Link>
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving}>
          <Save data-icon="inline-start" />
          {saving ? "در حال ذخیره..." : "ذخیره برنامه"}
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-6">
          <Label htmlFor="nutrition-title">عنوان برنامه</Label>
          <Input
            id="nutrition-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </CardContent>
      </Card>

      <ToggleGroup
        type="single"
        value={selectedDay}
        onValueChange={(v) => v && setSelectedDay(v)}
        variant="outline"
        size="sm"
        className="flex flex-wrap justify-start gap-2"
      >
        {DAY_KEYS.map((key) => (
          <ToggleGroupItem key={key} value={key}>
            {DAY_LABELS[key]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>هدف کالری روزانه</Label>
          <Input
            value={caloriesTarget}
            onChange={(e) => setCaloriesTarget(e.target.value)}
            placeholder="مثلاً ۲۲۰۰"
            className="tabular-nums"
          />
        </div>
        <div className="space-y-2">
          <Label>هدف پروتئین</Label>
          <Input
            value={proteinTarget}
            onChange={(e) => setProteinTarget(e.target.value)}
            placeholder="مثلاً ۱۸۰g"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">وعده‌های {DAY_LABELS[selectedDay]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            <Input
              value={mealTitle}
              onChange={(e) => setMealTitle(e.target.value)}
              placeholder="نام وعده (صبحانه)"
            />
            <Input
              value={mealDetail}
              onChange={(e) => setMealDetail(e.target.value)}
              placeholder="جزئیات"
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addMeal}>
            <Plus data-icon="inline-start" />
            افزودن وعده
          </Button>
          <div className="space-y-2">
            {meals.map((meal, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 rounded-lg border px-4 py-2"
              >
                <div className="text-start">
                  <p className="text-sm font-medium">{meal.title}</p>
                  {meal.detail ? (
                    <p className="text-xs text-muted-foreground">{meal.detail}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeMeal(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X />
                </Button>
              </div>
            ))}
            {meals.length === 0 ? (
              <p className="text-sm text-muted-foreground">وعده‌ای ثبت نشده</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
