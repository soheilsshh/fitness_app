"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function faNum(value) {
  return new Intl.NumberFormat("fa-IR").format(value ?? 0);
}

export default function CoachTemplateDetailClient() {
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
        const res = await api.get(`/coach/workout-templates/${id}`);
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

  const byDay = useMemo(() => {
    const map = new Map();
    for (const item of data?.items || []) {
      const day = item.dayNumber || 1;
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(item);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [data]);

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
            مشاهده تمپلیت تمرین آماده
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/coach/templates">
            <ChevronLeft className="size-4" />
            بازگشت
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">مشخصات</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.gender ? <Badge variant="outline">{data.gender}</Badge> : null}
          {data.level ? <Badge variant="outline">{data.level}</Badge> : null}
          {data.target ? <Badge variant="outline">{data.target}</Badge> : null}
          {data.location ? <Badge variant="outline">{data.location}</Badge> : null}
          <Badge variant="secondary">{faNum(data.dayCount)} روز</Badge>
          <Badge variant="secondary">{faNum(data.itemCount)} حرکت</Badge>
        </CardContent>
      </Card>

      {byDay.map(([day, items]) => (
        <Card key={day}>
          <CardHeader>
            <CardTitle className="text-base">روز {faNum(day)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((it, idx) => {
              const media = apiAssetUrl(it.gifUrl || it.imageUrl);
              return (
                <div
                  key={`${day}-${idx}`}
                  className="flex flex-wrap items-start gap-3 rounded-lg border p-3"
                >
                  {media ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={media}
                      alt={it.exercise}
                      className="size-16 rounded object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{it.exercise}</p>
                    {it.setsDetails?.length ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {it.setsDetails
                          .map((s) => `ست ${s.setNumber}: ${s.reps}${s.isAmrap ? " AMRAP" : ""}`)
                          .join(" · ")}
                      </p>
                    ) : null}
                    {it.notes ? (
                      <p className="mt-1 text-xs text-muted-foreground">{it.notes}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
