"use client";

import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import {
  BMI_CATEGORIES,
  BMI_SCALE_MAX,
  BMI_SCALE_MIN,
  calculateBmiResult,
} from "@/lib/tools/bmiCalculator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const SEGMENT_COLORS = {
  underweight: "bg-sky-500/80",
  normal: "bg-emerald-500/80",
  overweight: "bg-amber-500/80",
  obese: "bg-rose-500/80",
};

const BADGE_CLASSES = {
  underweight: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  normal: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  overweight: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  obese: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

function segmentWidth(min, max) {
  const range = BMI_SCALE_MAX - BMI_SCALE_MIN;
  const start = Math.max(min, BMI_SCALE_MIN);
  const end = Math.min(max === Infinity ? BMI_SCALE_MAX : max, BMI_SCALE_MAX);
  return ((end - start) / range) * 100;
}

function segmentOffset(min) {
  const range = BMI_SCALE_MAX - BMI_SCALE_MIN;
  const start = Math.max(min, BMI_SCALE_MIN);
  return ((start - BMI_SCALE_MIN) / range) * 100;
}

function BmiScaleBar({ bmi, scalePosition, activeCategoryId }) {
  return (
    <div className="space-y-3">
      <div className="relative h-4 overflow-hidden rounded-full border bg-muted">
        {BMI_CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            className={cn(
              "absolute top-0 h-full",
              SEGMENT_COLORS[cat.id],
              activeCategoryId === cat.id ? "opacity-100" : "opacity-70"
            )}
            style={{
              insetInlineStart: `${segmentOffset(cat.min)}%`,
              width: `${segmentWidth(cat.min, cat.max)}%`,
            }}
          />
        ))}
        {scalePosition != null ? (
          <div
            className="absolute top-1/2 z-10 h-6 w-1 -translate-y-1/2 rounded-full bg-foreground shadow-sm"
            style={{ insetInlineStart: `calc(${scalePosition}% - 2px)` }}
            title={`BMI: ${bmi}`}
          />
        ) : null}
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
        <span>{BMI_SCALE_MIN.toLocaleString("fa-IR")}</span>
        <span>۱۸.۵</span>
        <span>۲۵</span>
        <span>۳۰</span>
        <span>{BMI_SCALE_MAX.toLocaleString("fa-IR")}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BMI_CATEGORIES.map((cat) => (
          <Badge
            key={cat.id}
            variant="outline"
            className={cn(
              "justify-center py-2",
              activeCategoryId === cat.id
                ? BADGE_CLASSES[cat.id]
                : "text-muted-foreground"
            )}
          >
            {cat.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function BmiCalculatorClient() {
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [copyDone, setCopyDone] = useState(false);

  const result = useMemo(() => {
    const heightNum = Number(heightCm);
    const weightNum = Number(weightKg);
    if (!heightNum || !weightNum) return null;
    return calculateBmiResult(weightNum, heightNum);
  }, [heightCm, weightKg]);

  const summaryText = result
    ? `BMI: ${result.bmi.toLocaleString("fa-IR")} — ${result.category?.label || ""}`
    : "";

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setCopyDone(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="text-start">
        <h1 className="text-xl font-semibold tracking-tight">محاسبه‌گر BMI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          شاخص توده بدنی (وزن ÷ قد²) برای ارزیابی سریع وضعیت وزنی شاگرد
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ورودی‌ها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>قد (سانتی‌متر)</Label>
                <Input
                  type="number"
                  min={100}
                  max={250}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="مثلاً ۱۷۵"
                  className="tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <Label>وزن (کیلوگرم)</Label>
                <Input
                  type="number"
                  min={30}
                  max={300}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="مثلاً ۷۵"
                  className="tabular-nums"
                />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              فرمول: BMI = وزن (kg) ÷ [قد (m)]² — دسته‌بندی بر اساس استاندارد WHO
              برای بزرگسالان.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">نتیجه محاسبه</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">شاخص BMI</p>
                    <p className="text-5xl font-semibold tabular-nums">
                      {result.bmi.toLocaleString("fa-IR")}
                    </p>
                  </div>
                  {result.category ? (
                    <Badge variant="outline" className={BADGE_CLASSES[result.category.id]}>
                      {result.category.label}
                    </Badge>
                  ) : null}
                </div>
                {result.category?.hint ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {result.category.hint}
                  </p>
                ) : null}
                <BmiScaleBar
                  bmi={result.bmi}
                  scalePosition={result.scalePosition}
                  activeCategoryId={result.category?.id}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                  <Copy data-icon="inline-start" />
                  {copyDone ? "کپی شد" : "کپی نتیجه"}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                قد و وزن را وارد کنید تا BMI و وضعیت نمایش داده شود.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
