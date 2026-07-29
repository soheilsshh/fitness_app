"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  weight: {
    label: "وزن (کیلوگرم)",
    color: "var(--chart-1)",
  },
};

function formatFaNumber(value) {
  try {
    return new Intl.NumberFormat("fa-IR").format(Number(value) || 0);
  } catch {
    return String(value ?? 0);
  }
}

export default function WeightChart({
  data = [],
  loading = false,
  title = "نمودار روند تغییرات وزن",
  description = "پایش هوشمند وزن و تحلیل پیشرفت ۳۰ روزه",
  compact = false,
  actionHref,
  actionLabel,
  emptyText = "هنوز داده‌ای برای رسم نمودار وجود ندارد. با ثبت وزن امروز، اولین نقطه پیشرفت خود را ثبت کنید!",
  emptyActionHref,
  emptyActionLabel,
}) {
  const chartData = useMemo(
    () =>
      (data || []).map((row) => ({
        date: row.date,
        weight: Number(row.weight) || 0,
        label: formatChartDate(row.date),
      })),
    [data]
  );

  const headerAction =
    actionHref && actionLabel ? (
      <Button variant="ghost" size="sm" asChild>
        <Link href={actionHref}>
          {actionLabel}
          <Plus className="size-3.5" data-icon="inline-end" />
        </Link>
      </Button>
    ) : null;

  if (loading) {
    return (
      <Card dir="rtl">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          {headerAction}
        </CardHeader>
        <CardContent>
          <Skeleton className={compact ? "h-48 w-full rounded-xl" : "h-64 w-full rounded-xl"} />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card dir="rtl">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1.5 text-start">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {headerAction}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2.5 py-8 text-center">
            <p className="max-w-md text-sm text-muted-foreground">{emptyText}</p>
            {emptyActionHref && emptyActionLabel ? (
              <Button asChild size="sm" className="mt-1">
                <Link href={emptyActionHref}>{emptyActionLabel}</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir="rtl">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5 text-start">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {headerAction}
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        <ChartContainer config={chartConfig} className={compact ? "h-48 w-full" : "h-64 w-full"}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
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
                  formatter={(value) => [`${formatFaNumber(value)} کیلوگرم`, "وزن"]}
                />
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
      </CardContent>
    </Card>
  );
}

function formatChartDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
}
