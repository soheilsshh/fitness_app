"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/axios/client";
import PhotoCompareBox from "@/components/tracking/PhotoCompareBox";
import TrackingAlerts from "@/components/tracking/TrackingAlerts";
import WeightChart from "@/components/tracking/WeightChart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoachStudentTrackingClient() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/coach/tracking/students/${studentId}`);
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (loading) {
    return (
      <div className="space-y-4" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-sm text-muted-foreground" dir="rtl">
        اطلاعات پایش یافت نشد.
      </div>
    );
  }

  const tracking = data.tracking || {};
  const photoMap = Object.fromEntries(
    (tracking.photoHistories || []).map((h) => [h.type, h.photos || []])
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/coach/tracking">
            <ArrowRight className="size-4" />
            بازگشت به لیست
          </Link>
        </Button>
        <div className="text-start">
          <h2 className="text-lg font-semibold tracking-tight">{data.fullName}</h2>
          <p className="text-sm text-muted-foreground">{data.phone}</p>
        </div>
      </div>

      <TrackingAlerts alerts={tracking.alerts} title="هشدار پایش دانشجو" />

      <div className="grid gap-4 md:grid-cols-3">
        <PhotoCompareBox label="جلو" photos={photoMap.front || []} />
        <PhotoCompareBox label="پشت" photos={photoMap.back || []} />
        <PhotoCompareBox label="بغل" photos={photoMap.side || []} />
      </div>

      <WeightChart data={tracking.weightHistory || []} />
    </div>
  );
}
