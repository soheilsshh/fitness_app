"use client";

import { RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ResultCard({ suggestion, onRegenerate, regenerating }) {
  if (!suggestion) return null;

  const { recipe_name: recipeName, instructions, items = [], total_calories: totalCalories } =
    suggestion;

  const totals = items.reduce(
    (acc, item) => ({
      protein: acc.protein + (item.protein_g || 0),
      carbs: acc.carbs + (item.carbs_g || 0),
      fat: acc.fat + (item.fat_g || 0),
    }),
    { protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <h3 className="text-lg font-iranianSansDemiBold text-foreground">{recipeName}</h3>
          {instructions ? (
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{instructions}</p>
          ) : null}
        </div>

        <Separator />

        <div className="space-y-2.5">
          {items.map((item, i) => (
            <div
              key={`${item.food_name}-${i}`}
              className="flex items-start justify-between gap-3 rounded-xl border bg-muted/20 px-3 py-2.5"
            >
              <div className="min-w-0 text-start">
                <p className="text-sm font-iranianSansDemiBold text-foreground">
                  {item.food_name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.amount_g ? `${item.amount_g} گرم` : ""}
                  {item.serving_label ? ` · ${item.serving_label}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  {item.calories} kcal
                </Badge>
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  پروتئین {item.protein_g}g
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl bg-primary/10 py-2.5">
            <p className="text-sm font-iranianSansDemiBold tabular-nums text-primary">
              {totalCalories}
            </p>
            <p className="text-[11px] text-muted-foreground">کیلوکالری</p>
          </div>
          <div className="rounded-xl bg-muted/30 py-2.5">
            <p className="text-sm font-iranianSansDemiBold tabular-nums text-foreground">
              {Math.round(totals.protein)}g
            </p>
            <p className="text-[11px] text-muted-foreground">پروتئین</p>
          </div>
          <div className="rounded-xl bg-muted/30 py-2.5">
            <p className="text-sm font-iranianSansDemiBold tabular-nums text-foreground">
              {Math.round(totals.carbs)}g
            </p>
            <p className="text-[11px] text-muted-foreground">کربوهیدرات</p>
          </div>
          <div className="rounded-xl bg-muted/30 py-2.5">
            <p className="text-sm font-iranianSansDemiBold tabular-nums text-foreground">
              {Math.round(totals.fat)}g
            </p>
            <p className="text-[11px] text-muted-foreground">چربی</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          disabled={regenerating}
          onClick={onRegenerate}
        >
          <RefreshCcw className={regenerating ? "size-4 animate-spin" : "size-4"} />
          {regenerating ? "در حال ساخت پیشنهاد دیگر..." : "پیشنهاد دیگر"}
        </Button>
      </CardContent>
    </Card>
  );
}
