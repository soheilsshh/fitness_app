"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LineChart } from "lucide-react";
import { api } from "@/lib/axios/client";
import TrackingAlerts from "@/components/tracking/TrackingAlerts";
import WeightChart from "@/components/tracking/WeightChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserDashboardClient() {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/me/tracking");
        if (!cancelled) setTracking(res.data);
      } catch {
        if (!cancelled) setTracking(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="text-start">
          <h2 className="text-lg font-semibold tracking-tight">داشبورد</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            خلاصه وضعیت پایش و تغییرات وزن
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/user/tracking">
            <LineChart className="size-4" />
            پایش کامل
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-20 w-full rounded-xl" />
      ) : tracking?.alerts?.length ? (
        <TrackingAlerts alerts={tracking.alerts} />
      ) : tracking ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            وضعیت پایش شما به‌روز است.
          </CardContent>
        </Card>
      ) : null}

      <WeightChart
        data={tracking?.weightHistory || []}
        loading={loading}
        compact
        description="آخرین ثبت‌های وزن در پایش دو هفته‌ای"
      />
    </div>
  );
}
