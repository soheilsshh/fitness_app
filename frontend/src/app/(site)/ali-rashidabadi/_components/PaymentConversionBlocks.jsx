"use client";

import { useEffect, useState } from "react";
import { Hourglass, Shield } from "lucide-react";
import { toPersianDigits } from "@/app/(site)/auth/_components/helpers";
import { RESULT_COPY } from "../_lib/funnelConfig";

const COUNTDOWN_MS = 10 * 60 * 1000;
const STORAGE_PREFIX = "fitino:funnel:urgency:";

function formatMmSs(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Always returns a future deadline — silently rolls over so urgency never dies. */
function getDeadline(storageKey) {
  if (typeof window === "undefined") return Date.now() + COUNTDOWN_MS;
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (raw) {
      const n = Number(raw);
      if (Number.isFinite(n) && n > Date.now()) return n;
    }
    const end = Date.now() + COUNTDOWN_MS;
    sessionStorage.setItem(storageKey, String(end));
    return end;
  } catch {
    return Date.now() + COUNTDOWN_MS;
  }
}

function persistDeadline(storageKey, end) {
  try {
    sessionStorage.setItem(storageKey, String(end));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * AI Guard + fake 10-minute urgency — analysis is saved permanently on the server;
 * the timer only creates conversion pressure and silently restarts when it hits zero.
 */
export default function PaymentConversionBlocks({ storageKey = "default" }) {
  const key = `${STORAGE_PREFIX}${storageKey}`;
  const [remaining, setRemaining] = useState(COUNTDOWN_MS);

  useEffect(() => {
    let deadline = getDeadline(key);

    const tick = () => {
      let left = deadline - Date.now();
      if (left <= 0) {
        deadline = Date.now() + COUNTDOWN_MS;
        persistDeadline(key, deadline);
        left = COUNTDOWN_MS;
      }
      setRemaining(left);
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [key]);

  const mmss = formatMmSs(remaining);
  const urgencyText = RESULT_COPY.urgency.replace("۱۰:۰۰", toPersianDigits(mmss));

  return (
    <div className="space-y-3">
      {/* Analysis ready — first conversion box */}
      <div className="rounded-2xl border border-sky-400/40 bg-sky-500/[0.08] p-4 shadow-[0_0_28px_-12px_rgba(56,189,248,0.35)]">
        <p className="text-sm font-bold leading-7 text-sky-100">
          {RESULT_COPY.analysisReadyTitle}
        </p>
        <p className="mt-2 text-sm leading-8 text-sky-50/85">{RESULT_COPY.analysisReadyBody}</p>
      </div>

      {/* AI Guard */}
      <div className="rounded-2xl border border-emerald-400/45 bg-emerald-500/[0.08] p-4 shadow-[0_0_28px_-12px_rgba(52,211,153,0.45)]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-300">
            <Shield className="size-4" />
          </span>
          <p className="text-sm leading-8 text-emerald-50/90">
            <span className="font-bold text-emerald-300">🛡 </span>
            {RESULT_COPY.aiGuard}
          </p>
        </div>
      </div>

      {/* Urgency countdown — cosmetic only; lead analysis stays on server forever */}
      <div className="rounded-2xl border border-amber-400/40 bg-amber-500/[0.08] p-4 shadow-[0_0_28px_-12px_rgba(251,191,36,0.35)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Hourglass className="size-4 text-amber-300" />
            <span className="text-xs font-bold text-amber-200">انقضای رزرو آنالیز</span>
          </div>
          <span
            dir="ltr"
            className="rounded-full border border-amber-400/50 bg-amber-500/15 px-3 py-1 font-black tabular-nums tracking-wider text-amber-200"
          >
            ⏳ {toPersianDigits(mmss)}
          </span>
        </div>
        <p className="mt-3 text-sm leading-8 text-amber-50/85">{urgencyText}</p>
      </div>
    </div>
  );
}
