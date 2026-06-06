"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FiChevronRight } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import { computeTimeline, mapApiProgramDetail } from "./helpers";
import ProgramDetailsPanel from "./ProgramDetailsPanel";

export default function ProgramDetailsClient() {
  const params = useParams();
  const rawId = params?.id;
  const normalizedId = decodeURIComponent(String(rawId || "")).trim();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!normalizedId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/me/programs/${normalizedId}`);
        if (!cancelled) setProgram(mapApiProgramDetail(res.data));
      } catch {
        if (!cancelled) setProgram(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [normalizedId]);

  if (!rawId) {
    return (
      <div className="space-y-4">
        <Link href="/user/my-programs" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 hover:bg-white/10">
          <FiChevronRight />
          برگشت به برنامه‌ها
        </Link>
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
          پارامتر آیدی دریافت نشد.
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-sm text-zinc-400">در حال بارگذاری...</div>;
  }

  if (!program) {
    return (
      <div className="space-y-4">
        <Link href="/user/my-programs" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 hover:bg-white/10">
          <FiChevronRight />
          برگشت به برنامه‌ها
        </Link>
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
          برنامه پیدا نشد.
        </div>
      </div>
    );
  }

  const timeline = computeTimeline(program.startDate, program.durationDays, program.status, program.remainingDays);

  return (
    <div className="space-y-4">
      <Link href="/user/my-programs" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 hover:bg-white/10">
        <FiChevronRight />
        برگشت به برنامه‌ها
      </Link>
      <ProgramDetailsPanel program={program} timeline={timeline} />
    </div>
  );
}
