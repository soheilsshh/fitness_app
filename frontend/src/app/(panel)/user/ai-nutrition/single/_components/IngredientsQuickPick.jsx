"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const COMMON_INGREDIENTS = [
  "مرغ",
  "تخم‌مرغ",
  "برنج",
  "سیب‌زمینی",
  "گوشت قرمز",
  "ماهی",
  "ماست",
  "پنیر",
  "نان",
  "عدس",
  "لوبیا",
  "سبزیجات",
];

export const GOAL_OPTIONS = [
  { value: "weight_loss", label: "کاهش وزن" },
  { value: "muscle_gain", label: "عضله‌سازی" },
  { value: "maintain", label: "حفظ وزن" },
];

export default function IngredientsQuickPick({
  goal,
  onGoalChange,
  selected,
  onToggle,
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-iranianSansDemiBold text-foreground">هدف</p>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((g) => {
            const active = goal === g.value;
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => onGoalChange(active ? "" : g.value)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-iranianSansMedium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40"
                )}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-iranianSansDemiBold text-foreground">
          مواد غذایی که در دسترس داری
        </p>
        <div className="flex flex-wrap gap-2">
          {COMMON_INGREDIENTS.map((name) => {
            const active = Boolean(selected[name]);
            return (
              <button
                key={name}
                type="button"
                onClick={() => onToggle(name)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-iranianSansMedium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40"
                )}
              >
                {active ? <Check className="size-3.5" /> : null}
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
