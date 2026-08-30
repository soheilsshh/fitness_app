"use client";

import { useEffect, useState } from "react";
import { Apple, Loader2, Plus, Search, UtensilsCrossed } from "lucide-react";
import { api } from "@/lib/axios/client";
import { USER_FOODS_PATH } from "@/lib/api/user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeDraftServing, draftFromCatalogFood } from "@/lib/nutrition/voiceReview";
import VoiceQuantityFields from "./VoiceQuantityFields";

function formatKcal(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "۰";
  return Math.round(v).toLocaleString("fa-IR");
}

export default function VoiceMissedFoodPanel({ foodsPath, existingNames, onAdd }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState(null);
  const [draft, setDraft] = useState(null);

  const endpoint = foodsPath || USER_FOODS_PATH;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setError("");
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(endpoint, {
          params: { query: q, page: 1, limit: 8 },
        });
        if (cancelled) return;
        setResults(res.data?.items || []);
      } catch (err) {
        if (cancelled) return;
        setResults([]);
        setError(err?.response?.data?.error || "جستجوی غذا ناموفق بود");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, endpoint]);

  const handlePick = (food) => {
    const next = draftFromCatalogFood(food, `missed-${food.id}`);
    setPicked(food);
    setDraft(next);
    setError("");
  };

  const serving = draft ? computeDraftServing(draft) : { ok: false };
  const alreadyListed = existingNames?.has(picked?.name);

  const handleAdd = () => {
    if (!draft || !serving.ok) {
      setError("مقدار و واحد را از دیتابیس کامل کنید");
      return;
    }
    onAdd?.(draft);
    setQuery("");
    setResults([]);
    setPicked(null);
    setDraft(null);
    setError("");
  };

  return (
    <section className="space-y-3 rounded-xl border border-dashed bg-muted/20 p-3 text-start">
      <div className="flex items-start gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UtensilsCrossed className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-iranianSansDemiBold">غذایی از قلم افتاد؟</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            نام را بنویسید، از دیتابیس انتخاب کنید، بعد واحد و مقدار را وارد کنید.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="voice-missed-food-search">نام غذا</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="voice-missed-food-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPicked(null);
              setDraft(null);
            }}
            autoComplete="off"
            className="h-11 min-h-11 pe-9"
          />
        </div>
      </div>

      {query.trim().length > 0 && query.trim().length < 2 ? (
        <p className="text-xs text-muted-foreground">حداقل دو حرف بنویسید تا پیشنهادها بیاید.</p>
      ) : null}

      {query.trim().length >= 2 && !picked ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              در حال جستجو...
            </div>
          ) : error ? (
            <p className="px-3 py-3 text-sm text-destructive">{error}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              غذایی با این نام پیدا نشد. املا را عوض کنید یا نام کوتاه‌تری بنویسید.
            </p>
          ) : (
            <ul className="max-h-48 divide-y overflow-y-auto">
              {results.map((food) => (
                <li key={food.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(food)}
                    className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-start transition-colors duration-200 hover:bg-muted/60"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Apple className="size-4 text-muted-foreground" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{food.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        در ۱۰۰ گرم
                      </span>
                    </span>
                    <Badge variant="secondary" className="shrink-0 tabular-nums">
                      {formatKcal(food.calories)} کالری
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {draft && picked ? (
        <div className="space-y-3 rounded-xl border bg-card p-3">
          <div>
            <p className="text-sm font-iranianSansDemiBold">{picked.name}</p>
            {alreadyListed ? (
              <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300">
                این غذا در لیست بالاست؛ اگر دوباره خورده‌اید، مقدار جداگانه اضافه کنید.
              </p>
            ) : (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {formatKcal(picked.calories)} کالری در ۱۰۰ گرم
              </p>
            )}
          </div>
          <VoiceQuantityFields
            idPrefix="voice-missed"
            foodName={picked.name}
            qty={draft.qty}
            unit={draft.unit}
            units={draft.units}
            onQtyChange={(qty) => setDraft((prev) => (prev ? { ...prev, qty } : prev))}
            onUnitChange={(unit) => setDraft((prev) => (prev ? { ...prev, unit } : prev))}
          />
          {serving.ok ? (
            <p className="text-xs tabular-nums text-muted-foreground">
              ≈ {Math.round(serving.grams).toLocaleString("fa-IR")} گرم ·{" "}
              {formatKcal(serving.calories)} کالری
            </p>
          ) : (
            <p className="text-xs text-destructive">مقدار باید بزرگ‌تر از صفر باشد و واحد انتخاب شود.</p>
          )}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <Button
            type="button"
            className="h-11 min-h-11 w-full cursor-pointer"
            disabled={!serving.ok}
            onClick={handleAdd}
          >
            <Plus className="size-4" data-icon="inline-start" />
            افزودن به لیست بررسی
          </Button>
        </div>
      ) : null}
    </section>
  );
}
