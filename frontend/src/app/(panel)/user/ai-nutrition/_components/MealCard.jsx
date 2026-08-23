"use client";

import { Loader2, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mealTotals } from "./nutritionGoals";

export default function MealCard({ meal, onRegenerate, regenerating }) {
  const totals = mealTotals(meal.items);

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-iranianSansDemiBold text-foreground">{meal.name}</h4>
          <Badge variant="outline" className="tabular-nums">
            {Math.round(totals.calories)} kcal
          </Badge>
        </div>

        <div className="space-y-2">
          {(meal.items || []).map((item, i) => (
            <div
              key={`${item.food_name}-${i}`}
              className="flex items-start justify-between gap-3 rounded-xl bg-muted/20 px-3 py-2"
            >
              <div className="min-w-0 text-start">
                <p className="text-sm font-iranianSansMedium text-foreground">
                  {item.food_name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.amount_g ? `${item.amount_g} گرم` : ""}
                  {item.serving_label ? ` · ${item.serving_label}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {item.calories} kcal
              </span>
            </div>
          ))}
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full gap-1.5"
          disabled={regenerating}
          onClick={onRegenerate}
        >
          {regenerating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCcw className="size-3.5" />
          )}
          تغییر این وعده
        </Button>
      </CardContent>
    </Card>
  );
}
