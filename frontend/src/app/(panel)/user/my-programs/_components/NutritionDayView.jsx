"use client";

import { Apple, Egg, Fish, Utensils } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  formatMacro,
  mealHasMacros,
  parseProteinTargetGrams,
  roundMacro,
  sumDayMacros,
  targetProgressPercent,
} from "@/lib/nutrition/display";

const MEAL_ICON_RULES = [
  { test: /ماهی|میگو|سالمون|تون|ماهیچه/i, Icon: Fish },
  { test: /تخم\s*مرغ|تخم‌مرغ|egg/i, Icon: Egg },
  { test: /سیب|موز|میوه|انار|پرتقال|apple|fruit/i, Icon: Apple },
];

function MealIcon({ title, className }) {
  let Icon = Utensils;
  for (const rule of MEAL_ICON_RULES) {
    if (rule.test.test(title || "")) {
      Icon = rule.Icon;
      break;
    }
  }
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
        className
      )}
    >
      <Icon className="size-4" aria-hidden />
    </span>
  );
}

function MacroBadge({ label, value, unit, tone }) {
  const tones = {
    calories: "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200",
    protein: "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200",
    carbs: "border-orange-500/25 bg-orange-500/10 text-orange-800 dark:text-orange-200",
    fat: "border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] tabular-nums",
        tones[tone]
      )}
    >
      <span className="font-medium">{label}</span>
      {formatMacro(value, unit)}
    </span>
  );
}

function MacroRow({ meal, compact = false }) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", compact ? "" : "mt-2")}>
      <MacroBadge label="کالری" value={meal.calories} unit="kcal" tone="calories" />
      <MacroBadge label="P" value={meal.protein} unit="g" tone="protein" />
      <MacroBadge label="C" value={meal.carbs} unit="g" tone="carbs" />
      <MacroBadge label="F" value={meal.fat} unit="g" tone="fat" />
    </div>
  );
}

function TargetProgressRow({ label, current, target, unit, indicatorClass }) {
  const percent = targetProgressPercent(current, target);
  if (percent === null) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">
          <span className="font-semibold">{roundMacro(current).toLocaleString("fa-IR")}</span>
          <span className="text-muted-foreground">
            {" "}
            / {roundMacro(target).toLocaleString("fa-IR")} {unit}
          </span>
          <span className="ms-1 text-muted-foreground">({percent.toLocaleString("fa-IR")}٪)</span>
        </span>
      </div>
      <Progress
        value={percent}
        className={cn("h-2", indicatorClass)}
        aria-label={`${label}: ${percent} درصد`}
      />
    </div>
  );
}

