"use client";

import { cn } from "@/lib/utils";

export default function FunnelShell({
  children,
  className,
  contentClassName,
  centered = false,
}) {
  return (
    <div
      dir="rtl"
      className={cn(
        // overflow-clip (not hidden): decorative blobs must never create a
        // programmatically-scrollable area inside the phone frame
        "funnel-shell funnel-screen relative isolate overflow-clip bg-[#0e0e0e] text-white",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 start-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
        <div className="absolute bottom-0 end-0 h-80 w-80 rounded-full bg-chart-2/12 blur-[120px]" />
        <div className="absolute top-1/3 -start-20 h-64 w-64 rounded-full bg-primary/8 blur-[100px]" />
      </div>
      <div
        className={cn(
          "relative z-10 mx-auto w-full max-w-3xl px-4 py-8 md:py-10",
          centered && "funnel-screen flex flex-col justify-center",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function FunnelGlass({ children, className, glow = "teal" }) {
  return (
    <div
      className={cn(
        "rounded-3xl border bg-white/[0.04] backdrop-blur-xl",
        glow === "teal" &&
          "border-primary/30 shadow-[0_0_40px_-12px_oklch(0.58_0.11_187_/_0.35)]",
        glow === "green" &&
          "border-chart-2/35 shadow-[0_0_40px_-12px_oklch(0.77_0.1_187_/_0.3)]",
        glow === "warn" &&
          "border-orange-400/40 shadow-[0_0_40px_-12px_rgba(251,146,60,0.35)]",
        glow === "cyan" &&
          "border-primary/30 shadow-[0_0_40px_-12px_oklch(0.58_0.11_187_/_0.35)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function FunnelProgressBar({ value, label }) {
  const pct = Math.round(value);
  return (
    <div className="mb-8 space-y-2">
      <div className="flex items-center justify-between text-xs text-white/55">
        <span>{label || `پردازش پردازنده هوشمند: ${pct}٪`}</span>
        <span className="tabular-nums text-primary">{pct}٪</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-white/5">
        <div
          className="h-full rounded-full gradient-bg transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function FunnelCta({ children, className, type = "button", ...props }) {
  return (
    <button
      type={type}
      className={cn(
        "btn-cta",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0e0e]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
