"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Search } from "lucide-react";
import { api } from "@/lib/axios/client";
import PlansTable from "@/app/(panel)/admin/plans/_components/PlansTable";
import FilterChip from "@/app/(panel)/admin/plans/_components/FilterChip";
import Pagination from "@/app/(panel)/admin/plans/_components/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 8;

export default function CoachPlansClient() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/coach/plans", {
          params: { page, pageSize: PAGE_SIZE, query, tag },
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
  }, [page, query, tag, refreshKey]);

  async function handleDelete(id) {
    await api.delete(`/coach/plans/${id}`);
    setRefreshKey((k) => k + 1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="text-start">
          <h2 className="text-lg font-semibold tracking-tight">پلن‌های من</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            پلن‌های فروش خود را مدیریت کنید
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
            <ClipboardList className="size-3.5 text-primary" />
            تعداد:
            <span className="font-semibold tabular-nums text-foreground">
              {total.toLocaleString("fa-IR")}
            </span>
          </Badge>
          <Button asChild>
            <Link href="/coach/plans/new">
              <Plus data-icon="inline-start" />
              ساخت پلن
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="جستجو..."
              className="ps-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={tag === "all"} onClick={() => { setTag("all"); setPage(1); }}>
              همه
            </FilterChip>
            <FilterChip
              active={tag === "discounted"}
              onClick={() => { setTag("discounted"); setPage(1); }}
            >
              تخفیف‌دار
            </FilterChip>
            <FilterChip
              active={tag === "popular"}
              onClick={() => { setTag("popular"); setPage(1); }}
            >
              محبوب
            </FilterChip>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-md" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              پلنی یافت نشد.
            </p>
          ) : (
            <PlansTable
              items={items}
              basePath="/coach/plans"
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
