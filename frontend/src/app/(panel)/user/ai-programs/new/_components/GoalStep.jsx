"use client";

import { ArrowLeft, Check, Dumbbell, Flame, HeartPulse, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const GOAL_OPTIONS = [
  {
    value: "weight_loss",
    label: "کاهش وزن",
    description: "چربی‌سوزی و تناسب اندام",
    icon: Flame,
  },
  {
    value: "muscle_gain",
    label: "عضله‌سازی",
    description: "افزایش حجم عضلات و قدرت",
    icon: Dumbbell,
  },
  {
    value: "fitness",
    label: "تناسب",
    description: "حفظ وزن و بهبود سلامت",
    icon: HeartPulse,
  },
  {
    value: "weight_gain",
    label: "افزایش وزن",
    description: "افزایش وزن سالم و متعادل",
    icon: Scale,
  },
];

export default function GoalStep({ value, onChange, onNext, saving }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-iranianSansDemiBold text-foreground">
          هدف خود را انتخاب کنید
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          برنامه متناسب با هدف و وضعیت فعلی‌تان ساخته می‌شود.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {GOAL_OPTIONS.map((goal) => {
          const Icon = goal.icon;
          const selected = value === goal.value;
          return (
            <Card
              key={goal.value}
              role="button"
              tabIndex={0}
              onClick={() => onChange(goal.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange(goal.value);
                }
              }}
              className={cn(
                "relative cursor-pointer border-2 transition-colors hover:border-primary/40",
                selected ? "border-primary" : "border-transparent"
              )}
            >
              {selected ? (
                <span className="absolute top-3 left-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" />
                </span>
              ) : null}
              <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-6" />
                </span>
                <p className="font-iranianSansDemiBold text-foreground">{goal.label}</p>
                <p className="text-xs text-muted-foreground">{goal.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-start">
        <Button type="button" disabled={!value || saving} onClick={onNext} className="h-11 gap-2">
          {saving ? "لطفاً صبر کنید..." : "ادامه"}
          <ArrowLeft data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
