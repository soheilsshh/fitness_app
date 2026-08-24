import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getBmiBadgeClass, getBmiStatusLabel } from "@/lib/tools/bmiDisplay";

export default function BmiStatusBadge({ bmi, bmiStatus, className }) {
  if (bmi == null && !bmiStatus) return null;

  const label = getBmiStatusLabel(bmiStatus);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {bmi != null ? (
        <span className="text-sm font-semibold tabular-nums">
          BMI: {Number(bmi).toLocaleString("fa-IR")}
        </span>
      ) : null}
      {label ? (
        <Badge variant="outline" className={cn(getBmiBadgeClass(bmiStatus))}>
          {label}
        </Badge>
      ) : null}
    </div>
  );
}
