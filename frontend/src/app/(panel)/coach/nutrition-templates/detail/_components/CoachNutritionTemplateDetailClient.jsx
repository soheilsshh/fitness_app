"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { api } from "@/lib/axios/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function faNum(value) {
  return new Intl.NumberFormat("fa-IR").format(value ?? 0);
}

export default function CoachNutritionTemplateDetailClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/coach/nutrition-templates/${id}`);
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
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-3" dir="rtl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card dir="rtl">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          تمپلیت پیدا نشد.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{data.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مشاهده تمپلیت تغذیه آماده
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/coach/nutrition-templates">
            <ChevronLeft className="size-4" />
            بازگشت
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">مشخصات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {data.gender ? <Badge variant="outline">{data.gender}</Badge> : null}
            {data.target ? <Badge variant="outline">{data.target}</Badge> : null}
            {data.limitation ? (
              <Badge variant="outline">{data.limitation}</Badge>
            ) : null}
            <Badge variant="secondary">{faNum(data.calorie)} کالری</Badge>
            <Badge variant="secondary">{faNum(data.mealCount)} وعده</Badge>
          </div>
          {data.description ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {data.description}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {(data.meals || []).map((meal, mealIndex) => (
        <Card key={mealIndex}>
          <CardHeader>
            <CardTitle className="text-base">
              {meal.mealName || `وعده ${faNum(mealIndex + 1)}`}
              {meal.mealCalorie
                ? ` — ${faNum(meal.mealCalorie)} کالری`
                : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(meal.items || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">آیتمی ثبت نشده.</p>
            ) : (
              meal.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div>
                    {item.menuName ? (
                      <span className="text-muted-foreground">
                        {item.menuName} —{" "}
                      </span>
                    ) : null}
                    <span className="font-medium">{item.foodName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.value ? faNum(item.value) : ""}{" "}
                    {item.unit || ""}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
