"use client";

import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatMacro } from "@/lib/nutrition/display";
import { matchingLogForPlanned } from "@/lib/nutrition/foodLog";
import { MEAL_SLOTS } from "@/lib/nutrition/mealSlots";

function groupPlannedMeals(meals) {
  const indexed = (meals || []).map((meal, index) => ({ meal, index }));
  const groups = MEAL_SLOTS.map((slot) => ({
    ...slot,
    meals: indexed.filter(({ meal }) => meal.mealSlot === slot.value),
  })).filter((group) => group.meals.length > 0);

  const other = indexed.filter(
    ({ meal }) => !MEAL_SLOTS.some((slot) => slot.value === meal.mealSlot)
  );
  if (other.length) {
    groups.push({ value: "other", label: "سایر", meals: other });
  }
  return groups;
}

export default function PlannedMealsCard({
  meals,
  logs,
  fallback,
  busyKey,
  onToggle,
}) {
  if (!meals?.length) return null;

  const groups = groupPlannedMeals(meals);
  const consumed = meals.filter((meal, index) =>
    Boolean(matchingLogForPlanned(meal, index, meals, logs))
  ).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">برنامه غذایی فعال</CardTitle>
        <CardDescription>
          {fallback
            ? "برنامه روزانه فعال — موارد خورده‌شده را تیک بزن"
            : "موارد خورده‌شده را تیک بزن تا در کالری امروز حساب شوند"}
          <span className="ms-1 tabular-nums">
            ({consumed.toLocaleString("fa-IR")} از {meals.length.toLocaleString("fa-IR")})
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {groups.map((group) => (
            <section
              key={group.value}
              className="overflow-hidden rounded-xl border bg-muted/10"
              aria-label={group.label}
            >
              <div className="border-b border-border/60 bg-muted/30 px-3 py-2">
                <p className="text-sm font-iranianSansDemiBold">{group.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                  {group.meals.length.toLocaleString("fa-IR")} مورد
                </p>
              </div>
              <ul className="space-y-2 p-3">
                  {group.meals.map(({ meal, index }) => {
                    const log = matchingLogForPlanned(meal, index, meals, logs);
                    const checked = Boolean(log);
                    const rowKey = `${index}-${meal.foodId || meal.title}`;
                    const busy = busyKey === rowKey;
                    return (
                      <li key={rowKey}>
                        <label
                          className={cn(
                            "flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg border px-2.5 py-2 transition-colors duration-200",
                            checked
                              ? "border-primary/40 bg-primary/5"
                              : "border-transparent bg-background/60 hover:border-border"
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={busy}
                            onCheckedChange={(next) => onToggle(meal, index, Boolean(next), log)}
                            className="mt-0.5 size-4 cursor-pointer"
                            aria-label={`مصرف ${meal.title}`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-sm font-iranianSansMedium">
                              {checked ? (
                                <Check className="size-3.5 shrink-0 text-primary" aria-hidden />
                              ) : null}
                              {meal.title}
                            </span>
                            {meal.detail ? (
                              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                {meal.detail}
                              </span>
                            ) : null}
                            {meal.calories ? (
                              <Badge variant="outline" className="mt-1 text-[10px] tabular-nums">
                                {formatMacro(meal.calories, "کیلوکالری")}
                              </Badge>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
            </section>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
