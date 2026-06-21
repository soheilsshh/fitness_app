"use client";

import { useCallback, useEffect, useState } from "react";
import { Apple, Loader2, Search } from "lucide-react";
import { api } from "@/lib/axios/client";
import { COACH_FOODS_PATH } from "@/lib/api/coach";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  formatFoodDetail,
  mealFromCatalogFood,
  roundMacro,
  scaleMacros,
} from "../../../_components/nutritionHelpers";

const PAGE_SIZE = 24;

function formatBaseServing(food) {
  const amount = roundMacro(food.amount);
  const unit = food.unit || "";
  if (!amount) return unit;
  return `${amount.toLocaleString("fa-IR")} ${unit}`.trim();
}

export default function FoodPickerModal({
  open,
  onClose,
  onAdd,
  dayLabel,
  foodsPath,
  primaryAddLabel = "افزودن به برنامه",
  secondaryAddLabel = "افزودن و ادامه",
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [servingAmount, setServingAmount] = useState("");

  const hasMore = items.length < total;
  const foodsEndpoint = foodsPath || COACH_FOODS_PATH;

  const fetchFoods = useCallback(async (searchQuery, pageNum, append) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError("");
    try {
      const res = await api.get(foodsEndpoint, {
        params: {
          query: searchQuery.trim() || undefined,
          page: pageNum,
          limit: PAGE_SIZE,
        },
      });
      const data = res.data || {};
      const nextItems = data.items || [];
      setTotal(Number(data.total) || 0);
      setPage(pageNum);
      setItems((prev) => (append ? [...prev, ...nextItems] : nextItems));
    } catch (err) {
      if (!append) setItems([]);
      setError(err?.response?.data?.error || "بارگذاری غذاها ناموفق بود.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [foodsEndpoint]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setItems([]);
      setPage(1);
      setTotal(0);
      setSelected(null);
      setServingAmount("");
      setError("");
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      fetchFoods(query, 1, false);
    }, query.trim() ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, fetchFoods]);

  useEffect(() => {
    if (!selected) {
      setServingAmount("");
      return;
    }
    const base = Number(selected.amount) || 1;
    setServingAmount(String(base));
  }, [selected]);

  const previewMacros = selected
    ? (() => {
        const baseAmount = Number(selected.amount) || 1;
        const serving = Number(servingAmount);
        if (!Number.isFinite(serving) || serving <= 0) {
          return { calories: 0, protein: 0, carbs: 0, fat: 0 };
        }
        const multiplier = serving / baseAmount;
        return scaleMacros(
          {
            calories: selected.calories,
            protein: selected.protein,
            carbs: selected.carbs,
            fat: selected.fat,
          },
          multiplier
        );
      })()
    : null;

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchFoods(query, page + 1, true);
  };

  const handleAdd = async (andContinue) => {
    if (!selected) return;
    const serving = Number(servingAmount);
    if (!Number.isFinite(serving) || serving <= 0) {
      setError("مقدار مصرفی باید بزرگ‌تر از صفر باشد.");
      return;
    }
    try {
      await onAdd?.(mealFromCatalogFood(selected, serving));
    } catch {
      return;
    }
    if (andContinue) {
      setSelected(null);
      setServingAmount("");
      setError("");
    } else {
      onClose?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent
        className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        dir="rtl"
      >
        <DialogHeader className="border-b px-5 py-4 text-start">
          <DialogTitle className="flex items-center gap-2">
            <Apple className="size-4 text-primary" />
            انتخاب غذا از کاتالوگ
          </DialogTitle>
          {dayLabel ? (
            <DialogDescription>برنامه {dayLabel}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="border-b px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی نام غذا..."
              className="pe-9"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : error && items.length === 0 ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              غذایی یافت نشد.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => {
                    setSelected(food);
                    setError("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-start transition",
                    selected?.id === food.id
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border bg-card hover:bg-muted/50"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{food.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      واحد پایه: {formatBaseServing(food)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 tabular-nums">
                    {Math.round(Number(food.calories) || 0).toLocaleString("fa-IR")} kcal
                  </Badge>
                </button>
              ))}

              {hasMore ? (
                <div className="flex justify-center pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        در حال بارگذاری...
                      </>
                    ) : (
                      `نمایش بیشتر (${items.length.toLocaleString("fa-IR")} از ${total.toLocaleString("fa-IR")})`
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {selected ? (
          <DialogFooter className="flex-col gap-0 border-t bg-muted/30 p-0 sm:flex-col sm:justify-start">
            <div className="w-full space-y-4 px-5 py-4">
              {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <div className="space-y-1 text-start">
                <p className="text-sm font-semibold">{selected.name}</p>
                <p className="text-xs text-muted-foreground">
                  پایه: {formatBaseServing(selected)} —{" "}
                  {Math.round(Number(selected.calories) || 0).toLocaleString("fa-IR")} kcal
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="food-serving-amount">
                  مقدار مصرفی ({selected.unit || "واحد"})
                </Label>
                <Input
                  id="food-serving-amount"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={servingAmount}
                  onChange={(e) => setServingAmount(e.target.value)}
                  className="tabular-nums"
                />
                {servingAmount ? (
                  <p className="text-xs text-muted-foreground">
                    نمایش: {formatFoodDetail(servingAmount, selected.unit)}
                  </p>
                ) : null}
              </div>

              {previewMacros ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <MacroPreview label="کالری" value={previewMacros.calories} unit="kcal" />
                  <MacroPreview label="پروتئین" value={previewMacros.protein} unit="g" />
                  <MacroPreview label="کربوهیدرات" value={previewMacros.carbs} unit="g" />
                  <MacroPreview label="چربی" value={previewMacros.fat} unit="g" />
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleAdd(true)}
                >
                  {secondaryAddLabel}
                </Button>
                <Button type="button" className="flex-1" onClick={() => handleAdd(false)}>
                  {primaryAddLabel}
                </Button>
              </div>
            </div>
          </DialogFooter>
        ) : (
          <div className="border-t px-5 py-3 text-center text-xs text-muted-foreground">
            یک غذا را انتخاب کنید، سپس مقدار مصرفی را مشخص کنید
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MacroPreview({ label, value, unit }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">
        {roundMacro(value).toLocaleString("fa-IR")}{" "}
        <span className="text-xs font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}
