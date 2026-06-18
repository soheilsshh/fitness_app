"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";

function formatNumber(v) {
  try {
    return new Intl.NumberFormat("fa-IR").format(Number(v) || 0);
  } catch {
    return String(v ?? 0);
  }
}

export default function PlanDetailsClient({ id }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/admin/plans/${id}`);
        if (!cancelled) setPlan(res.data);
      } catch {
        if (!cancelled) setPlan(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle>در حال بارگذاری...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card dir="rtl">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          پلن پیدا نشد.
        </CardContent>
      </Card>
    );
  }

  const price = Number(plan.price || 0);
  const discountPrice = Number(plan.discountPrice || 0);
  const finalPrice = discountPrice > 0 ? discountPrice : price;

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/plans" className="inline-flex items-center gap-2">
              <ChevronLeft className="size-4" />
              بازگشت
            </Link>
          </Button>
          <h1 className="text-lg font-extrabold">جزئیات پلن (فقط مشاهده)</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>تیتر</CardDescription>
          <CardTitle className="truncate text-xl">{plan.title || "—"}</CardTitle>
          <CardDescription>{plan.subtitle || "—"}</CardDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline" className="h-auto rounded-full px-3 py-1 text-[11px]">
              نام دوره: <span className="mr-1 font-bold">{plan.courseName || "—"}</span>
            </Badge>
            {plan.isPopular ? (
              <Badge className="h-auto rounded-full bg-amber-500/10 px-3 py-1 font-bold text-amber-700 dark:text-amber-300">
                محبوب
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <Card className="bg-muted/20">
            <CardContent className="pt-4 text-[11px] text-muted-foreground">
              <div>
                شناسه پلن: <span className="font-bold text-foreground">{plan.id}</span>
              </div>
              <div className="mt-2">
                مربی:{" "}
                <span className="font-bold text-foreground">
                  {plan.coachName || (plan.coachId ? `#${plan.coachId}` : "—")}
                </span>
              </div>
              <div className="mt-2">
                قیمت: <span className="font-bold text-foreground">{formatNumber(finalPrice)} تومان</span>
              </div>
              {plan.updatedAt ? (
                <div className="mt-2">
                  آخرین بروزرسانی:
                  <div className="mt-1 text-foreground">
                    {new Date(plan.updatedAt).toLocaleString("fa-IR")}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {plan.featuresText ? (
            <Card className="mt-6 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-sm">ویژگی‌ها</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
                {plan.featuresText}
              </CardContent>
            </Card>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
