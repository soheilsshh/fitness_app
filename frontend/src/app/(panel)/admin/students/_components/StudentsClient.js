"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, UserCheck } from "lucide-react";
import { api } from "@/lib/axios/client";
import PanelPagination from "@/app/(panel)/_shared/Pagination";
import FilterChip from "@/app/(panel)/admin/plans/_components/FilterChip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function StudentsClient() {
  const [filter, setFilter] = useState("pending");
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/admin/students", {
          params: { page, pageSize, status: filter, query: q },
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
  }, [filter, q, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="text-start">
          <h2 className="text-lg font-semibold tracking-tight">همه شاگردان</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            مشاهده همه دانشجویان پلتفرم (فقط خواندنی)
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
          <UserCheck className="size-3.5 text-primary" />
          تعداد:
          <span className="font-semibold tabular-nums text-foreground">
            {total.toLocaleString("fa-IR")}
          </span>
        </Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={filter === "pending"}
              onClick={() => {
                setFilter("pending");
                setPage(1);
              }}
            >
              در انتظار
            </FilterChip>
            <FilterChip
              active={filter === "active"}
              onClick={() => {
                setFilter("active");
                setPage(1);
              }}
            >
              فعال
            </FilterChip>
          </div>
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="جستجو (نام/موبایل/پلن)..."
            className="md:max-w-md"
          />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-16 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              موردی یافت نشد.
            </CardContent>
          </Card>
        ) : (
          items.map((s) => (
            <Link
              key={s.id}
              href={`/admin/students/${s.id}`}
              className="block"
            >
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <div className="min-w-0 text-start">
                    <p className="truncate text-sm font-semibold">{s.fullName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{s.phone}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      مربی:{" "}
                      <span className="font-medium text-foreground">
                        {s.coachName || "—"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      پلن:{" "}
                      <span className="font-medium text-foreground">
                        {s.planTitle || "—"}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        s.status === "active"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : undefined
                      )}
                    >
                      {s.status === "active" ? "فعال" : "در انتظار"}
                    </Badge>
                    <Badge variant="secondary">
                      {s.planType === "both"
                        ? "تمرین + تغذیه"
                        : s.planType === "workout"
                          ? "تمرین"
                          : "تغذیه"}
                    </Badge>
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
