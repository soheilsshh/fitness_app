import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "live" | "success" | "warning" | "error" | "neutral";

const toneColor: Record<Tone, string> = {
  brand: "#26fce3",
  live: "#ef4444",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  neutral: "#f5f5f5",
};

interface StatusChipProps {
  tone?: Tone;
  pulse?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Unified pulsing-dot status chip — replaces ad-hoc red/orange/purple badges. */
const StatusChip = ({ tone = "brand", pulse = false, icon, children, className }: StatusChipProps) => {
  return (
    <span className={cn("fp-chip", className)} style={{ color: toneColor[tone] }}>
      {icon ?? <span className={cn("fp-chip__dot", pulse && "fp-chip__dot--live")} aria-hidden />}
      <span className="text-foreground">{children}</span>
    </span>
  );
};

export default StatusChip;
