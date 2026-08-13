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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import NutritionFactsGrid from "@/components/nutrition/NutritionFactsGrid";
import { gramsForServing, scaleNutritionByGrams } from "@/lib/nutrition/foodLog";
import { cn } from "@/lib/utils";
import { mealFromCatalogFood } from "../../_components/nutritionHelpers";

const GRAM_FALLBACK_UNIT = { label: "گرم", gramsPerUnit: 1, isDefault: true };

const PAGE_SIZE = 24;

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
  const [unitLabel, setUnitLabel] = useState("");
  const [qty, setQty] = useState("1");

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
      setUnitLabel("");
      setQty("1");
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
      setUnitLabel("");
      setQty("1");
      return;
    }
    const units = selected.servingUnits?.length ? selected.servingUnits : [GRAM_FALLBACK_UNIT];
    const def = units.find((u) => u.isDefault) || units[0];
    setUnitLabel(def.label);
    setQty("1");
  }, [selected]);

  const units = selected?.servingUnits?.length ? selected.servingUnits : [GRAM_FALLBACK_UNIT];
  const activeUnit = units.find((u) => u.label === unitLabel) || units[0];
  const grams = selected && activeUnit ? gramsForServing(activeUnit, Number(qty)) : 0;
  const previewFacts = selected && grams > 0 ? scaleNutritionByGrams(selected, grams) : null;

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchFoods(query, page + 1, true);
  };

  const handleAdd = async (andContinue) => {
    if (!selected) return;
    if (!(grams > 0)) {
      setError("مقدار مصرفی باید بزرگ‌تر از صفر باشد.");
      return;
    }
    try {
      // selected.amount is always 100 (per-100g canonical row), so passing
      // grams straight through gives mealFromCatalogFood the right
      // multiplier (grams / 100) without any extra conversion here.
      await onAdd?.(mealFromCatalogFood(selected, grams));
    } catch {
      return;
    }
    if (andContinue) {
      setSelected(null);
      setUnitLabel("");
      setQty("1");
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
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Apple className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{food.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      ارزش غذایی بر اساس ۱۰۰ گرم
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
                  {Math.round(Number(selected.calories) || 0).toLocaleString("fa-IR")} kcal در ۱۰۰ گرم
                </p>
              </div>

              <div className="space-y-2">
                <Label>واحد</Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={unitLabel}
                  onValueChange={(v) => v && setUnitLabel(v)}
                  className="flex-wrap justify-start"
                >
                  {units.map((u) => (
                    <ToggleGroupItem key={u.label} value={u.label} className="px-3">
                      {u.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="food-serving-qty">مقدار</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="food-serving-qty"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-24 tabular-nums"
                  />
                  <span className="text-xs text-muted-foreground">
                    ≈ {Math.round(grams).toLocaleString("fa-IR")} گرم
                  </span>
                </div>
              </div>

              {previewFacts ? (
                <NutritionFactsGrid facts={previewFacts} />
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
