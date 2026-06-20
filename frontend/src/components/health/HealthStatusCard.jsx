import { HeartPulse } from "lucide-react";
import { BMI_CATEGORIES } from "@/lib/tools/bmiCalculator";
import BmiStatusBadge from "@/components/health/BmiStatusBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function HealthStatusCard({
  bmi,
  bmiStatus,
  weightKg,
  heightCm,
  age,
  className,
}) {
  const hasData = bmi != null || weightKg != null || heightCm != null;
  const category = BMI_CATEGORIES.find((c) => c.id === bmiStatus);

  if (!hasData) {
    return (
      <Card className={cn("border-dashed", className)} dir="rtl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HeartPulse className="size-4 text-primary" />
            وضعیت سلامتی
          </CardTitle>
          <CardDescription>
            قد و وزن را در پروفایل ثبت کنید تا BMI و وضعیت بدنی نمایش داده شود.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      className={cn("bg-gradient-to-t from-primary/5 to-card dark:bg-card", className)}
      dir="rtl"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HeartPulse className="size-4 text-primary" />
          وضعیت سلامتی
        </CardTitle>
        <CardDescription>بر اساس آخرین وزن و قد ثبت‌شده در پروفایل</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <BmiStatusBadge bmi={bmi} bmiStatus={bmiStatus} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {weightKg != null ? (
            <Metric label="وزن" value={weightKg} unit="kg" />
          ) : null}
          {heightCm != null ? (
            <Metric label="قد" value={heightCm} unit="cm" />
          ) : null}
          {age != null ? (
            <Metric label="سن" value={age} unit="سال" />
          ) : null}
        </div>

        {category?.hint ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{category.hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, unit }) {
  return (
    <div className="rounded-lg border bg-card/60 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">
        {Number(value).toLocaleString("fa-IR")}
        <span className="ms-1 text-xs font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}
