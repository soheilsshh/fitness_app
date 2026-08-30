"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GOAL_OPTIONS } from "./IngredientsQuickPick";
import OptionalCalorieTarget from "../../_components/OptionalCalorieTarget";

export default function SummaryStep({
  goal,
  ingredients,
  freeText,
  calorieTarget,
  onCalorieTargetChange,
  onBack,
  onGenerate,
  generating,
}) {
  const goalLabel = GOAL_OPTIONS.find((g) => g.value === goal)?.label;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-iranianSansDemiBold text-foreground">
          خلاصه درخواست شما
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          قبل از تولید، این خلاصه را بررسی کن.
        </p>
      </div>

      <dl className="space-y-3 rounded-xl border bg-muted/20 p-4 text-sm">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted-foreground">هدف</dt>
          <dd className="font-iranianSansMedium text-foreground">
            {goalLabel || "بدون هدف مشخص"}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="shrink-0 text-muted-foreground">مواد غذایی موجود</dt>
          <dd className="font-iranianSansMedium text-foreground text-start">
            {ingredients.length ? ingredients.join("، ") : "—"}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="shrink-0 text-muted-foreground">توضیحات آزاد</dt>
          <dd className="max-w-[70%] font-iranianSansMedium text-foreground text-start whitespace-pre-wrap">
            {freeText.trim() || "—"}
          </dd>
        </div>
      </dl>

      <OptionalCalorieTarget
        id="single-calorie-target"
        value={calorieTarget}
        onChange={onCalorieTargetChange}
      />

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" className="h-11 cursor-pointer" onClick={onBack} disabled={generating}>
          <ArrowRight data-icon="inline-start" />
          بازگشت
        </Button>
        <Button type="button" onClick={onGenerate} disabled={generating} className="h-11 cursor-pointer gap-2">
          {generating ? "در حال تولید..." : "تولید کن"}
          <Sparkles className="size-4" data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
