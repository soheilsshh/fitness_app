"use client";

import { useEffect, useMemo, useState } from "react";
import { Dumbbell, Zap } from "lucide-react";
import { api } from "@/lib/axios/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import MetaBadge from "../../_components/ui/MetaBadge";
import PageHeader from "../../_components/ui/PageHeader";
import PanelEmptyState from "../../_components/ui/PanelEmptyState";
import { computeTimeline, mapApiProgram } from "./helpers";
import FilterChips from "./FilterChips";
import Pagination from "../../_components/Pagination";
import ProgramCardLink from "./ProgramCardLink";

const PAGE_SIZE = 6;

function ProgramCardSkeleton() {
  return (
    <Card className="h-full bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card">
      <div className="flex flex-col gap-4 px-(--card-spacing) py-(--card-spacing)">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

export default function MyProgramsListClient() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/me/programs");
        if (!cancelled) {
          setPrograms((res.data?.programs || []).map(mapApiProgram));
        }
      } catch {
        if (!cancelled) setPrograms([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const computed = useMemo(() => {
    return programs.map((p) => ({
      program: p,
      timeline: computeTimeline(
        p.startDate,
        p.durationDays,
        p.status,
        p.remainingDays
      ),
    }));
  }, [programs]);

  const filtered = useMemo(() => {
    if (filter === "all") return computed;
    if (filter === "active") return computed.filter((x) => x.timeline.isActive);
    return computed.filter((x) => !x.timeline.isActive);
  }, [computed, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const paged = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page, totalPages]);

  const onChangeFilter = (next) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="برنامه‌های من"
        description="برنامه‌های خریداری‌شده را فیلتر کنید و برای جزئیات، روی برنامه کلیک کنید."
        meta={
          <MetaBadge
            icon={Zap}
            label="تعداد:"
            value={filtered.length.toLocaleString("fa-IR")}
          />
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <FilterChips value={filter} onChange={onChangeFilter} />
          <p className="text-sm font-iranianSansMedium text-muted-foreground">
            نمایش:{" "}
            <span className="font-iranianSansDemiBold tabular-nums text-foreground">
              {filtered.length.toLocaleString("fa-IR")}
            </span>
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <ProgramCardSkeleton key={index} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <PanelEmptyState
          icon={Dumbbell}
          title="برنامه‌ای برای نمایش وجود ندارد"
          description="با خرید یا فعال‌سازی برنامه، فهرست اینجا نمایش داده می‌شود."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.map(({ program, timeline }) => (
            <div key={program.id} className="h-full">
              <ProgramCardLink program={program} timeline={timeline} />
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
