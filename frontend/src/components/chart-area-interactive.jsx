"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  sales: {
    label: "فروش",
    color: "var(--chart-1)",
  },
  courses: {
    label: "تعداد خرید",
    color: "var(--chart-2)",
  },
};

function formatFaNumber(value) {
  try {
    return new Intl.NumberFormat("fa-IR").format(Number(value) || 0);
  } catch {
    return String(value ?? 0);
  }
}

function ChartSkeleton() {
  return (
    <Card className="@container/card" dir="rtl">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <Skeleton className="aspect-auto h-[280px] w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

export function ChartAreaInteractive({
  data = [],
  loading = false,
  year,
  years = [],
  onYearChange,
  title = "فروش دوره‌ها در ماه‌های سال",
  description,
}) {
  const totals = React.useMemo(() => {
    return (data || []).reduce(
      (acc, row) => ({
        sales: acc.sales + (Number(row.sales) || 0),
        courses: acc.courses + (Number(row.courses) || 0),
      }),
      { sales: 0, courses: 0 }
    );
  }, [data]);

  if (loading) {
    return <ChartSkeleton />;
  }

  const resolvedDescription =
    description ||
    `مجموع فروش: ${formatFaNumber(totals.sales)} · مجموع خرید: ${formatFaNumber(totals.courses)}`;

  return (
    <Card className="@container/card" dir="rtl">
      <CardHeader className="text-start">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{resolvedDescription}</CardDescription>
        {years.length > 0 && onYearChange ? (
          <CardAction>
            <Select
              value={String(year)}
              onValueChange={(value) => onYearChange(Number(value))}
            >
              <SelectTrigger
                className="w-32"
                size="sm"
                aria-label="انتخاب سال"
              >
                <SelectValue placeholder="سال" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {formatFaNumber(y)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {!data?.length ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            داده‌ای برای نمایش وجود ندارد.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[280px] w-full"
          >
            <AreaChart
              data={data}
              margin={{ top: 12, right: 12, left: 12, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-sales)"
                    stopOpacity={0.9}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-sales)"
                    stopOpacity={0.08}
                  />
                </linearGradient>
                <linearGradient id="fillCourses" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-courses)"
                    stopOpacity={0.75}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-courses)"
                    stopOpacity={0.06}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} />

              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                reversed
                interval={0}
                tick={{ fontSize: 11 }}
              />

              <YAxis
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={56}
                tickMargin={8}
                tickFormatter={(value) => formatFaNumber(value)}
                tick={{ fontSize: 11 }}
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    className="text-start"
                    indicator="dot"
                    labelFormatter={(label) => label}
                    formatter={(value) => formatFaNumber(value)}
                  />
                }
              />

              <Area
                dataKey="sales"
                name="sales"
                type="monotone"
                fill="url(#fillSales)"
                stroke="var(--color-sales)"
                strokeWidth={2}
              />
              <Area
                dataKey="courses"
                name="courses"
                type="monotone"
                fill="url(#fillCourses)"
                stroke="var(--color-courses)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
