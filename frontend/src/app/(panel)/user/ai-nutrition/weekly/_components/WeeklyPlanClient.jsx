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
import { mealTotals } from "../../_components/nutritionGoals";
import MealCard from "../../_components/MealCard";
import RegenerateMealDialog from "../../_components/RegenerateMealDialog";
import SavedPlansPoolCard from "../../../my-programs/_components/SavedPlansPoolCard";
import WeeklyCheckInForm from "./WeeklyCheckInForm";
import OptionalCalorieTarget, { parseOptionalCalories } from "../../_components/OptionalCalorieTarget";
import GenerationHistory from "../../_components/GenerationHistory";
import {
  cloneJSON,
  HISTORY_KEYS,
  loadHistory,
  newHistoryId,
  recordHistory,
  weeklyHistorySummary,
} from "../../_components/generationHistory";
import {
  emptyWeeklyCheckIn,
  isWeeklyCheckInComplete,
  isWeeklyRulesComplete,
  toWeeklyCheckInPayload,
  weeklyGoalToPlanGoal,
} from "./weeklyCheckIn";

// Week generation is 7× a daily plan (~50s, retries can exceed 90s).
const AI_PLAN_TIMEOUT_MS = 120_000;

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
  const [checkIn, setCheckIn] = useState(() => emptyWeeklyCheckIn());
  const [calorieTarget, setCalorieTarget] = useState("");
  const [step, setStep] = useState("rules");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [targets, setTargets] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);

  const [dialogMeal, setDialogMeal] = useState(null); // { dayIndex, mealIndex }
  const [regenerating, setRegenerating] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [history, setHistory] = useState(() => loadHistory(HISTORY_KEYS.weekly));
  const [currentHistoryId, setCurrentHistoryId] = useState(null);

  const goalLabel = checkIn.weeklyGoal;
  const planGoal = weeklyGoalToPlanGoal(checkIn.weeklyGoal);

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
      const res = await api.post(
        "/me/nutrition/generate-week",
        {
          goal: planGoal,
          save: false,
          checkIn: toWeeklyCheckInPayload(checkIn),
          targetCalories: parseOptionalCalories(calorieTarget),
        },
        { timeout: AI_PLAN_TIMEOUT_MS }
      );
      const nextPlan = res.data?.plan;
      if (!Array.isArray(nextPlan?.days) || nextPlan.days.length === 0) {
        toast.error("پاسخ برنامه ناقص بود. دوباره تلاش کن.");
        return;
      }
      const nextTargets = res.data.targets;
      const entry = {
        id: newHistoryId(),
        at: Date.now(),
        summary: weeklyHistorySummary(nextPlan, nextTargets),
        plan: cloneJSON(nextPlan),
        targets: cloneJSON(nextTargets),
      };
      setHistory((prev) => recordHistory(prev, entry, HISTORY_KEYS.weekly));
      setCurrentHistoryId(entry.id);
      setPlan(nextPlan);
      setTargets(nextTargets);
      setSelectedDay(0);
      setConfirmed(false);
    } catch (e) {
      const aborted = e?.code === "ECONNABORTED" || /timeout/i.test(e?.message || "");
      toast.error(
        aborted
          ? "ساخت برنامه هفتگی طول کشید. چند ثانیه صبر کن و دوباره بزن."
          : getApiErrorMessage(e, "ساخت برنامه هفتگی ناموفق بود")
      );
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
      const nextDays = plan.days.map((day, di) => {
        if (di !== dayIndex) return day;
        const nextMeals = [...day.meals];
        nextMeals[mealIndex] = res.data;
        return { ...day, meals: nextMeals };
      });
      const nextPlan = { ...plan, days: nextDays };
      const entry = {
        id: newHistoryId(),
        at: Date.now(),
        summary: weeklyHistorySummary(nextPlan, targets),
        plan: cloneJSON(nextPlan),
        targets: cloneJSON(targets),
      };
      setHistory((prev) => recordHistory(prev, entry, HISTORY_KEYS.weekly));
      setCurrentHistoryId(entry.id);
      setPlan(nextPlan);
      setConfirmed(false);
      setDialogMeal(null);
      toast.success("وعده جایگزین شد");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "تغییر وعده ناموفق بود"));
    } finally {
      setRegenerating(null);
    }
  };

  const restoreHistory = (entry) => {
    setPlan(cloneJSON(entry.plan));
    setTargets(cloneJSON(entry.targets));
    setCurrentHistoryId(entry.id);
    setConfirmed(false);
    toast.success("این نسخه برگردانده شد");
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="برنامه هفتگی با AI"
        description="قواعد هفته را بگو تا AI خودش ۷ روز × چند وعده را بسازد — نه سؤال تکراری برای هر روز."
      />

      {!plan ? (
        <>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <WeeklyCheckInForm value={checkIn} onChange={setCheckIn} step={step} />
            {step === "style" ? (
              <OptionalCalorieTarget value={calorieTarget} onChange={setCalorieTarget} />
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {step === "style" ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => {
                    setStep("rules");
                    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
                  }}
                  className="h-11 cursor-pointer"
                >
                  بازگشت به قواعد هفته
                </Button>
              ) : null}
              {step === "rules" ? (
                <Button
                  type="button"
                  disabled={!isWeeklyRulesComplete(checkIn)}
                  onClick={() => {
                    setStep("style");
                    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
                  }}
                  className="h-11 w-full cursor-pointer sm:w-auto"
                >
                  ادامه: سبک برنامه
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={!isWeeklyCheckInComplete(checkIn) || loading}
                  onClick={generatePlan}
                  className="h-11 w-full cursor-pointer gap-2 sm:w-auto"
                >
                  {loading ? "در حال ساخت..." : "برنامه هفتگی را بساز"}
                  <Sparkles className="size-4" data-icon="inline-end" />
                </Button>
              )}
            </div>
            {step === "rules" && !isWeeklyRulesComplete(checkIn) ? (
              <p className="text-xs text-muted-foreground">
                هر ۱۲ سؤال را جواب بده تا مرحله سبک برنامه باز شود. «فرقی نمی‌کنه» هم پاسخ معتبر است.
              </p>
            ) : null}
            {step === "style" && !checkIn.style ? (
              <p className="text-xs text-muted-foreground">
                یک سبک را انتخاب کن تا دکمه ساخت برنامه فعال شود.
              </p>
            ) : null}
            {loading ? (
              <p className="text-sm text-muted-foreground">
                ساخت ۷ روز معمولاً ۳۰ تا ۹۰ ثانیه طول می‌کشد. این صفحه را نبند.
              </p>
            ) : null}
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
              onClick={() => {
                setPlan(null);
                setStep("rules");
              }}
              className="h-11 cursor-pointer"
            >
              تغییر قواعد هفته
            </Button>
          </div>
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
                aria-pressed={selectedDay === i}
                onClick={() => setSelectedDay(i)}
                className={
                  "inline-flex min-h-11 cursor-pointer touch-manipulation items-center rounded-full border px-3.5 text-sm font-iranianSansMedium transition-colors duration-200 " +
                  (selectedDay === i
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground")
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
                className="h-11 w-full cursor-pointer gap-2"
                disabled={confirming || confirmed}
                onClick={confirmPlan}
              >
                {confirmed
                  ? "برای تأیید مربی ارسال شد"
                  : confirming
                    ? "در حال ارسال..."
                    : "ارسال برای تأیید مربی"}
              </Button>
              {confirmed ? (
                <p className="text-center text-xs text-muted-foreground">
                  مربی در پروفایل شاگرد دکمه تأیید می‌بیند و با تأیید، این برنامه روی برنامه اصلیت اعمال می‌شود.
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

          <GenerationHistory items={history} currentId={currentHistoryId} onRestore={restoreHistory} />

          <SavedPlansPoolCard key={confirmed ? "confirmed" : "pending"} type="nutrition" />
        </>
      )}
    </div>
  );
}
