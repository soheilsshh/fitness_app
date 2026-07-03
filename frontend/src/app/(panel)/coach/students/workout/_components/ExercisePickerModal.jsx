"use client";

import { useEffect, useState } from "react";
import { Dumbbell, Search } from "lucide-react";
import { api } from "@/lib/axios/client";
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
import { newExerciseEntry } from "../../_components/exerciseHelpers";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.fitinoo.ir";

function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

export default function ExercisePickerModal({ open, onClose, onAdd, dayLabel }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("12");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api.get("/coach/exercises/categories")
      .then((res) => {
        if (!cancelled) setCategories(res.data?.categories || []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setCategory("");
      setItems([]);
      setSelected(null);
      setSets("3");
      setReps("12");
      setError("");
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/coach/exercises", {
          params: {
            query: query.trim() || undefined,
            category: category || undefined,
            pageSize: 48,
          },
        });
        if (!cancelled) setItems(res.data?.items || []);
      } catch (err) {
        if (!cancelled) {
          setItems([]);
          setError(
            err?.response?.data?.error || "بارگذاری حرکات ناموفق بود."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, query.trim() ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, category]);

  const resetSelection = () => {
    setSelected(null);
    setSets("3");
    setReps("12");
  };

  const handleAdd = (andContinue) => {
    if (!selected) return;
    onAdd?.(
      newExerciseEntry({
        exerciseId: selected.id,
        name: selected.name,
        imageUrl: selected.imageUrl || "",
        sets,
        reps,
      })
    );
    if (andContinue) {
      resetSelection();
    } else {
      onClose?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent
        className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p- sm:max-w-3xl"
        dir="rtl"
      >
        <DialogHeader className="border-b px-5 py-4 text-start">
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="size-4 text-primary" />
            انتخاب حرکت
          </DialogTitle>
          {dayLabel ? (
            <DialogDescription>برنامه {dayLabel}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="space-y-3 border-b px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی نام حرکت..."
              className="pe-9"
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={!category} onClick={() => setCategory("")}>
              همه
            </FilterChip>
            {categories.map((cat) => (
              <FilterChip
                key={cat}
                active={category === cat}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              حرکتی یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setSelected(ex)}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-xl border text-start transition",
                    selected?.id === ex.id
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border bg-card hover:bg-muted/50"
                  )}
                >
                  <div className="aspect-square w-full bg-muted">
                    {ex.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(ex.imageUrl)}
                        alt={ex.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                        بدون تصویر
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-2.5">
                    <div className="line-clamp-2 text-xs font-semibold">
                      {ex.name}
                    </div>
                    {ex.category ? (
                      <Badge variant="outline" className="max-w-full truncate text-[10px]">
                        {ex.category}
                      </Badge>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected ? (
          <DialogFooter className="flex-col gap-0 border-t bg-muted/30 p-0 sm:flex-col sm:justify-start">
            <div className="w-full px-5 py-4">
              <div className="flex items-center gap-3">
                {selected.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(selected.imageUrl)}
                    alt={selected.name}
                    className="size-16 shrink-0 rounded-xl object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="truncate text-sm font-semibold">{selected.name}</div>
                  <div className="flex flex-wrap gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="exercise-sets">تعداد ست</Label>
                      <Input
                        id="exercise-sets"
                        type="number"
                        min="1"
                        value={sets}
                        onChange={(e) => setSets(e.target.value)}
                        className="w-20 tabular-nums"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="exercise-reps">تکرار</Label>
                      <Input
                        id="exercise-reps"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        placeholder="۱۲"
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleAdd(true)}
                >
                  افزودن و ادامه
                </Button>
                <Button type="button" className="flex-1" onClick={() => handleAdd(false)}>
                  افزودن حرکت
                </Button>
              </div>
            </div>
          </DialogFooter>
        ) : (
          <div className="border-t px-5 py-3 text-center text-xs text-muted-foreground">
            یک حرکت را انتخاب کنید، سپس ست و تکرار را مشخص کنید
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FilterChip({ active, children, onClick }) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      className="h-7 text-xs"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
