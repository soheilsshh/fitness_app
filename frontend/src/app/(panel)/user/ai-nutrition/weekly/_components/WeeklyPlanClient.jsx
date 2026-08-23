"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/axios/client";
import { getApiErrorMessage } from "@/lib/api/translateError";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "../../../_components/ui/PageHeader";
import { DAILY_GOAL_OPTIONS, mealTotals } from "../../_components/nutritionGoals";
import MealCard from "../../_components/MealCard";
import RegenerateMealDialog from "../../_components/RegenerateMealDialog";
import SavedPlansPoolCard from "../../../my-programs/_components/SavedPlansPoolCard";

function dayTotals(meals = []) {
  return meals.reduce(
    (acc, meal) => {
      const t = mealTotals(meal.items);
      return {
        calories: acc.calories + t.calories,
        protein: acc.protein + t.protein,
        carbs: acc.carbs + t.carbs,
        fat: acc.fat + t.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export default function WeeklyPlanClient() {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [targets, setTargets] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);

  const [dialogMeal, setDialogMeal] = useState(null); // { dayIndex, mealIndex }
  const [regenerating, setRegenerating] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const goalLabel = DAILY_GOAL_OPTIONS.find((g) => g.value === goal)?.label || "";

  const weekTotals = useMemo(() => {
    if (!plan) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return plan.days.reduce(
      (acc, day) => {
        const t = dayTotals(day.meals);
        return {
          calories: acc.calories + t.calories,
          protein: acc.protein + t.protein,
          carbs: acc.carbs + t.carbs,
          fat: acc.fat + t.fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [plan]);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const res = await api.post("/me/nutrition/generate-week", { goal, save: false });
      setPlan(res.data.plan);
      setTargets(res.data.targets);
      setSelectedDay(0);
      setConfirmed(false);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "ساخت برنامه هفتگی ناموفق بود"));
    } finally {
      setLoading(false);
    }
  };

  const confirmPlan = async () => {
    if (!plan) return;
    setConfirming(true);
    try {
      await api.post("/me/nutrition/generate-week", { plan, save: true });
      setConfirmed(true);
      toast.success("برنامه هفتگی برای تأیید مربی ارسال شد");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "ذخیره برنامه ناموفق بود"));
    } finally {
      setConfirming(false);
    }
  };

  const regenerateMeal = async (reason) => {
    if (!dialogMeal || !plan) return;
    const { dayIndex, mealIndex } = dialogMeal;
    const meal = plan.days[dayIndex].meals[mealIndex];
    const currentCalories = Math.round(mealTotals(meal.items).calories);

    setRegenerating(dialogMeal);
    try {
      const res = await api.post("/me/nutrition/regenerate-meal", {
        goal: goalLabel,
        mealName: meal.name,
        targetCalories: currentCalories,
        reason,
      });
      const nextDays = plan.days.map((day, di) => {
        if (di !== dayIndex) return day;
        const nextMeals = [...day.meals];
        nextMeals[mealIndex] = res.data;
        return { ...day, meals: nextMeals };
      });
      setPlan({ ...plan, days: nextDays });
      setConfirmed(false);
      setDialogMeal(null);
      toast.success("وعده جایگزین شد");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "تغییر وعده ناموفق بود"));
    } finally {
      setRegenerating(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="📅 برنامه هفتگی با AI"
        description="برنامه غذایی ۷ روز آینده، متناسب با هدفت."
      />

      {!plan ? (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <p className="mb-2 text-sm font-iranianSansDemiBold text-foreground">هدف</p>
              <div className="flex flex-wrap gap-2">
                {DAILY_GOAL_OPTIONS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGoal(g.value)}
                    className={
                      "rounded-full border px-3.5 py-1.5 text-sm font-iranianSansMedium transition-colors " +
                      (goal === g.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40")
                    }
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <Button type="button" disabled={!goal || loading} onClick={generatePlan} className="gap-2">
              {loading ? "در حال ساخت..." : "برنامه هفتگی را بساز"}
              <Sparkles className="size-4" data-icon="inline-end" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
              <p className="text-sm font-iranianSansDemiBold text-foreground">
                هدف روزانه
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="tabular-nums">
                  {targets?.targetCalories} kcal
                </Badge>
                {targets?.proteinG ? (
                  <Badge variant="outline" className="tabular-nums">
                    پروتئین {targets.proteinG}g
                  </Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            {plan.days.map((day, i) => (
              <button
                key={`${day.day_name}-${i}`}
                type="button"
                onClick={() => setSelectedDay(i)}
                className={
                  "rounded-full border px-3.5 py-1.5 text-sm font-iranianSansMedium transition-colors " +
                  (selectedDay === i
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40")
                }
              >
                {day.day_name}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {plan.days[selectedDay]?.meals.map((meal, mealIndex) => (
              <MealCard
                key={`${meal.name}-${mealIndex}`}
                meal={meal}
                regenerating={
                  regenerating?.dayIndex === selectedDay && regenerating?.mealIndex === mealIndex
                }
                onRegenerate={() => setDialogMeal({ dayIndex: selectedDay, mealIndex })}
              />
            ))}
          </div>

          <Card className="sticky bottom-3">
            <CardContent className="space-y-3 pt-5">
              <p className="text-sm font-iranianSansDemiBold text-foreground">جمع هفته</p>
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-xl bg-muted/30 py-2.5 text-center">
                  <p className="text-sm font-iranianSansDemiBold tabular-nums text-foreground">
                    {Math.round(weekTotals.calories)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">مجموع کیلوکالری</p>
                </div>
                <div className="rounded-xl bg-muted/30 py-2.5 text-center">
                  <p className="text-sm font-iranianSansDemiBold tabular-nums text-foreground">
                    {Math.round(weekTotals.protein)}g
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">پروتئین</p>
                </div>
                <div className="rounded-xl bg-muted/30 py-2.5 text-center">
                  <p className="text-sm font-iranianSansDemiBold tabular-nums text-foreground">
                    {Math.round(weekTotals.carbs)}g
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">کربوهیدرات</p>
                </div>
                <div className="rounded-xl bg-muted/30 py-2.5 text-center">
                  <p className="text-sm font-iranianSansDemiBold tabular-nums text-foreground">
                    {Math.round(weekTotals.fat)}g
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">چربی</p>
                </div>
              </div>
              <Button
                type="button"
                className="w-full gap-2"
                disabled={confirming || confirmed}
                onClick={confirmPlan}
              >
                {confirmed
                  ? "برای تأیید مربی ارسال شد"
                  : confirming
                    ? "در حال ارسال..."
                    : "تأیید برنامه"}
              </Button>
              {confirmed ? (
                <p className="text-center text-xs text-muted-foreground">
                  برنامه برای مربی‌ات ارسال شد و بعد از تأییدش می‌توانی فعالش کنی — پایین همین صفحه را ببین.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <RegenerateMealDialog
            open={dialogMeal !== null}
            mealName={
              dialogMeal ? plan.days[dialogMeal.dayIndex]?.meals[dialogMeal.mealIndex]?.name : ""
            }
            loading={regenerating !== null}
            onClose={() => setDialogMeal(null)}
            onConfirm={regenerateMeal}
          />

          <SavedPlansPoolCard key={confirmed ? "confirmed" : "pending"} type="nutrition" />
        </>
      )}
    </div>
  );
}
