"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Zap } from "lucide-react";
import { api } from "@/lib/axios/client";
import HealthStatusCard from "@/components/health/HealthStatusCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import MetaBadge from "../../_components/ui/MetaBadge";
import PageHeader from "../../_components/ui/PageHeader";
import PanelEmptyState from "../../_components/ui/PanelEmptyState";
import ProgramOffer from "../../_components/ProgramOffer";
import { computeTimeline, mapApiProgram } from "./helpers";
import FilterChips from "./FilterChips";
import Pagination from "@/app/(panel)/_shared/Pagination";
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
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [programsRes, profileRes] = await Promise.all([
        api.get("/me/programs"),
        api.get("/me"),
      ]);
      setPrograms((programsRes.data?.programs || []).map(mapApiProgram));
      const profile = profileRes.data || {};
      setHealth({
        bmi: profile.bmi ?? null,
        bmiStatus: profile.bmiStatus || "",
        weightKg: profile.weightKg ?? null,
        heightCm: profile.heightCm ?? null,
        age: profile.age ?? null,
      });
    } catch {
      setPrograms([]);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
        description="این‌جا پلن‌هایی است که از مربی خریده‌اید. برای دیدن تمرین و تغذیه، روی کارت بزنید «مشاهده برنامه»."
        meta={
          <MetaBadge
            icon={Zap}
            label="تعداد:"
            value={filtered.length.toLocaleString("fa-IR")}
          />
        }
      />

      {health ? (
        <HealthStatusCard
          bmi={health.bmi}
          bmiStatus={health.bmiStatus}
          weightKg={health.weightKg}
          heightCm={health.heightCm}
          age={health.age}
        />
      ) : null}

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
          className="px-4 py-8 sm:px-6"
          title="هنوز برنامه‌ای در این لیست نیست"
          description="برنامه هوش مصنوعی کارت جدا نمی‌سازد. اول باید یک پلن از مربی بخرید؛ بعد برنامه AI داخل همان کارت ذخیره می‌شود."
        >
          <ProgramOffer />
        </PanelEmptyState>
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
