"use client";

import { motion } from "framer-motion";
import { BadgeCheck, ClipboardList, Route } from "lucide-react";
import { toPersianDigits } from "@/app/(site)/auth/_components/helpers";

/** Status summary + coach solution + route prediction — narrative cards. */
export default function AnalysisNarrative({ analysis }) {
  const status = analysis.statusSummary || analysis.sections?.[0];
  const solution = analysis.customSolution || analysis.sections?.[1];
  const route = analysis.routePrediction || analysis.sections?.[2];
  const successPct = analysis.successPct ?? route?.successPct ?? 86;

  return (
    <div className="space-y-4">
      {/* 1. Status Summary Card */}
      {status && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] p-4 backdrop-blur-xl md:p-5"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/70 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-8 bg-gradient-to-b from-primary/15 to-transparent blur-md"
          />
          <div className="relative flex items-start gap-3">
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-primary">
              <ClipboardList className="size-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-2 text-start">
              <h3 className="text-sm font-bold text-white">{status.title}</h3>
              <p className="text-sm leading-8 text-white/65">{status.body}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. Custom Solution Block */}
      {solution && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-4 md:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
              <BadgeCheck className="size-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-2 text-start">
              <h3 className="text-sm font-bold leading-7 text-primary">{solution.title}</h3>
              <p className="text-sm leading-8 text-white/70">{solution.body}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. Route Prediction */}
      {route && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-2xl border border-white/12 bg-black/30 p-4 md:p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Route className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-white">{route.title}</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div
                aria-hidden
                className="absolute inset-0 rounded-2xl bg-primary/25 blur-xl"
              />
              <div className="relative flex min-w-[5.5rem] flex-col items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 px-3 py-3">
                <span className="text-3xl font-black tabular-nums text-primary drop-shadow-[0_0_12px_oklch(0.58_0.11_187_/_0.8)] md:text-4xl">
                  {toPersianDigits(successPct)}٪
                </span>
                <span className="mt-1 text-[10px] text-primary/70">موفقیت</span>
              </div>
            </div>
            <p className="text-sm leading-8 text-white/65">{route.body}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
