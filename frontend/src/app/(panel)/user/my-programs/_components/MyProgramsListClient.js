"use client";

import { useMemo, useState } from "react";
import { FiZap } from "react-icons/fi";
import { mockPrograms } from "./mock";
import { computeTimeline } from "./helpers";
import FilterChips from "./FilterChips";
import Pagination from "../../_components/Pagination";
import ProgramCardLink from "./ProgramCardLink";

export default function MyProgramsListClient() {
  const [filter, setFilter] = useState("all"); // all | active | inactive
  const [page, setPage] = useState(1);

  const pageSize = 6;

  const computed = useMemo(() => {
    return mockPrograms.map((p) => ({
      program: p,
      timeline: computeTimeline(p.startDate, p.durationDays),
    }));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return computed;

    if (filter === "active") {
      return computed.filter((x) => x.timeline.isActive);
    }

    // inactive = not active (includes expired + not started)
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
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">برنامه‌های من</div>
          <div className="mt-1 text-sm text-zinc-300">
            برنامه‌های خریداری‌شده را فیلتر کنید و برای جزئیات، روی برنامه کلیک کنید.
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
          <FiZap className="text-emerald-300" />
          پیشنهاد امروز: ۱۰ دقیقه کشش بعد از تمرین
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <FilterChips value={filter} onChange={onChangeFilter} />

        <div className="text-sm text-zinc-300">
          تعداد: <span className="text-white font-bold">{filtered.length}</span>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
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

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
