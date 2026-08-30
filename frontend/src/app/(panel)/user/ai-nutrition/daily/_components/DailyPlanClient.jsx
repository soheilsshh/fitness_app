"use client";

import { useMemo, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/axios/client";
import { getApiErrorMessage } from "@/lib/api/translateError";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "../../../_components/ui/PageHeader";
import { DAILY_GOAL_OPTIONS, mealTotals } from "../../_components/nutritionGoals";
import MealCard from "../../_components/MealCard";
import DailySummaryBar from "./DailySummaryBar";
import DailyCheckInForm from "./DailyCheckInForm";
import { emptyCheckIn, isCheckInComplete, toCheckInPayload } from "./dailyCheckIn";
import RegenerateMealDialog from "../../_components/RegenerateMealDialog";
import SavedPlansPoolCard from "../../../my-programs/_components/SavedPlansPoolCard";
import OptionalCalorieTarget, { parseOptionalCalories } from "../../_components/OptionalCalorieTarget";
import GenerationHistory from "../../_components/GenerationHistory";
import {
  cloneJSON,
  dailyHistorySummary,
  HISTORY_KEYS,
  loadHistory,
  newHistoryId,
  recordHistory,
} from "../../_components/generationHistory";

const AI_PLAN_TIMEOUT_MS = 90_000;

export default function DailyPlanClient() {
  const [goal, setGoal] = useState("");
  const [checkIn, setCheckIn] = useState(() => emptyCheckIn());
  const [calorieTarget, setCalorieTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [targets, setTargets] = useState(null);

  const [dialogMealIndex, setDialogMealIndex] = useState(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [history, setHistory] = useState(() => loadHistory(HISTORY_KEYS.daily));
  const [currentHistoryId, setCurrentHistoryId] = useState(null);

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
      const res = await api.post(
        "/me/nutrition/generate",
        {
          goal,
          save: false,
          checkIn: toCheckInPayload(checkIn),
          targetCalories: parseOptionalCalories(calorieTarget),
        },
        { timeout: AI_PLAN_TIMEOUT_MS }
      );
      const nextPlan = res.data.plan;
      const nextTargets = res.data.targets;
      const entry = {
        id: newHistoryId(),
        at: Date.now(),
        summary: dailyHistorySummary(nextPlan, nextTargets),
        plan: cloneJSON(nextPlan),
        targets: cloneJSON(nextTargets),
      };
      setHistory((prev) => recordHistory(prev, entry, HISTORY_KEYS.daily));
      setCurrentHistoryId(entry.id);
      setPlan(nextPlan);
      setTargets(nextTargets);
      setConfirmed(false);
      setApplied(false);
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
      await api.post("/me/nutrition/generate", { plan, save: true, activate: false });
      setConfirmed(true);
      toast.success("برنامه برای تأیید مربی ارسال شد");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "ذخیره برنامه ناموفق بود"));
    } finally {
      setConfirming(false);
    }
  };

  const applyPlan = async () => {
    if (!plan) return;
    setApplying(true);
    try {
      await api.post("/me/nutrition/generate", { plan, save: true, activate: true });
      setApplied(true);
      toast.success("برنامه روی برنامه اصلیت قرار گرفت");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "اعمال برنامه ناموفق بود"));
    } finally {
      setApplying(false);
    }
  };

  const regenerateMeal = async (reason) => {
    const index = dialogMealIndex;
    if (index === null || !plan) return;
    const meal = plan.meals[index];
    const currentCalories = Math.round(mealTotals(meal.items).calories);

    setRegeneratingIndex(index);
    try {
      const res = await api.post(
        "/me/nutrition/regenerate-meal",
        {
          goal: goalLabel,
          mealName: meal.name,
          targetCalories: currentCalories,
          reason,
        },
        { timeout: AI_PLAN_TIMEOUT_MS }
      );
      const nextMeals = [...plan.meals];
      nextMeals[index] = res.data;
      const nextPlan = { ...plan, meals: nextMeals };
      const entry = {
        id: newHistoryId(),
        at: Date.now(),
        summary: dailyHistorySummary(nextPlan, targets),
        plan: cloneJSON(nextPlan),
        targets: cloneJSON(targets),
      };
      setHistory((prev) => recordHistory(prev, entry, HISTORY_KEYS.daily));
      setCurrentHistoryId(entry.id);
      setPlan(nextPlan);
      setConfirmed(false);
      setApplied(false);
      setDialogMealIndex(null);
      toast.success("وعده جایگزین شد");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "تغییر وعده ناموفق بود"));
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const restoreHistory = (entry) => {
    setPlan(cloneJSON(entry.plan));
    setTargets(cloneJSON(entry.targets));
    setCurrentHistoryId(entry.id);
    setConfirmed(false);
    setApplied(false);
    toast.success("این نسخه برگردانده شد");
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="برنامه روزانه با AI"
        description="اول چک‌این امروز را پر کن تا برنامه دقیقاً با مواد، وقت و حال‌وهوای امروزت جور دربیاید."
      />

      {!plan ? (
        <>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div>
              <p className="mb-2 text-sm font-iranianSansDemiBold text-foreground">هدف</p>
              <div className="flex flex-wrap gap-2">
                {DAILY_GOAL_OPTIONS.map((g) => {
                  const selected = goal === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGoal(g.value)}
                      aria-pressed={selected}
                      className={
                        "inline-flex min-h-11 cursor-pointer touch-manipulation items-center gap-1.5 rounded-full border px-3.5 text-sm font-iranianSansMedium transition-colors duration-200 " +
                        (selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground")
                      }
                    >
                      {selected ? <Check className="size-3.5" aria-hidden /> : null}
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <DailyCheckInForm value={checkIn} onChange={setCheckIn} />
            <OptionalCalorieTarget value={calorieTarget} onChange={setCalorieTarget} />
            <div className="space-y-2">
              <Button
                type="button"
                disabled={!goal || !isCheckInComplete(checkIn) || loading}
                onClick={generatePlan}
                className="h-11 w-full cursor-pointer gap-2 sm:w-auto"
              >
                {loading ? "در حال ساخت..." : "برنامه امروز را بساز"}
                <Sparkles className="size-4" data-icon="inline-end" />
              </Button>
              {!goal || !isCheckInComplete(checkIn) ? (
                <p className="text-xs text-muted-foreground">
                  هدف و هر هفت سؤال را انتخاب کن تا دکمه فعال شود. «فرقی نمی‌کنه» هم پاسخ معتبر است.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
        <GenerationHistory items={history} currentId={currentHistoryId} onRestore={restoreHistory} />
        </>
      ) : (
        <>
          <div className="flex justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPlan(null)}
              className="h-11 cursor-pointer"
            >
              تغییر چک‌این
            </Button>
          </div>
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
            onApply={applyPlan}
            applying={applying}
            applied={applied}
          />

          <RegenerateMealDialog
            open={dialogMealIndex !== null}
            mealName={dialogMealIndex !== null ? plan.meals[dialogMealIndex]?.name : ""}
            loading={regeneratingIndex !== null}
            onClose={() => setDialogMealIndex(null)}
            onConfirm={regenerateMeal}
          />

          <GenerationHistory items={history} currentId={currentHistoryId} onRestore={restoreHistory} />

          <SavedPlansPoolCard key={`${confirmed}-${applied}`} type="nutrition" />
        </>
      )}
    </div>
  );
}
