"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Apple, ArrowRight, Check, RefreshCw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/axios/client";
import { getApiErrorMessage } from "@/lib/api/translateError";
import { navigateAfterAuth } from "@/lib/auth/postAuthRedirect";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function goalToNutritionGoal(goal) {
  if (goal === "weight_loss") return "cut";
  if (goal === "muscle_gain" || goal === "weight_gain") return "bulk";
  return "maintain";
}

function WorkoutPreview({ plan }) {
  return (
    <div className="space-y-2">
      {(plan.days || []).map((day, i) => (
        <div key={i} className="rounded-lg border bg-card px-3 py-2.5">
          <p className="text-sm font-iranianSansDemiBold text-foreground">{day.day_name}</p>
          <ul className="mt-1.5 space-y-1">
            {(day.exercises || []).map((ex, j) => (
              <li key={j} className="text-xs text-muted-foreground">
                {ex.exercise_name} — {ex.sets}×{ex.reps} — استراحت {ex.rest_seconds} ثانیه
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function NutritionPreview({ plan }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="tabular-nums">
          {plan.total_calories?.toLocaleString("fa-IR")} کیلوکالری
        </Badge>
        <Badge variant="outline" className="tabular-nums">
          پروتئین {plan.protein_g?.toLocaleString("fa-IR")}g
        </Badge>
        <Badge variant="outline" className="tabular-nums">
          کربو {plan.carbs_g?.toLocaleString("fa-IR")}g
        </Badge>
        <Badge variant="outline" className="tabular-nums">
          چربی {plan.fat_g?.toLocaleString("fa-IR")}g
        </Badge>
      </div>
      <div className="space-y-2">
        {(plan.meals || []).map((meal, i) => (
          <div key={i} className="rounded-lg border bg-card px-3 py-2">
            <p className="text-xs font-iranianSansDemiBold text-foreground">{meal.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(meal.items || []).map((it) => it.food_name).join(" · ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PreviewStep({ goal, details, onBack }) {
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedSubscriptionId, setSavedSubscriptionId] = useState(null);
  const [error, setError] = useState("");
  const [hasActiveSubscription, setHasActiveSubscription] = useState(null);

  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [nutritionGenerating, setNutritionGenerating] = useState(false);
  const [nutritionSaving, setNutritionSaving] = useState(false);
  const [nutritionSaved, setNutritionSaved] = useState(false);
  const [nutritionSavedSubscriptionId, setNutritionSavedSubscriptionId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadSubscriptions() {
      try {
        const res = await api.get("/me/programs");
        const active = (res.data?.programs || []).some((p) => p.status === "active");
        if (!cancelled) setHasActiveSubscription(active);
      } catch {
        if (!cancelled) setHasActiveSubscription(false);
      }
    }
    loadSubscriptions();
    return () => {
      cancelled = true;
    };
  }, []);

  const generate = useCallback(
    async ({ save = false, planToSave = null } = {}) => {
      setGenerating(!save);
      setError("");
      try {
        const body = {
          save,
          equipment: details.equipmentLabels,
          daysPerWeek: details.daysPerWeek,
          sessionMinutes: details.sessionMinutes,
        };
        if (planToSave) {
          body.plan = planToSave;
        }
        const res = await api.post("/me/workout/generate", body);
        if (!save) {
          setPlan(res.data?.plan || null);
        }
        if (save && res.data?.programId) {
          setSaved(true);
          setSavedSubscriptionId(res.data.subscriptionId || null);
          toast.success("برنامه تمرینی ذخیره شد");
          if (res.data.subscriptionId) {
            toast.message("برنامه داخل اشتراک فعال شماست", {
              description: "برای دیدن جزئیات، وارد همان برنامه در «برنامه‌های من» شوید.",
            });
          }
        }
      } catch (e) {
        const msg = getApiErrorMessage(e, save ? "ذخیره برنامه ناموفق بود" : "ساخت برنامه ناموفق بود");
        setError(msg);
        if (save) toast.error(msg);
      } finally {
        setGenerating(false);
      }
    },
    [details]
  );

  useEffect(() => {
    generate({ save: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateNutrition = async ({ save = false, planToSave = null } = {}) => {
    if (!save) setNutritionGenerating(true);
    try {
      const body = {
        save,
        goal: goalToNutritionGoal(goal),
      };
      if (planToSave) {
        body.plan = planToSave;
      }
      const res = await api.post("/me/nutrition/generate", body);
      if (!save) {
        setNutritionPlan(res.data?.plan || null);
      }
      if (save && res.data?.programId) {
        setNutritionSaved(true);
        setNutritionSavedSubscriptionId(res.data.subscriptionId || null);
        toast.success("برنامه غذایی ذخیره شد");
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, save ? "ذخیره برنامه غذایی ناموفق بود" : "ساخت برنامه غذایی ناموفق بود"));
    } finally {
      setNutritionGenerating(false);
    }
  };

  const goToSavedProgram = (subscriptionId) => {
    if (!subscriptionId) {
      router.push("/user/my-programs");
      return;
    }
    navigateAfterAuth(`/user/my-programs/detail?id=${subscriptionId}`);
  };

  const canSave = hasActiveSubscription === true;
  const subscriptionHint =
    hasActiveSubscription === false
      ? "برای ذخیره برنامه در «برنامه‌های من»، ابتدا باید یک اشتراک فعال با مربی داشته باشید. پیش‌نمایش AI بدون اشتراک هم ساخته می‌شود."
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-iranianSansDemiBold text-foreground">پیش‌نمایش برنامه</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          این پیش‌نویس هوش مصنوعی است. با «ذخیره»، برنامه داخل اشتراک فعال شما در «برنامه‌های من» قرار
          می‌گیرد (کارت جدا ساخته نمی‌شود).
        </p>
      </div>

      {subscriptionHint ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {subscriptionHint}{" "}
          <Link href="/user/orders" className="font-iranianSansDemiBold underline underline-offset-2">
            مشاهده سفارش‌ها / خرید پلن
          </Link>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-iranianSansDemiBold text-foreground">
              <Sparkles className="size-4 text-primary" />
              برنامه تمرینی
            </p>
            {saved ? (
              <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
                <Check className="size-3.5" />
                ذخیره شد
              </Badge>
            ) : null}
          </div>

          {generating ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : plan ? (
            <WorkoutPreview plan={plan} />
          ) : (
            <p className="text-sm text-muted-foreground">هنوز برنامه‌ای ساخته نشده.</p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={generating || saving}
              onClick={() => generate({ save: false })}
            >
              <RefreshCw data-icon="inline-start" />
              تولید مجدد
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={generating || saving || !plan || !canSave}
              onClick={async () => {
                setSaving(true);
                await generate({ save: true, planToSave: plan });
                setSaving(false);
              }}
            >
              <Save data-icon="inline-start" />
              {saving ? "در حال ذخیره..." : "ذخیره در برنامه‌های من"}
            </Button>
          </div>
          {saved ? (
            <p className="text-xs text-muted-foreground">
              برنامه داخل اشتراک فعال شما ذخیره شد. برای دیدن حرکات و وعده‌ها، همان کارت را در «برنامه‌های
              من» باز کنید.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-iranianSansDemiBold text-foreground">
              <Apple className="size-4 text-primary" />
              برنامه غذایی (اختیاری)
            </p>
            {nutritionSaved ? (
              <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
                <Check className="size-3.5" />
                ذخیره شد
              </Badge>
            ) : null}
          </div>

          {nutritionPlan ? (
            <NutritionPreview plan={nutritionPlan} />
          ) : (
            <p className="text-sm text-muted-foreground">
              می‌خواهید برنامه غذایی متناسب با همین هدف هم بسازید؟
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={nutritionGenerating || nutritionSaving}
              onClick={() => generateNutrition({ save: false })}
            >
              <RefreshCw data-icon="inline-start" />
              {nutritionPlan ? "تولید مجدد" : "ساخت برنامه غذایی"}
            </Button>
            {nutritionPlan ? (
              <Button
                type="button"
                size="sm"
                disabled={nutritionGenerating || nutritionSaving || !canSave}
                onClick={async () => {
                  setNutritionSaving(true);
                  await generateNutrition({ save: true, planToSave: nutritionPlan });
                  setNutritionSaving(false);
                }}
              >
                <Save data-icon="inline-start" />
                {nutritionSaving ? "در حال ذخیره..." : "ذخیره برنامه غذایی"}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={generating || saving} className="h-11 gap-2">
          <ArrowRight data-icon="inline-start" />
          قبلی
        </Button>
        {saved ? (
          <Button
            type="button"
            className="h-11 gap-2"
            onClick={() => goToSavedProgram(savedSubscriptionId)}
          >
            مشاهده در برنامه‌های من
          </Button>
        ) : null}
      </div>
    </div>
  );
}
