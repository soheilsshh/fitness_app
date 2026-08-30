"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function parseOptionalCalories(raw) {
  const n = Number(String(raw || "").trim());
  if (!Number.isFinite(n) || n < 800 || n > 6000) return 0;
  return Math.round(n);
}

export default function OptionalCalorieTarget({ value, onChange, id = "calorie-target" }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-iranianSansDemiBold text-foreground">
        کالری هدف
        <span className="ms-1 font-iranianSansMedium text-muted-foreground">(اختیاری)</span>
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={800}
        max={6000}
        step={50}
        dir="ltr"
        placeholder="مثلاً ۲۲۰۰"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 max-w-[12rem] cursor-text tabular-nums"
      />
      <p className="text-xs leading-5 text-muted-foreground">
        خالی بگذار تا از روی پروفایل حساب شود. اگر عدد بدهی، برنامه حول همان کالری ساخته می‌شود.
      </p>
    </div>
  );
}
