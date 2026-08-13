"use client";

import { cn } from "@/lib/utils";

const ROWS = [
  { key: "calories", label: "کالری", emoji: "🔥", unit: "کالری" },
  { key: "protein", label: "پروتئین", emoji: "🍗", unit: "گرم" },
  { key: "fat", label: "چربی", emoji: "🧈", unit: "گرم" },
  { key: "carbs", label: "کربوهیدرات", emoji: "🍞", unit: "گرم" },
  { key: "sugar", label: "شکر", emoji: "🍬", unit: "گرم" },
  { key: "sodium", label: "سدیم", emoji: "🧂", unit: "میلی‌گرم" },
  { key: "cholesterol", label: "کلسترول", emoji: "🥚", unit: "میلی‌گرم" },
  { key: "calcium", label: "کلسیم", emoji: "🥛", unit: "میلی‌گرم" },
  { key: "iron", label: "آهن", emoji: "🥬", unit: "میلی‌گرم" },
  { key: "fiber", label: "فیبر", emoji: "🌾", unit: "گرم" },
  { key: "magnesium", label: "منیزیم", emoji: "🥜", unit: "میلی‌گرم" },
  { key: "potassium", label: "پتاسیم", emoji: "🍌", unit: "میلی‌گرم" },
  { key: "phosphorus", label: "فسفر", emoji: "🐟", unit: "میلی‌گرم" },
  { key: "transFat", label: "ترانس", emoji: "🍟", unit: "گرم" },
  { key: "saturatedFat", label: "اسید چرب اشباع", emoji: "🥩", unit: "گرم" },
];

function formatValue(value, unit) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const display =
    Math.abs(n) < 10 ? n.toFixed(1) : Math.round(n).toLocaleString("fa-IR");
  return `${display} ${unit}`;
}

/**
 * Full 15-field nutrition panel for an already-scaled serving. Fields the
 * food hasn't been USDA-enriched for yet show "نامشخص" rather than a
 * fabricated number — see backend cmd/enrichfoods.
 */
export default function NutritionFactsGrid({ facts, className }) {
  return (
    <div
      dir="rtl"
      className={cn("overflow-hidden rounded-xl border bg-card", className)}
    >
      {ROWS.map((row, i) => {
        const display = formatValue(facts?.[row.key], row.unit);
        return (
          <div
            key={row.key}
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-2.5 text-sm",
              i !== ROWS.length - 1 && "border-b"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">{row.emoji}</span>
              <span className="font-medium">{row.label}</span>
            </div>
            <span
              className={cn(
                "tabular-nums",
                display ? "font-semibold" : "text-muted-foreground"
              )}
            >
              {display ?? "نامشخص"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
