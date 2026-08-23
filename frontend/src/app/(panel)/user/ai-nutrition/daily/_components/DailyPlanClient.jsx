"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/axios/client";
import { getApiErrorMessage } from "@/lib/api/translateError";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "../../../_components/ui/PageHeader";
import { DAILY_GOAL_OPTIONS, mealTotals } from "../../_components/nutritionGoals";
import MealCard from "../../_components/MealCard";
import DailySummaryBar from "./DailySummaryBar";
import RegenerateMealDialog from "../../_components/RegenerateMealDialog";
import SavedPlansPoolCard from "../../../my-programs/_components/SavedPlansPoolCard";

export default function DailyPlanClient() {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [targets, setTargets] = useState(null);

  const [dialogMealIndex, setDialogMealIndex] = useState(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const dayTotals = useMemo(() => {
    if (!plan) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return (plan.meals || []).reduce(
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
  }, [plan]);

  const goalLabel = DAILY_GOAL_OPTIONS.find((g) => g.value === goal)?.label || "";

  const generatePlan = async () => {
    setLoading(true);
    try {
      const res = await api.post("/me/nutrition/generate", { goal, save: false });
      setPlan(res.data.plan);
      setTargets(res.data.targets);
      setConfirmed(false);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "ساخت برنامه ناموفق بود"));
    } finally {
      setLoading(false);
    }
  };

  const confirmPlan = async () => {
    if (!plan) return;
    setConfirming(true);
    try {
      await api.post("/me/nutrition/generate", { plan, save: true });
      setConfirmed(true);
      toast.success("برنامه غذایی امروز برای تأیید مربی ارسال شد");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "ذخیره برنامه ناموفق بود"));
    } finally {
      setConfirming(false);
    }
  };

  const regenerateMeal = async (reason) => {
    const index = dialogMealIndex;
    if (index === null || !plan) return;
    const meal = plan.meals[index];
    const currentCalories = Math.round(mealTotals(meal.items).calories);

    setRegeneratingIndex(index);
    try {
      const res = await api.post("/me/nutrition/regenerate-meal", {
        goal: goalLabel,
        mealName: meal.name,
        targetCalories: currentCalories,
        reason,
      });
      const nextMeals = [...plan.meals];
      nextMeals[index] = res.data;
      setPlan({ ...plan, meals: nextMeals });
      setConfirmed(false);
      setDialogMealIndex(null);
      toast.success("وعده جایگزین شد");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "تغییر وعده ناموفق بود"));
    } finally {
      setRegeneratingIndex(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="☀️ برنامه روزانه با AI"
        description="یک برنامه کامل غذایی برای امروز، متناسب با هدفت."
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
              {loading ? "در حال ساخت..." : "برنامه امروز را بساز"}
              <Sparkles className="size-4" data-icon="inline-end" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {plan.meals.map((meal, i) => (
              <MealCard
                key={`${meal.name}-${i}`}
                meal={meal}
                regenerating={regeneratingIndex === i}
                onRegenerate={() => setDialogMealIndex(i)}
              />
            ))}
          </div>

          <DailySummaryBar
            totals={dayTotals}
            targets={targets}
            onConfirm={confirmPlan}
            confirming={confirming}
            confirmed={confirmed}
          />

          <RegenerateMealDialog
            open={dialogMealIndex !== null}
            mealName={dialogMealIndex !== null ? plan.meals[dialogMealIndex]?.name : ""}
            loading={regeneratingIndex !== null}
            onClose={() => setDialogMealIndex(null)}
            onConfirm={regenerateMeal}
          />

          <SavedPlansPoolCard key={confirmed ? "confirmed" : "pending"} type="nutrition" />
        </>
      )}
    </div>
  );
}