function DailyNutritionSummary({ nutrition, totals }) {
  const caloriesTarget = Number(nutrition?.caloriesTarget) || 0;
  const proteinTargetG = parseProteinTargetGrams(nutrition?.proteinTarget);
  const proteinTargetLabel = nutrition?.proteinTarget?.trim() || "";

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">خلاصه تغذیه روزانه</CardTitle>
        <CardDescription className="text-start">
          جمع برنامه غذایی این روز در مقایسه با اهداف مربی
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryTile label="کالری" value={totals.calories} unit="kcal" tone="calories" />
          <SummaryTile label="پروتئین" value={totals.protein} unit="g" tone="protein" />
          <SummaryTile label="کربوهیدرات" value={totals.carbs} unit="g" tone="carbs" />
          <SummaryTile label="چربی" value={totals.fat} unit="g" tone="fat" />
        </div>

        <div className="space-y-3 rounded-lg border bg-card/80 p-3">
          {caloriesTarget > 0 ? (
            <TargetProgressRow
              label="پیشرفت کالری"
              current={totals.calories}
              target={caloriesTarget}
              unit="kcal"
              indicatorClass="[&_[data-slot=progress-indicator]]:bg-rose-500"
            />
          ) : (
            <p className="text-xs text-muted-foreground">هدف کالری برای این روز تعیین نشده.</p>
          )}

          {proteinTargetG > 0 ? (
            <TargetProgressRow
              label="پیشرفت پروتئین"
              current={totals.protein}
              target={proteinTargetG}
              unit="g"
              indicatorClass="[&_[data-slot=progress-indicator]]:bg-sky-500"
            />
          ) : proteinTargetLabel ? (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">هدف پروتئین</span>
              <span className="font-medium">{proteinTargetLabel}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryTile({ label, value, unit, tone }) {
  const tones = {
    calories: "border-rose-500/20 bg-rose-500/5",
    protein: "border-sky-500/20 bg-sky-500/5",
    carbs: "border-orange-500/20 bg-orange-500/5",
    fat: "border-amber-500/20 bg-amber-500/5",
  };

  return (
    <div className={cn("rounded-lg border px-3 py-2.5 text-center sm:text-start", tones[tone])}>
      <p className="text-[10px] text-muted-foreground sm:text-xs">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums sm:text-lg">
        {roundMacro(value).toLocaleString("fa-IR")}
        <span className="ms-1 text-xs font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

function MealAccordionItem({ meal, index, dayKey }) {
  const hasMacros = mealHasMacros(meal);
  const foodId = meal.foodId || meal.food_id;

  return (
    <AccordionItem value={`${dayKey}-meal-${index}`} className="border-b last:border-b-0">
      <AccordionTrigger className="py-3 hover:no-underline">
        <div className="flex w-full min-w-0 items-start gap-3 pe-2 text-start">
          <MealIcon title={meal.title} />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{meal.title}</span>
              {foodId ? (
                <Badge variant="secondary" className="text-[10px]">
                  کاتالوگ
                </Badge>
              ) : hasMacros ? (
                <Badge variant="outline" className="text-[10px]">
                  دستی
                </Badge>
              ) : null}
            </div>
            {meal.detail ? (
              <p className="text-xs text-muted-foreground">{meal.detail}</p>
            ) : null}
            {hasMacros ? <MacroRow meal={meal} compact /> : null}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-3 ps-12 text-sm text-muted-foreground">
        {hasMacros ? (
          <div className="space-y-2">
            <p className="text-xs">جزئیات ماکرو این آیتم:</p>
            <MacroRow meal={meal} />
            {meal.multiplier && meal.multiplier !== 1 ? (
              <p className="text-xs">
                ضریب مصرف: ×{roundMacro(meal.multiplier).toLocaleString("fa-IR")}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed">
            {meal.detail || "جزئیات بیشتری ثبت نشده است."}
          </p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

export default function NutritionDayView({ nutrition, dayKey }) {
  if (!nutrition) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        برای این روز برنامه غذایی تعریف نشده.
      </p>
    );
  }

  const meals = nutrition.meals || [];
  const totals = sumDayMacros(meals);
  const hasAnyMacroMeals = meals.some(mealHasMacros);

  return (
    <div className="space-y-4">
      {hasAnyMacroMeals || Number(nutrition.caloriesTarget) > 0 || nutrition.proteinTarget ? (
        <DailyNutritionSummary nutrition={nutrition} totals={totals} />
      ) : null}

      {meals.length > 0 ? (
        <div className="rounded-lg border px-1 sm:px-3">
          <p className="px-3 pt-3 text-xs font-medium text-muted-foreground sm:px-0">
            آیتم‌های برنامه ({meals.length.toLocaleString("fa-IR")})
          </p>
          <Accordion type="multiple" className="w-full">
            {meals.map((meal, index) => (
              <MealAccordionItem
                key={`${dayKey}-${meal.foodId || meal.title}-${index}`}
                meal={meal}
                index={index}
                dayKey={dayKey}
              />
            ))}
          </Accordion>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          برای این روز وعده‌ای ثبت نشده است.
        </p>
      )}
    </div>
  );
}
