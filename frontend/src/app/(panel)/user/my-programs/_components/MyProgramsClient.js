"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiZap } from "react-icons/fi";
import ProgramCard from "./ProgramCard";
import ProgramDetailsPanel from "./ProgramDetailsPanel";
import { computeTimeline } from "./helpers";
import { mockPrograms } from "./mock";

export default function MyProgramsClient() {
  const [selectedId, setSelectedId] = useState(mockPrograms[0]?.id);

  const computed = useMemo(() => {
    return mockPrograms.map((p) => ({
      program: p,
      timeline: computeTimeline(p.startDate, p.durationDays),
    }));
  }, []);

  const selected = computed.find((x) => x.program.id === selectedId) || computed[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">برنامه‌های من</div>
          <div className="mt-1 text-sm text-zinc-300">
            برنامه‌های خریداری‌شده، وضعیت، و کارهای امروز را اینجا می‌بینی.
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
          <FiZap className="text-emerald-300" />
          پیشنهاد امروز: ۱۰ دقیقه کشش بعد از تمرین
        </div>
      </div>

      {/* Content grid */}
      <div className="flex flex-col gap-10">
        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {computed.map(({ program, timeline }) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="h-full"
            >
              <ProgramCard
                program={program}
                timeline={timeline}
                selected={program.id === selectedId}
                onSelect={() => setSelectedId(program.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Details panel */}
        <div className="lg:sticky lg:top-22 lg:h-[calc(100vh-120px)] lg:overflow-auto">
          <ProgramDetailsPanel program={selected?.program} timeline={selected?.timeline} />
        </div>
      </div>
    </div>
  );
}
