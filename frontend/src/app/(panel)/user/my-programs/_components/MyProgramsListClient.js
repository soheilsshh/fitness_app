"use client";

import { useEffect, useMemo, useState } from "react";
import { FiZap } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import { computeTimeline, mapApiProgram } from "./helpers";
import FilterChips from "./FilterChips";
import Pagination from "../../_components/Pagination";
import ProgramCardLink from "./ProgramCardLink";

export default function MyProgramsListClient() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 6;

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
    return () => { cancelled = true; };
  }, []);

  const computed = useMemo(() => {
    return programs.map((p) => ({
      program: p,
      timeline: computeTimeline(p.startDate, p.durationDays, p.status, p.remainingDays),
    }));
  }, [programs]);

  const filtered = useMemo(() => {
    if (filter === "all") return computed;
    if (filter === "active") return computed.filter((x) => x.timeline.isActive);
    return computed.filter((x) => !x.timeline.isActive);
  }, [computed, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paged = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, totalPages]);

  const onChangeFilter = (next) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">برنامه‌های من</div>
          <div className="mt-1 text-sm text-zinc-300">
            برنامه‌های خریداری‌شده را فیلتر کنید و برای جزئیات، روی برنامه کلیک کنید.
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
          <FiZap className="text-emerald-300" />
          تعداد: <span className="font-bold text-white">{filtered.length}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <FilterChips value={filter} onChange={onChangeFilter} />
        <div className="text-sm text-zinc-300">
          تعداد: <span className="font-bold text-white">{filtered.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
          در حال بارگذاری...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
          برنامه‌ای برای نمایش وجود ندارد.
        </div>
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
