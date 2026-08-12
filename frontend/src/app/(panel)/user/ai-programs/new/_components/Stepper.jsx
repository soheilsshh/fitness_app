"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 4-step RTL stepper. Clicking a completed step jumps back to it;
 * future steps aren't clickable until reached.
 */
export default function Stepper({ steps, activeIndex, onStepClick }) {
  return (
    <ol className="grid grid-cols-4 gap-2" dir="rtl">
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;
        const clickable = isDone;
        return (
          <li key={step.id}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(index)}
              className={cn(
                "flex w-full flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition-colors",
                clickable ? "cursor-pointer" : "cursor-default",
                isActive && "border-primary/40 bg-primary/10 text-foreground",
                isDone &&
                  !isActive &&
                  "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                !isActive && !isDone && "border-border bg-muted/20 text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-xs font-iranianSansDemiBold tabular-nums",
                  isActive && "border-primary bg-primary text-primary-foreground",
                  isDone && !isActive && "border-emerald-500 bg-emerald-500 text-white",
                  !isActive && !isDone && "border-border bg-background text-muted-foreground"
                )}
              >
                {isDone ? <Check className="size-4" /> : index + 1}
              </span>
              <span className="text-[11px] font-iranianSansMedium sm:text-xs">
                {step.label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
