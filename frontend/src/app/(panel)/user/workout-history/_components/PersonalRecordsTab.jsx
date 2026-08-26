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
import { SHARE_DRAFT_KEY } from "../../community/_components/CommunityClient";

const RANGE_OPTIONS = [
  { key: "today", label: "امروز" },
  { key: "week", label: "هفته اخیر" },
  { key: "month", label: "ماه اخیر" },
  { key: "3months", label: "سه ماه اخیر" },
  { key: "year", label: "یک‌ساله" },
];

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

const chartConfig = { weight: { label: "وزنه (کیلوگرم)", color: "var(--chart-1)" } };

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

  const best = records.reduce(
    (b, r) => (!b || r.weightKg > b.weightKg ? r : b),
    null
  );
  const chartData = records.map((r) => ({
    weight: r.weightKg,
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
          content: `رکورد جدید در ${exerciseName}: ${best.weightKg}kg × ${best.reps} 🏆`,
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
        weightKg: best.weightKg,
        reps: best.reps,
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
          <CardTitle className="text-base">{exerciseName}</CardTitle>
          {best ? (
            <Badge
              variant="outline"
              className="gap-1 border-amber-400 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            >
              <Award className="size-3.5" />
              بهترین: {best.weightKg.toLocaleString("fa-IR")}kg ×{" "}
              {best.reps.toLocaleString("fa-IR")}
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
                  <ChartTooltipContent formatter={(value) => [`${formatFaNumber(value)} کیلوگرم`, "وزنه"]} />
                }
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="var(--color-weight)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {records.map((r, i) => {
            const isBest = best && r.weightKg === best.weightKg && r.achievedAt === best.achievedAt;
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
                {r.weightKg.toLocaleString("fa-IR")}kg × {r.reps.toLocaleString("fa-IR")}
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
  const [categories, setCategories] = useState([]);
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState(null); // null = not searched yet

  useEffect(() => {
    let cancelled = false;
    api
      .get("/me/exercise-categories")
      .then((res) => {
        if (!cancelled) setCategories(res.data?.items || []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
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
    const map = new Map();
    for (const r of records) {
      if (!map.has(r.exerciseName)) map.set(r.exerciseName, []);
      map.get(r.exerciseName).push(r);
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
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
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
            {grouped.map(([name, recs]) => (
              <ExerciseRecordCard key={name} exerciseName={name} records={recs} />
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
