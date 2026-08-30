"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, Send, Share2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { api } from "@/lib/axios/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  METRIC_HOLD,
  METRIC_LABELS,
  METRIC_REPS,
  METRIC_WEIGHT,
  formatMetricValue,
  metricValue,
} from "@/lib/workout/exerciseMetric";
import { SHARE_DRAFT_KEY } from "../../community/_components/CommunityClient";

const RANGE_OPTIONS = [
  { key: "today", label: "امروز" },
  { key: "week", label: "هفته اخیر" },
  { key: "month", label: "ماه اخیر" },
  { key: "3months", label: "سه ماه اخیر" },
  { key: "year", label: "یک‌ساله" },
];

// Keep in sync with backend MuscleGroupCatalog (recordable: true).
// Used immediately so the picker is never empty if /me/exercise-categories
// fails, 404s on an older API, or returns an unexpected shape.
const MUSCLE_GROUP_OPTIONS = [
  { value: "chest", label: "سینه" },
  { value: "back", label: "زیربغل و پشت" },
  { value: "shoulders", label: "سرشانه" },
  { value: "traps", label: "کول" },
  { value: "biceps", label: "جلو بازو" },
  { value: "triceps", label: "پشت بازو" },
  { value: "forearms", label: "ساعد" },
  { value: "abs", label: "شکم و مرکز بدن" },
  { value: "quads", label: "چهارسر ران" },
  { value: "hamstrings", label: "همسترینگ" },
  { value: "glutes", label: "سرینی" },
  { value: "adductors", label: "داخل ران" },
  { value: "abductors", label: "بیرون ران" },
  { value: "calves", label: "ساق پا" },
  { value: "neck", label: "گردن" },
  { value: "fullbody", label: "تمام بدن" },
];

const CANONICAL_CODES = new Set(MUSCLE_GROUP_OPTIONS.map((o) => o.value));

