"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Apple, ArrowRight, Check, RefreshCw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/axios/client";
import { getApiErrorMessage } from "@/lib/api/translateError";
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
  const [error, setError] = useState("");

  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [nutritionGenerating, setNutritionGenerating] = useState(false);
  const [nutritionSaving, setNutritionSaving] = useState(false);
  const [nutritionSaved, setNutritionSaved] = useState(false);

  const generate = useCallback(
    async (save) => {
      setGenerating(true);
      setError("");
      try {
        const res = await api.post("/me/workout/generate", {
          save,
          equipment: details.equipmentLabels,
          daysPerWeek: details.daysPerWeek,
          sessionMinutes: details.sessionMinutes,
        });
        setPlan(res.data?.plan || null);
        if (save) {
          setSaved(true);
          toast.success("برنامه تمرینی ذخیره شد و در «برنامه‌های من» فعال است");
        }
      } catch (e) {
        setError(getApiErrorMessage(e, "ساخت برنامه ناموفق بود"));
      } finally {
        setGenerating(false);
      }
    },
    [details]
  );

  useEffect(() => {
    generate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateNutrition = async (save) => {
    setNutritionGenerating(true);
    try {
      const res = await api.post("/me/nutrition/generate", {
        save,
        goal: goalToNutritionGoal(goal),
      });
      setNutritionPlan(res.data?.plan || null);
      if (save) {
        setNutritionSaved(true);
        toast.success("برنامه غذایی ذخیره شد و در «برنامه‌های من» فعال است");
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "ساخت برنامه غذایی ناموفق بود"));
    } finally {
      setNutritionGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-iranianSansDemiBold text-foreground">پیش‌نمایش برنامه</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          این پیش‌نویس هوش مصنوعی است. تا وقتی آن را ذخیره نکنید، رسمی محسوب نمی‌شود.
        </p>
      </div>

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
              onClick={() => generate(false)}
            >
              <RefreshCw data-icon="inline-start" />
              تولید مجدد
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={generating || saving || !plan}
              onClick={async () => {
                setSaving(true);
                await generate(true);
                setSaving(false);
              }}
            >
              <Save data-icon="inline-start" />
              {saving ? "در حال ذخیره..." : "ذخیره در برنامه‌های من"}
            </Button>
          </div>
          {saved ? (
            <p className="text-xs text-muted-foreground">
              چون برنامه دوباره توسط هوش مصنوعی ساخته شد، ممکن است با پیش‌نمایش قبلی کمی تفاوت جزئی داشته باشد.
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
              onClick={() => generateNutrition(false)}
            >
              <RefreshCw data-icon="inline-start" />
              {nutritionPlan ? "تولید مجدد" : "ساخت برنامه غذایی"}
            </Button>
            {nutritionPlan ? (
              <Button
                type="button"
                size="sm"
                disabled={nutritionGenerating || nutritionSaving}
                onClick={async () => {
                  setNutritionSaving(true);
                  await generateNutrition(true);
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
          <Button type="button" className="h-11 gap-2" onClick={() => router.push("/user/my-programs")}>
            رفتن به برنامه‌های من
          </Button>
        ) : null}
      </div>
    </div>
  );
}
