"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Apple,
  ChevronLeft,
  PenLine,
  Save,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { toastError } from "@/app/(site)/auth/_components/helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { DAY_KEYS, DAY_LABELS, emptyPlanByDay } from "../../../_components/programDays";
import {
  mealWithServingAmount,
  normalizeNutritionFromApi,
  nutritionToApiPayload,
  roundMacro,
  sumDayMacros,
} from "../../../_components/nutritionHelpers";
import FoodPickerModal from "./FoodPickerModal";
import ManualFoodModal from "./ManualFoodModal";

function applyCaloriesToPlan(planByDay, calories) {
  const value = Math.round(Number(calories));
  if (!value) return planByDay;
  const next = { ...planByDay };
  for (const key of DAY_KEYS) {
    const day = { ...next[key] };
    day.nutrition = {
      ...(day.nutrition || { meals: [] }),
      caloriesTarget: value,
      proteinTarget: day.nutrition?.proteinTarget || "",
      meals: day.nutrition?.meals || [],
    };
    next[key] = day;
  }
  return next;
}

function buildSavePlanByDay(planByDay, selectedDay, caloriesTarget, proteinTarget) {
  const next = { ...planByDay };
  const day = { ...next[selectedDay] };
  day.nutrition = {
    ...(day.nutrition || { meals: [] }),
    caloriesTarget: Number(caloriesTarget) || 0,
    proteinTarget: proteinTarget.trim(),
    meals: day.nutrition?.meals || [],
  };
  next[selectedDay] = day;

  const payload = {};
  for (const key of DAY_KEYS) {
    const d = next[key];
    payload[key] = {
      ...d,
      nutrition: nutritionToApiPayload(d.nutrition),
    };
  }
  return payload;
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
  const [caloriesTarget, setCaloriesTarget] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");
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
        setProgramId(data.nutritionProgramId || null);
        if (data.planByDay) {
          const merged = emptyPlanByDay();
          for (const key of DAY_KEYS) {
            if (data.planByDay[key]?.nutrition) {
              merged[key].nutrition = normalizeNutritionFromApi(
                data.planByDay[key].nutrition
              );
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

  const meals = planByDay[selectedDay]?.nutrition?.meals || [];

  const dayTotals = useMemo(() => sumDayMacros(meals), [meals]);

  const caloriesTargetNum = Number(caloriesTarget) || 0;

  const updateDayNutrition = (updater) => {
    setPlanByDay((prev) => {
      const next = { ...prev };
      const day = { ...next[selectedDay] };
      day.nutrition = updater(day.nutrition || { meals: [], caloriesTarget: 0, proteinTarget: "" });
      next[selectedDay] = day;
      return next;
    });
  };

  const addMeal = (meal) => {
    updateDayNutrition((n) => ({
      ...n,
      meals: [...(n.meals || []), meal],
    }));
  };

  const removeMeal = (mealUid) => {
    updateDayNutrition((n) => ({
      ...n,
      meals: (n.meals || []).filter((m) => m.uid !== mealUid),
    }));
  };

  const updateMealServing = (mealUid, servingValue) => {
    updateDayNutrition((n) => ({
      ...n,
      meals: (n.meals || []).map((m) =>
        m.uid === mealUid ? mealWithServingAmount(m, servingValue) : m
      ),
    }));
  };

  const updateManualMacro = (mealUid, field, value) => {
    updateDayNutrition((n) => ({
      ...n,
      meals: (n.meals || []).map((m) => {
        if (m.uid !== mealUid) return m;
        return { ...m, [field]: roundMacro(value) };
      }),
    }));
  };

  const syncTargetsToState = () => {
    updateDayNutrition((n) => ({
      ...n,
      caloriesTarget: Number(caloriesTarget) || 0,
      proteinTarget: proteinTarget.trim(),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const savePlan = buildSavePlanByDay(
        planByDay,
        selectedDay,
        caloriesTarget,
        proteinTarget
      );
      const payload = {
        title,
        durationWeeks: 4,
        planByDay: savePlan,
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
            onBlur={syncTargetsToState}
            placeholder="مثلاً ۲۲۰۰"
            className="tabular-nums"
          />
        </div>
        <div className="space-y-2">
          <Label>هدف پروتئین</Label>
          <Input
            value={proteinTarget}
            onChange={(e) => setProteinTarget(e.target.value)}
            onBlur={syncTargetsToState}
            placeholder="مثلاً ۱۸۰g"
          />
        </div>
      </div>

      <DayMacroSummary
        totals={dayTotals}
        caloriesTarget={caloriesTargetNum}
        proteinTarget={proteinTarget}
        dayLabel={DAY_LABELS[selectedDay]}
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <UtensilsCrossed className="size-4 text-primary" />
                وعده‌های {DAY_LABELS[selectedDay]}
              </CardTitle>
              <CardDescription className="mt-1 text-start">
                غذا را از کاتالوگ انتخاب کنید یا به صورت دستی وارد نمایید
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                <Apple data-icon="inline-start" />
                انتخاب از کاتالوگ
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setManualOpen(true)}>
                <PenLine data-icon="inline-start" />
                ورود دستی
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {meals.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              هنوز غذایی برای این روز اضافه نشده است.
            </p>
          ) : (
            <div className="space-y-3">
              {meals.map((meal) => (
                <MealCard
                  key={meal.uid}
                  meal={meal}
                  onRemove={() => removeMeal(meal.uid)}
                  onServingChange={(value) => updateMealServing(meal.uid, value)}
                  onManualMacroChange={(field, value) =>
                    updateManualMacro(meal.uid, field, value)
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FoodPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={addMeal}
        dayLabel={DAY_LABELS[selectedDay]}
      />
      <ManualFoodModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onAdd={addMeal}
        dayLabel={DAY_LABELS[selectedDay]}
      />
    </div>
  );
}

function DayMacroSummary({ totals, caloriesTarget, proteinTarget, dayLabel }) {
  const calorieDelta = caloriesTarget > 0 ? totals.calories - caloriesTarget : null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">خلاصه ماکرو — {dayLabel}</CardTitle>
        <CardDescription className="text-start">
          جمع وعده‌های برنامه‌ریزی‌شده در مقایسه با اهداف روزانه
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat
            label="کالری"
            value={totals.calories}
            unit="kcal"
            target={caloriesTarget > 0 ? caloriesTarget : null}
            highlight={
              calorieDelta !== null
                ? calorieDelta > 0
                  ? "over"
                  : calorieDelta < 0
                    ? "under"
                    : "ok"
                : null
            }
          />
          <SummaryStat label="پروتئین" value={totals.protein} unit="g" targetLabel={proteinTarget} />
          <SummaryStat label="کربوهیدرات" value={totals.carbs} unit="g" />
          <SummaryStat label="چربی" value={totals.fat} unit="g" />
        </div>
        {calorieDelta !== null ? (
          <p
            className={cn(
              "mt-3 text-xs",
              calorieDelta > 0
                ? "text-amber-700 dark:text-amber-300"
                : calorieDelta < 0
                  ? "text-sky-700 dark:text-sky-300"
                  : "text-emerald-700 dark:text-emerald-300"
            )}
          >
            {calorieDelta === 0
              ? "کالری برنامه با هدف روزانه برابر است."
              : calorieDelta > 0
                ? `${Math.abs(Math.round(calorieDelta)).toLocaleString("fa-IR")} kcal بالاتر از هدف کالری`
                : `${Math.abs(Math.round(calorieDelta)).toLocaleString("fa-IR")} kcal پایین‌تر از هدف کالری`}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SummaryStat({ label, value, unit, target, targetLabel, highlight }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">
        {roundMacro(value).toLocaleString("fa-IR")}
        <span className="ms-1 text-xs font-normal text-muted-foreground">{unit}</span>
      </p>
      {target != null && target > 0 ? (
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          هدف: {Math.round(target).toLocaleString("fa-IR")} {unit}
        </p>
      ) : targetLabel ? (
        <p className="mt-0.5 text-[10px] text-muted-foreground">هدف: {targetLabel}</p>
      ) : null}
      {highlight === "over" ? (
        <Badge variant="outline" className="mt-1 text-[10px] text-amber-700">
          بالاتر از هدف
        </Badge>
      ) : highlight === "under" ? (
        <Badge variant="outline" className="mt-1 text-[10px] text-sky-700">
          پایین‌تر از هدف
        </Badge>
      ) : highlight === "ok" ? (
        <Badge variant="outline" className="mt-1 text-[10px] text-emerald-700">
          مطابق هدف
        </Badge>
      ) : null}
    </div>
  );
}

function MealCard({ meal, onRemove, onServingChange, onManualMacroChange }) {
  const isCatalog = Boolean(meal.foodId);

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1 text-start">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{meal.title}</p>
            {isCatalog ? (
              <Badge variant="secondary" className="text-[10px]">
                کاتالوگ
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                دستی
              </Badge>
            )}
          </div>
          {meal.detail ? (
            <p className="text-xs text-muted-foreground">{meal.detail}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          className="shrink-0 text-muted-foreground hover:text-destructive"
          aria-label="حذف غذا"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {isCatalog ? (
        <div className="mt-3 space-y-2">
          <Label className="text-xs">مقدار مصرفی ({meal.unit || "واحد"})</Label>
          <Input
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={meal.servingAmount ?? ""}
            onChange={(e) => onServingChange(e.target.value)}
            className="h-9 max-w-[140px] tabular-nums"
          />
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MacroInput label="کالری" value={meal.calories} onChange={(v) => onManualMacroChange("calories", v)} />
          <MacroInput label="پروتئین" value={meal.protein} onChange={(v) => onManualMacroChange("protein", v)} />
          <MacroInput label="کربو" value={meal.carbs} onChange={(v) => onManualMacroChange("carbs", v)} />
          <MacroInput label="چربی" value={meal.fat} onChange={(v) => onManualMacroChange("fat", v)} />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <MacroChip label="کالری" value={meal.calories} unit="kcal" />
        <MacroChip label="P" value={meal.protein} unit="g" />
        <MacroChip label="C" value={meal.carbs} unit="g" />
        <MacroChip label="F" value={meal.fat} unit="g" />
        {meal.multiplier && meal.multiplier !== 1 ? (
          <Badge variant="outline" className="tabular-nums text-[10px]">
            ×{roundMacro(meal.multiplier).toLocaleString("fa-IR")}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

function MacroInput({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min="0"
        step="any"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 tabular-nums"
      />
    </div>
  );
}

function MacroChip({ label, value, unit }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] tabular-nums">
      <span className="text-muted-foreground">{label}</span>
      {roundMacro(value).toLocaleString("fa-IR")}
      <span className="text-muted-foreground">{unit}</span>
    </span>
  );
}
