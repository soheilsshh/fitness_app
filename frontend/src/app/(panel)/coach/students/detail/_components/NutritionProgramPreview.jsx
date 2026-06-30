"use client";

import { useState } from "react";
import Link from "next/link";
import { Apple, Pencil, Plus, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatMacro, mealHasMacros, sumDayMacros } from "@/lib/nutrition/display";
import { DAY_KEYS, DAY_LABELS } from "../../_components/programDays";

function MacroChip({ label, value, unit, className }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] tabular-nums ${className}`}
    >
      <span className="font-medium">{label}</span>
      {formatMacro(value, unit)}
    </span>
  );
}

export default function NutritionProgramPreview({
  studentId,
  programs,
  hasNutritionProgram,
}) {
  const [selectedDay, setSelectedDay] = useState(
    DAY_KEYS.find((key) => (programs?.planByDay?.[key]?.nutrition?.meals?.length || 0) > 0) ||
      "sat"
  );

  const hasProgram = Boolean(programs?.nutritionProgramId);
  const nutrition = programs?.planByDay?.[selectedDay]?.nutrition;
  const meals = nutrition?.meals || [];
  const totals = sumDayMacros(meals);
  const visibleDays = DAY_KEYS.filter(
    (key) => (programs?.planByDay?.[key]?.nutrition?.meals?.length || 0) > 0
  );

  return (
    <Card dir="rtl">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex size-10 items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/10">
              <UtensilsCrossed className="size-4 text-orange-700 dark:text-orange-300" />
            </span>
            <span>
              برنامه غذایی
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                {hasProgram ? "برنامه فعال دانشجو" : "هنوز برنامه غذایی تخصیص داده نشده"}
              </span>
            </span>
          </CardTitle>
          <Button variant={hasProgram ? "outline" : "default"} size="sm" asChild>
            <Link href={`/coach/students/nutrition?id=${encodeURIComponent(studentId)}`}>
              {hasProgram ? <Pencil data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
              {hasProgram ? "ویرایش" : "ساخت برنامه"}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasProgram ? (
          <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {hasNutritionProgram
                ? "برنامه غذایی در حال بارگذاری است یا نیاز به به‌روزرسانی دارد."
                : "هنوز وعده‌ای برای این دانشجو ثبت نشده است."}
            </p>
            <Button className="mt-4" size="sm" asChild>
              <Link href={`/coach/students/nutrition?id=${encodeURIComponent(studentId)}`}>
                <UtensilsCrossed data-icon="inline-start" />
                شروع برنامه غذایی
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {visibleDays.length > 1 ? (
              <ToggleGroup
                type="single"
                value={selectedDay}
                onValueChange={(next) => next && setSelectedDay(next)}
                variant="outline"
                size="sm"
                className="flex flex-wrap justify-start gap-2"
              >
                {visibleDays.map((key) => (
                  <ToggleGroupItem key={key} value={key}>
                    {DAY_LABELS[key]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ) : null}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MacroChip
                label="کالری"
                value={totals.calories}
                unit="kcal"
                className="border-rose-500/20 bg-rose-500/5"
              />
              <MacroChip
                label="P"
                value={totals.protein}
                unit="g"
                className="border-sky-500/20 bg-sky-500/5"
              />
              <MacroChip
                label="C"
                value={totals.carbs}
                unit="g"
                className="border-orange-500/20 bg-orange-500/5"
              />
              <MacroChip
                label="F"
                value={totals.fat}
                unit="g"
                className="border-amber-500/20 bg-amber-500/5"
              />
            </div>

            {meals.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                برای این روز آیتم غذایی ثبت نشده.
              </p>
            ) : (
              <div className="space-y-2">
                {meals.map((meal, index) => (
                  <div
                    key={`${meal.foodId || meal.title}-${index}`}
                    className="flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5"
                  >
                    <Apple className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1 text-start">
                      <p className="text-sm font-medium">{meal.title}</p>
                      {meal.detail ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">{meal.detail}</p>
                      ) : null}
                      {mealHasMacros(meal) ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <MacroChip
                            label="کالری"
                            value={meal.calories}
                            unit="kcal"
                            className="border-rose-500/20 bg-rose-500/5"
                          />
                          <MacroChip
                            label="P"
                            value={meal.protein}
                            unit="g"
                            className="border-sky-500/20 bg-sky-500/5"
                          />
                        </div>
                      ) : null}
                    </div>
                    {meal.foodId ? (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        کاتالوگ
                      </Badge>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
