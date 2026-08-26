"use client";

import {
  Award,
  Bone,
  Calendar,
  Camera,
  ChevronDown,
  Dumbbell,
  Flame,
  Ruler,
  Scale,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PAIN_AREA_LABEL = {
  shoulder: "شانه",
  elbow_wrist: "آرنج/مچ",
  lower_back: "کمر",
  hip_glute: "لگن/باسن",
  knee: "زانو",
  ankle_calf: "مچ پا/ساق",
};

const TREND_LABEL = {
  improving: "رو به بهبود",
  stable: "ثابت",
  needs_attention: "نیازمند توجه",
};

function fa(n, digits = 0) {
  const num = Number(n) || 0;
  return num.toLocaleString("fa-IR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function CardShell({ badgeLabel, badgeClass, title, subtitle, children, rows }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-iranianSansDemiBold text-foreground">{title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <Badge variant="outline" className={cn("shrink-0 text-[10px]", badgeClass)}>
            {badgeLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">{children}</div>
        {rows?.length ? (
          <div className="space-y-2 border-t pt-3">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-iranianSansDemiBold tabular-nums text-foreground">{r.value}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex justify-center pt-1">
          <span className="flex size-6 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
            <ChevronDown className="size-3.5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ icon: Icon, iconClass, value, label }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border bg-muted/30 px-2 py-3 text-center">
      <Icon className={cn("size-4", iconClass)} />
      <p className="text-sm font-iranianSansDemiBold tabular-nums text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

export function WorkoutPerformanceCard({ report }) {
  if (!report) return null;
  const volumePct = report.volumeChangePercent || 0;
  const bestLift =
    report.heaviestExercise && report.heaviestReps
      ? `${fa(report.heaviestReps)}×${fa(report.heaviestWeightKg)}`
      : report.heaviestExercise
        ? `${fa(report.heaviestWeightKg)}kg`
        : "—";

  return (
    <CardShell
      badgeLabel="AI"
      badgeClass="border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
      title="عملکرد تمرین"
      subtitle="۱۴ روز اخیر"
      rows={[
        { label: "میانگین مدت جلسه", value: `${fa(report.avgSessionMin)} دقیقه` },
        { label: "تمرین پا", value: `${fa(report.legSessionCount)} جلسه` },
        { label: "تمرین بالاتنه", value: `${fa(report.upperSessionCount)} جلسه` },
        {
          label: "بیشترین پیشرفت",
          value: report.mostImprovedExercise
            ? `${report.mostImprovedExercise} +${fa(report.mostImprovedPercent)}%`
            : "—",
        },
      ]}
    >
      <Metric
        icon={Flame}
        iconClass="text-orange-500"
        value={`${volumePct > 0 ? "+" : ""}${fa(volumePct, 1)}%`}
        label="حجم کل"
      />
      <Metric icon={Target} iconClass="text-sky-500" value={fa(report.totalSessions)} label="جلسه تمرین" />
      <Metric icon={Dumbbell} iconClass="text-emerald-500" value={bestLift} label={report.heaviestExercise || "—"} />
      <Metric icon={Award} iconClass="text-amber-500" value={fa(report.totalPRs)} label="رکورد جدید" />
    </CardShell>
  );
}

export function BodyChangesCard({ report }) {
  if (!report) return null;
  const weightChange = report.avgWeightChangeKg || 0;
  const waistChange = report.waistChangeCm || 0;

  return (
    <CardShell
      badgeLabel="BODY"
      badgeClass="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      title="تغییرات بدنی"
      subtitle="مقایسه با ۱۴ روز قبل"
      rows={[
        { label: "وزن شروع", value: report.startWeightKg ? `${fa(report.startWeightKg, 1)} kg` : "—" },
        { label: "وزن فعلی", value: report.currentWeightKg ? `${fa(report.currentWeightKg, 1)} kg` : "—" },
        { label: "کمر شروع", value: report.startWaistCm ? `${fa(report.startWaistCm, 1)} cm` : "—" },
        { label: "کمر فعلی", value: report.currentWaistCm ? `${fa(report.currentWaistCm, 1)} cm` : "—" },
      ]}
    >
      <Metric
        icon={Ruler}
        iconClass="text-sky-500"
        value={`${waistChange > 0 ? "+" : ""}${fa(waistChange, 1)}cm`}
        label="دور کمر"
      />
      <Metric
        icon={Scale}
        iconClass="text-violet-500"
        value={`${weightChange > 0 ? "+" : ""}${fa(weightChange, 1)}kg`}
        label="میانگین"
      />
      <Metric
        icon={TrendingUp}
        iconClass="text-emerald-500"
        value={TREND_LABEL[report.bodyTrendLabel] || "—"}
        label="ترند کلی"
      />
      <Metric icon={Camera} iconClass="text-amber-500" value={fa(report.checkInCount)} label="چک‌این کامل" />
    </CardShell>
  );
}

export function RecoveryCard({ report }) {
  if (!report) return null;
  const painArea = report.commonPainArea ? PAIN_AREA_LABEL[report.commonPainArea] || report.commonPainArea : "—";

  return (
    <CardShell
      badgeLabel="RECOVERY"
      badgeClass="border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300"
      title="ریکاوری و وضعیت بدن"
      subtitle="میانگین ۱۴ روز اخیر"
      rows={[
        { label: "شب‌های خواب خوب", value: `${fa(report.goodSleepNights)} از ${fa(report.goodSleepNightsTotal)}` },
        {
          label: "انرژی بالا بعد تمرین",
          value: `${fa(report.highEnergySessions)} از ${fa(report.highEnergySessionsTotal)}`,
        },
        { label: "ناراحتی ثبت‌شده", value: `${fa(report.discomfortSessions)} جلسه` },
      ]}
    >
      <Metric icon={Zap} iconClass="text-sky-500" value={`${fa(report.avgSleepQuality, 1)} / ۵`} label="کیفیت خواب" />
      <Metric
        icon={Flame}
        iconClass="text-rose-500"
        value={`${fa(report.avgFeelingScore, 1)} / ۵`}
        label="حس پس از تمرین"
      />
      <Metric icon={Calendar} iconClass="text-emerald-500" value={`${fa(report.streakDays)} روز`} label="استریک تمرین" />
      <Metric icon={Bone} iconClass="text-muted-foreground" value={painArea} label={report.painSeverityLabel || "—"} />
    </CardShell>
  );
}
