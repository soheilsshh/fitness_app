"use client";

import { useMemo } from "react";
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
  title = "نمودار تغییرات وزن",
  description = "بر اساس ثبت‌های پایش دو هفته‌ای",
  compact = false,
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

  if (loading) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
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
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            هنوز وزنی ثبت نشده است.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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
