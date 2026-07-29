"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Apple,
  ChevronLeft,
  ChevronRight,
  Flame,
  PenLine,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { USER_FOOD_LOGS_PATH, USER_FOODS_PATH } from "@/lib/api/user";
import FoodPickerModal from "@/app/(panel)/coach/students/nutrition/_components/FoodPickerModal";
import ManualFoodModal from "@/app/(panel)/coach/students/nutrition/_components/ManualFoodModal";
import PageHeader from "@/app/(panel)/user/_components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  formatMacro,
  parseProteinTargetGrams,
  targetProgressPercent,
} from "@/lib/nutrition/display";
import {
  dateToDayKey,
  extractNutritionTargets,
  formatDateFaLong,
  formatDateISO,
  isToday,
  mealToFoodLogPayload,
  MEAL_TYPE_OPTIONS,
  startOfDay,
} from "@/lib/nutrition/foodLog";
import { toast } from "sonner";

function MacroBadge({ label, value, unit, className }) {
  if (!value || Number(value) <= 0) return null;
  return (
    <Badge variant="outline" className={cn("tabular-nums text-[11px]", className)}>
      {label}: {formatMacro(value, unit)}
    </Badge>
  );
}

function DailyProgressCard({ totals, targets, loading }) {
  const caloriesTarget = Number(targets.caloriesTarget) || 0;
  const proteinTargetG = parseProteinTargetGrams(targets.proteinTarget);
  const proteinTargetLabel = targets.proteinTarget?.trim() || "";

  const caloriesPct = targetProgressPercent(totals.calories, caloriesTarget);
  const proteinPct = targetProgressPercent(totals.protein, proteinTargetG);

  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/15 bg-gradient-to-t from-primary/5 to-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="size-4 text-orange-600 dark:text-orange-400" />
          خلاصه دریافت روزانه
        </CardTitle>
        <CardDescription>
          {caloriesTarget || proteinTargetG
            ? "مقایسه با اهداف برنامه غذایی مربی"
            : "اهداف رژیم هنوز توسط مربی تنظیم نشده است (حالت آزاد)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="کالری دریافتی"
            value={totals.calories}
            unit="کیلوکالری"
            accent="text-foreground"
          />
          <StatTile
            label="پروتئین"
            value={totals.protein}
            unit="گرم"
            accent="text-primary"
          />
          <StatTile
            label="کربوهیدرات"
            value={totals.carbs}
            unit="گرم"
            accent="text-orange-600 dark:text-orange-400"
          />
          <StatTile
            label="چربی"
            value={totals.fat}
            unit="گرم"
            accent="text-amber-600 dark:text-amber-400"
          />
        </div>

        {caloriesTarget > 0 ? (
          <ProgressRow
            label="کالری دریافتی"
            current={totals.calories}
            target={caloriesTarget}
            unit="کیلوکالری"
            percent={caloriesPct}
          />
        ) : null}

        {proteinTargetG > 0 ? (
          <ProgressRow
            label="پروتئین"
            current={totals.protein}
            target={proteinTargetG}
            unit="گرم"
            percent={proteinPct}
            targetLabel={proteinTargetLabel}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function StatTile({ label, value, unit, accent }) {
  return (
    <div className="rounded-xl border bg-card px-3 py-2.5 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-sm font-semibold tabular-nums", accent)}>
        {formatMacro(value, unit)}
      </p>
    </div>
  );
}

function ProgressRow({ label, current, target, unit, percent, targetLabel }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {formatMacro(current, unit)}
          <span className="mx-1">/</span>
          {targetLabel || formatMacro(target, unit)}
        </span>
      </div>
      <Progress value={percent ?? 0} className="h-2" />
      {percent != null ? (
        <p className="text-xs text-muted-foreground">
          {percent.toLocaleString("fa-IR")}٪ از هدف روزانه
        </p>
      ) : null}
    </div>
  );
}

function LoggedItemRow({ item, onDelete, deleting }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card px-3 py-3 sm:px-4">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/10">
        <UtensilsCrossed className="size-4 text-orange-700 dark:text-orange-300" />
      </span>
      <div className="min-w-0 flex-1 text-start">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{item.foodName}</p>
          {item.foodId ? (
            <Badge variant="secondary" className="text-[10px]">
              کاتالوگ
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">
              دستی
            </Badge>
          )}
        </div>
        {item.quantity ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{item.quantity}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <MacroBadge
            label="کالری"
            value={item.calories}
            unit="کیلوکالری"
            className="border-border/60 bg-muted/40"
          />
          <MacroBadge
            label="پروتئین"
            value={item.protein}
            unit="گرم"
            className="border-primary/25 bg-primary/5"
          />
          <MacroBadge
            label="کربوهیدرات"
            value={item.carbs}
            unit="گرم"
            className="border-orange-500/20 bg-orange-500/5"
          />
          <MacroBadge
            label="چربی"
            value={item.fat}
            unit="گرم"
            className="border-amber-500/20 bg-amber-500/5"
          />
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-muted-foreground hover:text-destructive"
        disabled={deleting}
        onClick={() => onDelete(item)}
        aria-label="حذف"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export default function FoodDiaryClient() {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [items, setItems] = useState([]);
  const [totals, setTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [targets, setTargets] = useState({ caloriesTarget: 0, proteinTarget: "" });
  const [loading, setLoading] = useState(true);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [mealType, setMealType] = useState("breakfast");

  const dateISO = useMemo(() => formatDateISO(selectedDate), [selectedDate]);
  const dayLabel = useMemo(() => formatDateFaLong(selectedDate), [selectedDate]);
  const today = isToday(selectedDate);

  const groupedItems = useMemo(() => {
    const groups = MEAL_TYPE_OPTIONS.map((opt) => ({
      ...opt,
      items: items.filter((item) => item.mealType === opt.value),
    }));
    const uncategorized = items.filter(
      (item) =>
        !item.mealType ||
        !MEAL_TYPE_OPTIONS.some((opt) => opt.value === item.mealType)
    );
    if (uncategorized.length) {
      groups.push({ value: "other", label: "سایر", items: uncategorized });
    }
    return groups.filter((g) => g.items.length > 0);
  }, [items]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(USER_FOOD_LOGS_PATH, { params: { date: dateISO } });
      const data = res.data || {};
      setItems(data.items || []);
      setTotals(
        data.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
    } catch (err) {
      setItems([]);
      setTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 });
      toast.error(err?.response?.data?.error || "بارگذاری یادداشت‌های روز ناموفق بود");
    } finally {
      setLoading(false);
    }
  }, [dateISO]);

  const loadTargets = useCallback(async () => {
    setTargetsLoading(true);
    try {
      const listRes = await api.get("/me/programs");
      const programs = listRes.data?.programs || [];
      const candidates = programs.filter(
        (p) => p.type === "nutrition" || p.type === "both"
      );
      const dayKey = dateToDayKey(selectedDate);

      for (const program of candidates) {
        try {
          const detailRes = await api.get(`/me/programs/${program.id}`);
          const detail = detailRes.data;
          const next = extractNutritionTargets(detail, dayKey);
          if (next.caloriesTarget > 0 || next.proteinTarget) {
            setTargets(next);
            return;
          }
        } catch {
          // try next program
        }
      }
      setTargets({ caloriesTarget: 0, proteinTarget: "" });
    } catch {
      setTargets({ caloriesTarget: 0, proteinTarget: "" });
    } finally {
      setTargetsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  const shiftDate = (deltaDays) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + deltaDays);
      const capped = startOfDay(next);
      const todayStart = startOfDay(new Date());
      if (capped > todayStart) return prev;
      return capped;
    });
  };

  const handleAddMeal = async (meal) => {
    setSubmitting(true);
    try {
      await api.post(
        USER_FOOD_LOGS_PATH,
        mealToFoodLogPayload(meal, dateISO, mealType)
      );
      toast.success("غذا با موفقیت ثبت شد");
      await loadLogs();
    } catch (err) {
      toast.error(err?.response?.data?.error || "ثبت غذا ناموفق بود");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`«${item.foodName}» از یادداشت امروز حذف شود؟`)) return;
    setDeletingId(item.id);
    try {
      await api.delete(`${USER_FOOD_LOGS_PATH}/${item.id}`);
      toast.success("آیتم حذف شد");
      await loadLogs();
    } catch (err) {
      toast.error(err?.response?.data?.error || "حذف ناموفق بود");
    } finally {
      setDeletingId(null);
    }
  };

  const addLabels = {
    primaryAddLabel: "ثبت در دفترچه",
    secondaryAddLabel: "ثبت و ادامه",
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="کالری‌شمار روزانه"
        description="ثبت و پایش دقیق ارزش غذایی وعده‌ها"
        meta={
          today ? (
            <Badge
              variant="outline"
              className="fitino-meta-badge fitino-meta-badge--solid px-3.5 py-2 font-iranianSansDemiBold"
            >
              امروز
            </Badge>
          ) : null
        }
      />

      <Card>
        <CardContent className="flex items-center justify-between gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => shiftDate(-1)}
            aria-label="روز قبل"
          >
            <ChevronRight className="size-4" />
          </Button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-semibold">{dayLabel}</p>
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{dateISO}</p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => shiftDate(1)}
            disabled={today}
            aria-label="روز بعد"
          >
            <ChevronLeft className="size-4" />
          </Button>
        </CardContent>
      </Card>

      <DailyProgressCard
        totals={totals}
        targets={targets}
        loading={loading || targetsLoading}
      />

      <div className="space-y-2">
        <p className="text-xs font-iranianSansMedium text-muted-foreground">
          وعده برای ثبت جدید
        </p>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              size="sm"
              variant={mealType === opt.value ? "default" : "outline"}
              onClick={() => setMealType(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="flex-1"
          onClick={() => setPickerOpen(true)}
          disabled={submitting}
        >
          <Apple data-icon="inline-start" />
          انتخاب از بانک غذاها
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => setManualOpen(true)}
          disabled={submitting}
        >
          <PenLine data-icon="inline-start" />
          ثبت دستی غذا
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">فهرست وعده‌های امروز</CardTitle>
          <CardDescription>
            {items.length
              ? `${items.length.toLocaleString("fa-IR")} مورد · تفکیک‌شده بر اساس وعده`
              : "هنوز وعده‌ای ثبت نشده است"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-10 text-center">
              <UtensilsCrossed className="mx-auto size-8 text-muted-foreground/60" />
              <p className="mt-3 text-sm font-iranianSansDemiBold text-foreground">
                امروز هنوز غذایی ثبت نکرده‌اید!
              </p>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
                برای ثبت دقیق دریافت کالری و درک بهتر از سوخت‌رسانی به بدنتان،
                اولین وعده امروز را از بانک غذاها اضافه کنید.
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-4"
                onClick={() => setPickerOpen(true)}
                disabled={submitting}
              >
                <Plus data-icon="inline-start" />
                ثبت اولین وعده غذایی
              </Button>
            </div>
          ) : (
            groupedItems.map((group) => (
              <div key={group.value} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-iranianSansDemiBold text-foreground">
                    {group.label}
                  </p>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {group.items.length.toLocaleString("fa-IR")} مورد
                  </span>
                </div>
                {group.items.map((item) => (
                  <LoggedItemRow
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    deleting={deletingId === item.id}
                  />
                ))}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <FoodPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={handleAddMeal}
        dayLabel={dayLabel}
        foodsPath={USER_FOODS_PATH}
        {...addLabels}
      />

      <ManualFoodModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onAdd={handleAddMeal}
        dayLabel={dayLabel}
        {...addLabels}
      />
    </div>
  );
}
