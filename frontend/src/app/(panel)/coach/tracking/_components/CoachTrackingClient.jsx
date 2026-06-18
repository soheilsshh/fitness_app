"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, Users } from "lucide-react";
import { api } from "@/lib/axios/client";
import PanelPagination from "@/app/(panel)/_shared/Pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function CoachTrackingClient() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/coach/tracking/students", {
          params: { page, pageSize: PAGE_SIZE, query: q },
        });
        if (cancelled) return;
        setItems(res.data?.items || []);
        setTotal(res.data?.total || 0);
      } catch {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [q, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="text-start">
          <h2 className="text-lg font-semibold tracking-tight">پایش دانشجوها</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            وضعیت ثبت وزن و عکس‌های پایش دو هفته‌ای
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
          <Users className="size-3.5 text-primary" />
          تعداد:
          <span className="font-semibold tabular-nums text-foreground">
            {total.toLocaleString("fa-IR")}
          </span>
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="جستجو (نام/موبایل)..."
          />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              موردی یافت نشد.
            </CardContent>
          </Card>
        ) : (
          items.map((student) => (
            <Link
              key={student.id}
              href={`/coach/tracking/${student.id}`}
              className="block"
            >
              <Card
                className={cn(
                  "transition-colors hover:bg-muted/40",
                  student.maxOverdueDays > 0 && "border-amber-500/40"
                )}
              >
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <div className="min-w-0 text-start">
                    <p className="truncate text-sm font-semibold">{student.fullName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{student.phone}</p>
                    {student.alerts?.length > 0 && (
                      <p className="mt-2 flex items-start gap-1 text-xs text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                        {student.alerts[0].message}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {student.maxOverdueDays > 0 ? (
                      <Badge variant="destructive" className="bg-amber-600">
                        {student.maxOverdueDays.toLocaleString("fa-IR")} روز تأخیر
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      >
                        به‌روز
                      </Badge>
                    )}
                  </div>
                  <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <PanelPagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