function categoriesFromResponse(data) {
  const labelByCode = Object.fromEntries(MUSCLE_GROUP_OPTIONS.map((o) => [o.value, o.label]));
  // Older APIs returned DISTINCT exercises.target — machine-translated catalog
  // strings like "گوساله ها" / "آدم ربایان". Those are not picker values.
  const groups = data?.groups;
  if (Array.isArray(groups) && groups.length) {
    const mapped = groups
      .filter((g) => g?.code && CANONICAL_CODES.has(String(g.code)))
      .map((g) => ({
        value: String(g.code),
        label: g.label || labelByCode[g.code],
      }));
    if (mapped.length) return mapped;
  }
  const items = data?.items;
  if (Array.isArray(items) && items.length) {
    const mapped = items
      .filter((c) => CANONICAL_CODES.has(String(c)))
      .map((c) => ({ value: String(c), label: labelByCode[String(c)] || String(c) }));
    if (mapped.length) return mapped;
  }
  return null;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function rangeToDates(key) {
  const to = new Date();
  const from = new Date();
  switch (key) {
    case "week":
      from.setDate(from.getDate() - 7);
      break;
    case "month":
      from.setMonth(from.getMonth() - 1);
      break;
    case "3months":
      from.setMonth(from.getMonth() - 3);
      break;
    case "year":
      from.setFullYear(from.getFullYear() - 1);
      break;
    case "today":
    default:
      break;
  }
  return { from: isoDate(from), to: isoDate(to) };
}

// The progression chart plots whichever number is the record for this
// movement — kilos, reps, or seconds held — so bodyweight training charts too.
const CHART_CONFIG_BY_METRIC = {
  [METRIC_WEIGHT]: { value: { label: "وزنه (کیلوگرم)", color: "var(--chart-1)" } },
  [METRIC_REPS]: { value: { label: "تکرار", color: "var(--chart-2)" } },
  [METRIC_HOLD]: { value: { label: "زمان (ثانیه)", color: "var(--chart-3)" } },
};

function formatFaNumber(value) {
  try {
    return new Intl.NumberFormat("fa-IR").format(Number(value) || 0);
  } catch {
    return String(value ?? 0);
  }
}

function ExerciseRecordCard({ exerciseName, records }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);

  // All records in one card share an exercise but not necessarily a metric
  // (a student can hold both a weighted and a bodyweight record); the card
  // follows whichever metric the newest record uses.
  const kind = records[0]?.metricKind || METRIC_WEIGHT;
  const labels = METRIC_LABELS[kind] || METRIC_LABELS[METRIC_WEIGHT];
  const chartConfig = CHART_CONFIG_BY_METRIC[kind] || CHART_CONFIG_BY_METRIC[METRIC_WEIGHT];

  const best = records.reduce(
    (b, r) => (!b || metricValue(kind, r) > metricValue(kind, b) ? r : b),
    null
  );
  const chartData = records.map((r) => ({
    value: metricValue(kind, r),
    label: new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(
      new Date(r.achievedAt)
    ),
  }));

  function handleShare() {
    if (!best) return;
    try {
      window.sessionStorage.setItem(
        SHARE_DRAFT_KEY,
        JSON.stringify({
          content: `رکورد جدید در ${exerciseName}: ${formatMetricValue(kind, best)} 🏆`,
          category: "progress",
        })
      );
    } catch {
      // sessionStorage unavailable — user can still type the post manually
    }
    router.push("/user/community");
  }

  async function handleNotifyCoach() {
    if (!best) return;
    setSending(true);
    try {
      await api.post("/me/personal-records/notify-coach", {
        exerciseName,
        metricKind: kind,
        weightKg: best.weightKg,
        reps: best.reps,
        holdSeconds: best.holdSeconds,
      });
      toast.success("برای مربی ارسال شد");
    } catch (err) {
      toast.error(err?.response?.data?.error || "ارسال ناموفق بود");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{exerciseName}</CardTitle>
            {records[0]?.muscleGroupLabel ? (
              <Badge variant="secondary" className="text-[10px]">
                {records[0].muscleGroupLabel}
              </Badge>
            ) : null}
          </div>
          {best ? (
            <Badge
              variant="outline"
              className="gap-1 border-amber-400 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            >
              <Award className="size-3.5" />
              بهترین: {formatMetricValue(kind, best)}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {chartData.length > 1 ? (
          <ChartContainer config={chartConfig} className="h-48 w-full">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
                tickFormatter={(v) => formatFaNumber(v)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => [`${formatFaNumber(value)} ${labels.unit}`, labels.input]}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {records.map((r, i) => {
            const isBest =
              best &&
              metricValue(kind, r) === metricValue(kind, best) &&
              r.achievedAt === best.achievedAt;
            return (
              <span
                key={`${r.achievedAt}-${i}`}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs tabular-nums",
                  isBest
                    ? "border-amber-400 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "border-border bg-muted/30 text-muted-foreground"
                )}
              >
                {formatMetricValue(kind, r)}
              </span>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleShare}>
            <Share2 data-icon="inline-start" />
            اشتراک‌گذاری به‌عنوان پست
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleNotifyCoach} disabled={sending}>
            <Send data-icon="inline-start" />
            {sending ? "در حال ارسال..." : "ارسال برای مربی"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PersonalRecordsTab() {
  const [range, setRange] = useState("month");
  const [categories, setCategories] = useState(MUSCLE_GROUP_OPTIONS);
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState(null); // null = not searched yet

  useEffect(() => {
    let cancelled = false;
    api
      .get("/me/exercise-categories")
      .then((res) => {
        if (cancelled) return;
        const next = categoriesFromResponse(res.data);
        if (next?.length) setCategories(next);
      })
      .catch(() => {
        // Keep MUSCLE_GROUP_OPTIONS so the picker still works.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFetch() {
    if (!target) {
      toast.error("گروه عضلانی را انتخاب کنید");
      return;
    }
    setLoading(true);
    try {
      const { from, to } = rangeToDates(range);
      const res = await api.get("/me/personal-records", { params: { target, from, to } });
      setRecords(res.data?.items || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || "دریافت رکوردها ناموفق بود");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => {
    if (!records) return [];
    // Keyed by exercise *and* metric: a weighted pull-up record and a
    // bodyweight rep record on the same movement are separate progressions.
    const map = new Map();
    for (const r of records) {
      const key = `${r.exerciseName}|${r.metricKind || METRIC_WEIGHT}`;
      if (!map.has(key)) map.set(key, { exerciseName: r.exerciseName, records: [] });
      map.get(key).records.push(r);
    }
    return Array.from(map.entries());
  }, [records]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">جست‌وجوی رکوردها</CardTitle>
          <CardDescription>بازه زمانی و گروه عضلانی مورد نظر را انتخاب کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">بازه زمانی</p>
            <ToggleGroup
              type="single"
              value={range}
              onValueChange={(v) => v && setRange(v)}
              variant="outline"
              size="sm"
              className="flex flex-wrap justify-start gap-2"
            >
              {RANGE_OPTIONS.map((o) => (
                <ToggleGroupItem key={o.key} value={o.key}>
                  {o.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">گروه عضلانی</p>
            <Select value={target || undefined} onValueChange={setTarget}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="انتخاب کنید" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-80">
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={handleFetch} disabled={loading}>
            {loading ? "در حال دریافت..." : "دریافت رکوردها"}
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : records !== null ? (
        grouped.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              رکوردی برای این بازه و گروه عضلانی پیدا نشد.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {grouped.map(([key, group]) => (
              <ExerciseRecordCard
                key={key}
                exerciseName={group.exerciseName}
                records={group.records}
              />
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
