"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FiChevronRight } from "react-icons/fi";
import { mockPrograms } from "./mock";
import { computeTimeline } from "./helpers";
import ProgramDetailsPanel from "./ProgramDetailsPanel";

export default function ProgramDetailsClient() {
  const params = useParams(); // { id: 'p1' }
  const rawId = params?.id;

  const normalizedId = decodeURIComponent(String(rawId || "")).trim();

  const program =
    mockPrograms.find((p) => String(p.id) === normalizedId) ||
    mockPrograms.find((p) => String(p.id).toLowerCase() === normalizedId.toLowerCase());

  if (!rawId) {
    return (
      <div className="space-y-4">
        <Link
          href="/user/my-programs"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 hover:bg-white/10"
        >
          <FiChevronRight />
          برگشت به برنامه‌ها
        </Link>

        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
          پارامتر آیدی دریافت نشد.
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="space-y-4">
        <Link
          href="/user/my-programs"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 hover:bg-white/10"
        >
          <FiChevronRight />
          برگشت به برنامه‌ها
        </Link>

        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
          برنامه پیدا نشد.
          <div className="mt-2 text-[11px] text-zinc-500">
            ID دریافت‌شده: <span className="text-zinc-200">{normalizedId || "—"}</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500">
            IDهای موجود:{" "}
            <span className="text-zinc-200">
              {mockPrograms.map((x) => String(x.id)).join(", ")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const timeline = computeTimeline(program.startDate, program.durationDays);

  return (
    <div className="space-y-4">
      <Link
        href="/user/my-programs"
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 hover:bg-white/10"
      >
        <FiChevronRight />
        برگشت به برنامه‌ها
      </Link>

      <ProgramDetailsPanel program={program} timeline={timeline} />
    </div>
  );
}
