"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MEAL_TYPE_OPTIONS } from "@/lib/nutrition/foodLog";

export default function MealTypeBoxes({ value, onChange, disabled, name }) {
  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label={name || "وعده غذایی"}>
      {MEAL_TYPE_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange(selected ? "" : opt.value)}
            className={cn(
              "inline-flex min-h-11 cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-xl border px-2 text-sm font-iranianSansMedium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {selected ? <Check className="size-3.5" aria-hidden /> : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
