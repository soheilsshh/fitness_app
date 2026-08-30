"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Circle,
  ClipboardList,
  CreditCard,
  Dumbbell,
  Flame,
  Moon,
  Plus,
  Scale,
  Target,
  Timer,
  Trophy,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { usePanelUser } from "@/app/(panel)/_shared/hooks/usePanelUser";
import PageHeader from "@/app/(panel)/user/_components/ui/PageHeader";
import TrackingAlerts from "@/components/tracking/TrackingAlerts";
import WeightChart from "@/components/tracking/WeightChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { FUNNEL_PATH } from "@/lib/funnel/offer";
import { getBmiCategory } from "@/lib/tools/bmiCalculator";

const BMI_BADGE_CLASS = {
  underweight:
    "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  normal:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  overweight:
    "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  obese: "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200",
};

/* ---------------- helpers ---------------- */

function formatFa(value) {
  try {
    return new Intl.NumberFormat("fa-IR").format(Number(value) || 0);
  } catch {
    return String(value ?? 0);
  }
}

function jalaliLong(date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("fa-IR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value || "";
    // ترتیب: نام روز هفته → روز → ماه → سال
    return `${get("weekday")} ${get("day")} ${get("month")} ${get("year")}`.trim();
  } catch {
    return "";
  }
}

function jalaliShort(iso) {
  if (!iso) return "";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  try {
    return new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long" }).format(d);
  } catch {
    return "";
  }
}

function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMin = Math.round((Date.now() - then) / 60000);
  try {
    const rtf = new Intl.RelativeTimeFormat("fa-IR", { numeric: "auto" });
    if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, "minute");
    const diffHour = Math.round(diffMin / 60);
    if (Math.abs(diffHour) < 24) return rtf.format(-diffHour, "hour");
    return rtf.format(-Math.round(diffHour / 24), "day");
  } catch {
    return "";
  }
}

// daysUntil returns a Persian label + tone for a target ISO date.
function dueLabel(iso) {
  if (!iso) return { text: "—", overdue: false };
  const due = new Date(iso).getTime();
  if (Number.isNaN(due)) return { text: "—", overdue: false };
  const days = Math.ceil((due - Date.now()) / 86400000);
  if (days > 0) return { text: `${formatFa(days)} روز مانده`, overdue: false };
  if (days === 0) return { text: "امروز", overdue: false };
  return { text: `${formatFa(Math.abs(days))} روز گذشته`, overdue: true };
}

const DAY_LABELS = {
  1: "شنبه",
  2: "یکشنبه",
  3: "دوشنبه",
  4: "سه‌شنبه",
  5: "چهارشنبه",
  6: "پنجشنبه",
  7: "جمعه",
};

// todayDayNumber maps JS weekday to the program's day_number (Persian week, Sat=1).
function todayDayNumber() {
  return ((new Date().getDay() + 1) % 7) + 1;
}

const chartConfig = {
  value: { label: "جلسات تمرین", color: "var(--primary)" },
};

/* ---------------- page ---------------- */

export default function UserDashboardClient() {
  const panelUser = usePanelUser({ fetchProfile: true });
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [tracking, setTracking] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [program, setProgram] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const get = (url) => api.get(url).then((r) => r.data).catch(() => null);
      const [sum, rec, trk, prof, sub, prog, hist] = await Promise.all([
        get("/me/dashboard?days=30"),
        get("/me/records"),
        get("/me/tracking"),
        get("/me"),
        get("/subscriptions/current"),
        get("/programs/current"),
        get("/me/workout-history?pageSize=5"),
      ]);
      if (cancelled) return;
      setSummary(sum);
      setRecords(rec?.items || []);
      setTracking(trk);
      setProfile(prof);
      setSubscription(sub?.active_subscription || null);
      setProgram(prog?.workout_program || null);
      setHistory(hist?.items || []);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const PLACEHOLDER_NAMES = new Set(["", "ورزشکار", "کاربر", "کاربر جدید"]);
  const fromProfile = profile?.firstName?.trim() || "";
  const fromPanel = panelUser?.name?.trim()?.split(/\s+/)[0] || "";
  const firstName = !PLACEHOLDER_NAMES.has(fromProfile)
    ? fromProfile
    : !PLACEHOLDER_NAMES.has(fromPanel)
      ? fromPanel
      : "ورزشکار";

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title={`سلام ${firstName} 👋`}
        description={`امروز ${jalaliLong()}`}
        meta={
          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-2xl border-border px-4"
            asChild
          >
            <Link href="/user/tracking">
              نمایش کامل
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        }
      />

      <ProfileBoostCard profile={profile} loading={loading} />

      {/* alerts */}
      {!loading && tracking?.alerts?.length ? (
        <TrackingAlerts alerts={tracking.alerts} />
      ) : null}

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Dumbbell}
          tone="green"
          label="جلسات این هفته"
          loading={loading}
          value={formatFa(summary?.sessionsThisWeek ?? 0)}
          sub={
            summary?.streakWeeks
              ? `${formatFa(summary.streakWeeks)} هفته متوالی فعال`
              : "این هفته شروع کن"
          }
        />
        <StatCard
          icon={Target}
          tone="teal"
          label="پایبندی به برنامه"
          loading={loading}
          value={`${formatFa(summary?.adherence ?? 0)}٪`}
          sub={
            summary?.weeklyGoalDays
              ? `${formatFa(summary?.completedThisWeek ?? 0)} از ${formatFa(summary.weeklyGoalDays)} روز هفته`
              : "برنامه‌ای فعال نیست"
          }
        />
        <StatCard
          icon={Timer}
          tone="blue"
          label="میانگین مدت جلسه"
          loading={loading}
          value={`${formatFa(summary?.avgDurationMin ?? 0)} دقیقه`}
          sub={
            summary?.totalSessions
              ? `مابین ${formatFa(summary.totalSessions)} تمرین‌ها`
              : "میانگین کل تمرین‌ها"
          }
        />
        <StatCard
          icon={Flame}
          tone="orange"
          label="کل جلسات تکمیل‌شده"
          loading={loading}
          value={formatFa(summary?.totalSessions ?? 0)}
          sub={`${formatFa(summary?.sessionsThisMonth ?? 0)} جلسه این ماه`}
        />
      </div>

      {/* activity chart */}
      <ProgressChartCard loading={loading} data={summary?.progressSeries || []} />

      {/* goal + checkin */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <GoalCard loading={loading} profile={profile} tracking={tracking} />
        <CheckinTasksCard loading={loading} tracking={tracking} />
      </div>

      <QuickDailyCheckInCard />

      {/* today plan + records */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <TodayPlanCard loading={loading} program={program} />
        <PersonalRecordsCard loading={loading} items={records} />
      </div>

      {/* recent sessions + subscription */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <RecentSessionsCard loading={loading} items={history} />
        <SubscriptionCard loading={loading} sub={subscription} />
      </div>

      {/* weight history chart */}
      <WeightChart
        data={tracking?.weightHistory || []}
        loading={loading}
        compact
        title="نمودار روند تغییرات وزن"
        description="پایش هوشمند وزن و تحلیل پیشرفت ۳۰ روزه"
        actionHref="/user/tracking"
        actionLabel="ثبت وزن امروز"
        emptyText="هنوز داده‌ای برای رسم نمودار وجود ندارد. با ثبت وزن امروز، اولین نقطه پیشرفت خود را ثبت کنید!"
        emptyActionHref="/user/tracking"
        emptyActionLabel="ثبت وزن جدید"
      />
    </div>
  );
}

/* ---------------- KPI stat cards (design mock) ---------------- */

const STAT_TONES = {
  green: {
    accent: "#22c55e",
    icon: "text-emerald-500",
    value: "text-foreground",
    chip: "bg-emerald-500/10 ring-1 ring-emerald-500/25 shadow-[0_0_20px_-4px_rgba(34,197,94,0.55)]",
    wave: "lines",
  },
  teal: {
    accent: "#14b8a6",
    icon: "text-teal-400",
    value: "text-teal-400",
    chip: "bg-teal-500/10 ring-1 ring-teal-500/25 shadow-[0_0_20px_-4px_rgba(20,184,166,0.55)]",
    wave: "chart",
  },
  blue: {
    accent: "#3b82f6",
    icon: "text-blue-500",
    value: "text-blue-500",
    chip: "bg-blue-500/10 ring-1 ring-blue-500/25 shadow-[0_0_20px_-4px_rgba(59,130,246,0.55)]",
    wave: "dots",
  },
  orange: {
    accent: "#f97316",
    icon: "text-orange-500",
    value: "text-foreground",
    chip: "bg-orange-500/10 ring-1 ring-orange-500/25 shadow-[0_0_20px_-4px_rgba(249,115,22,0.55)]",
    wave: "fluid",
  },
};

function WaveBg({ accent, variant }) {
  const uid = `w-${variant}-${accent.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] w-full"
      style={{
        maskImage:
          "linear-gradient(to top, #000 0%, #000 28%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.15) 78%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to top, #000 0%, #000 28%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.15) 78%, transparent 100%)",
      }}
    >
      {variant === "lines" ? <WaveLines accent={accent} uid={uid} /> : null}
      {variant === "chart" ? <WaveChart accent={accent} uid={uid} /> : null}
      {variant === "dots" ? <WaveDots accent={accent} uid={uid} /> : null}
      {variant === "fluid" ? <WaveFluid accent={accent} uid={uid} /> : null}
    </div>
  );
}

/** Thin overlapping stroke waves — sessions card */
function WaveLines({ accent, uid }) {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 360 140" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="45%" stopColor={accent} stopOpacity="0.85" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {[
        "M-10 95 C40 70 80 115 130 88 C180 62 210 40 260 58 C300 72 330 68 370 50",
        "M-10 108 C50 85 90 125 145 98 C195 72 230 55 280 70 C320 82 345 78 370 65",
        "M-10 78 C35 55 75 95 120 72 C170 48 205 28 255 42 C295 54 330 48 370 35",
        "M-10 118 C55 100 100 130 155 112 C210 94 250 80 300 92 C335 100 350 98 370 90",
      ].map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={`url(#${uid}-g)`}
          strokeWidth={i === 0 ? 2.2 : 1.4}
          strokeLinecap="round"
          opacity={1 - i * 0.15}
        />
      ))}
    </svg>
  );
}

/** Continuous chart-like wave — adherence card */
function WaveChart({ accent, uid }) {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 360 140" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M-10 100 C50 88 70 55 110 48 C155 40 175 78 220 70 C265 62 290 28 340 35 L370 40 L370 140 L-10 140 Z"
        fill={`url(#${uid}-fill)`}
      />
      <path
        d="M-10 100 C50 88 70 55 110 48 C155 40 175 78 220 70 C265 62 290 28 340 35"
        fill="none"
        stroke={accent}
        strokeWidth="2.6"
        strokeLinecap="round"
        filter={`url(#${uid}-glow)`}
        opacity="0.95"
      />
    </svg>
  );
}

/** Dotted / frequency wave — duration card */
function WaveDots({ accent, uid }) {
  const dots = [];
  for (let x = 8; x <= 350; x += 10) {
    const t = x / 350;
    const y =
      78 +
      Math.sin(t * Math.PI * 2.4) * 22 +
      Math.sin(t * Math.PI * 5.1) * 8;
    const r = 1.1 + (Math.sin(t * 12) + 1) * 0.7;
    dots.push({ x, y, r, o: 0.25 + t * 0.55 });
  }
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 360 140" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`${uid}-line`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
          <stop offset="50%" stopColor={accent} stopOpacity="0.9" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <path
        d="M-10 95 C40 70 90 110 140 85 C190 60 230 45 280 62 C320 75 345 70 370 55"
        fill="none"
        stroke={`url(#${uid}-line)`}
        strokeWidth="1.2"
        strokeDasharray="2 5"
        opacity="0.7"
      />
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={accent}
          opacity={d.o}
        />
      ))}
      {/* second denser band lower */}
      {dots.map((d, i) =>
        i % 2 === 0 ? (
          <circle
            key={`b-${i}`}
            cx={d.x + 4}
            cy={d.y + 16}
            r={d.r * 0.75}
            fill={accent}
            opacity={d.o * 0.55}
          />
        ) : null
      )}
    </svg>
  );
}

/** Thick fluid waves + particles — total sessions card */
function WaveFluid({ accent, uid }) {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 360 140" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`${uid}-a`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
          <stop offset="70%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-b`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M-10 85 C45 55 85 105 140 78 C195 52 230 30 285 48 C320 60 345 55 370 42 L370 140 L-10 140 Z"
        fill={`url(#${uid}-a)`}
      />
      <path
        d="M-10 105 C55 82 100 120 160 95 C215 72 255 58 305 72 C335 80 350 78 370 70 L370 140 L-10 140 Z"
        fill={`url(#${uid}-b)`}
      />
      <path
        d="M-10 92 C40 68 80 100 125 82 C175 62 210 48 260 60 C300 70 330 66 370 52"
        fill="none"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.75"
      />
      {[
        [48, 98],
        [92, 72],
        [150, 88],
        [198, 58],
        [248, 78],
        [300, 64],
        [330, 90],
        [70, 110],
        [220, 100],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={i % 3 === 0 ? 2.2 : 1.3}
          fill={accent}
          opacity={0.35 + (i % 4) * 0.12}
        />
      ))}
    </svg>
  );
}

function SectionPanel({ icon: Icon, iconClass, title, action, children }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-iranianSansDemiBold leading-6 text-foreground sm:text-lg">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/12">
              <Icon className={cn("size-4", iconClass || "text-primary")} />
            </span>
            {title}
          </h2>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function StatCard({ icon: Icon, tone = "teal", label, value, sub, loading }) {
  const t = STAT_TONES[tone] || STAT_TONES.teal;
  return (
    <Card className="relative overflow-hidden">
      <WaveBg accent={t.accent} variant={t.wave} />
      <CardContent className="relative z-[1] flex flex-col gap-2.5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 text-start">
            <p className="text-sm font-iranianSansMedium leading-[22px] text-muted-foreground">
              {label}
            </p>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-28" />
            ) : (
              <p
                className={cn(
                  "mt-1.5 text-2xl font-iranianSansBlack leading-8 tabular-nums tracking-tight",
                  t.value
                )}
              >
                {value}
              </p>
            )}
            {sub ? (
              <p className="mt-1 text-xs font-iranianSansMedium leading-[18px] text-muted-foreground">
                {sub}
              </p>
            ) : null}
          </div>
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full",
              t.chip
            )}
          >
            <Icon className={cn("size-5", t.icon)} strokeWidth={2.15} />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, text, actionHref, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-8 text-center">
      <span className="fitino-empty-icon flex size-12 items-center justify-center rounded-2xl">
        <Icon className="size-5 text-primary opacity-80" />
      </span>
      <p className="text-sm font-iranianSansMedium text-muted-foreground">{text}</p>
      {actionHref && actionLabel ? (
        <Button asChild size="sm" className="mt-1">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

function ProgressChartCard({ loading, data }) {
  const tickInterval = data.length > 6 ? Math.ceil(data.length / 6) : 0;
  const hasData = data.some((d) => d.value > 0);
  return (
    <SectionPanel icon={Activity} iconClass="text-primary" title="نمودار فعالیت تمرینی (۳۰ روز)">
      {loading ? (
        <Skeleton className="h-[240px] w-full" />
      ) : !hasData ? (
        <EmptyState icon={Activity} text="هنوز جلسه‌ای ثبت نشده است." />
      ) : (
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="fillUserSessions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.7} />
                <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              reversed
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={tickInterval}
              tickFormatter={jalaliShort}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent labelFormatter={(v) => jalaliShort(v)} />}
            />
            <Area
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              fill="url(#fillUserSessions)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </SectionPanel>
  );
}

function GoalCard({ loading, profile, tracking }) {
  const current =
    tracking?.lastWeightKg ?? profile?.weightKg ?? null;
  const target = profile?.targetWeightKg ?? null;
  const height = profile?.heightCm ?? null;
  const history = tracking?.weightHistory || [];

  let bmi = null;
  if (current && height && height > 0) {
    bmi = Math.round((current / Math.pow(height / 100, 2)) * 10) / 10;
  }
  const bmiCategory = bmi != null ? getBmiCategory(bmi) : null;

  let pct = 0;
  if (current != null && target != null) {
    if (Math.abs(current - target) < 0.1) {
      pct = 100;
    } else if (history.length >= 1) {
      const start = history[0].weight;
      const total = Math.abs(start - target);
      const done = Math.abs(start - current);
      if (total > 0) pct = Math.min(100, Math.round((done / total) * 100));
    }
  }

  const diff = current != null && target != null ? current - target : null;
  const reached = diff != null && Math.abs(diff) < 0.1;
  const remainingKg =
    diff != null ? Math.abs(Math.round(diff * 10) / 10) : null;
  const goalKind = diff != null && diff > 0 ? "کاهش وزن" : "افزایش حجم";

  return (
    <SectionPanel
      icon={Scale}
      iconClass="text-primary"
      title="هدف وزنی و ترکیب بدنی"
    >
      {loading ? (
        <Skeleton className="h-28 w-full" />
      ) : current == null || target == null ? (
        <EmptyState icon={Scale} text="وزن فعلی یا هدف ثبت نشده است." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">وزن فعلی</p>
              <p className="text-2xl font-bold tabular-nums">
                {formatFa(current)} کیلوگرم
              </p>
            </div>
            <div className="text-start">
              <p className="text-xs text-muted-foreground">وزن هدف</p>
              <p className="text-2xl font-bold tabular-nums text-primary">
                {formatFa(target)} کیلوگرم
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="پیشرفت تا وزن هدف"
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {reached
                ? "به وزن هدف رسیده‌اید."
                : `${formatFa(remainingKg)} کیلوگرم تا رسیدن به وزن هدف (${goalKind})`}
              {pct > 0 ? (
                <span className="text-primary">
                  {" "}
                  · {formatFa(pct)}٪ مسیر
                </span>
              ) : null}
            </p>
          </div>

          {bmi != null ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">شاخص توده بدنی (BMI)</span>
              <span className="flex items-center gap-2">
                <span className="font-semibold tabular-nums">
                  {formatFa(bmi)}
                </span>
                {bmiCategory ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 px-1.5 text-[10px]",
                      BMI_BADGE_CLASS[bmiCategory.id]
                    )}
                  >
                    محدوده {bmiCategory.label}
                  </Badge>
                ) : null}
              </span>
            </div>
          ) : null}
        </div>
      )}
    </SectionPanel>
  );
}

const DASHBOARD_SLEEP_OPTIONS = [1, 2, 3, 4, 5];

// Quick-entry duplicate of the two DailyCheckIn fields worth a shortcut right
// on the dashboard (morning weight, sleep quality) — the full form (plus
// protein) lives on the Tracking page.
function QuickDailyCheckInCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState("");
  const [sleep, setSleep] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get("/me/daily-checkin/today");
        if (cancelled) return;
        const d = res.data || {};
        setData(d);
        setWeight(d.morningWeightKg != null ? String(d.morningWeightKg) : "");
        setSleep(d.sleepQuality ?? null);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    const payload = {};
    const w = Number(weight);
    if (weight && w >= 20 && w <= 300) payload.morningWeightKg = w;
    if (sleep) payload.sleepQuality = sleep;
    if (Object.keys(payload).length === 0) return;
    setSaving(true);
    try {
      const res = await api.post("/me/daily-checkin", payload);
      setData(res.data);
      toast.success("پایش امروز ثبت شد");
    } catch (err) {
      toast.error(err?.response?.data?.error || "ثبت ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionPanel icon={Scale} iconClass="text-sky-500" title="پایش سریع امروز">
      {loading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[120px] flex-1 space-y-1.5">
              <label htmlFor="quick-weight" className="text-xs text-muted-foreground">
                وزن صبح (کیلوگرم)
              </label>
              <Input
                id="quick-weight"
                type="number"
                step="0.1"
                min="20"
                max="300"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="مثلاً ۷۵"
                className="h-9"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Moon className="size-3" />
                کیفیت خواب
              </span>
              <div className="flex gap-1">
                {DASHBOARD_SLEEP_OPTIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSleep(v)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-md border text-sm tabular-nums transition",
                      sleep === v
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground"
                    )}
                  >
                    {v.toLocaleString("fa-IR")}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving} className="self-start">
            {saving ? "در حال ثبت..." : "ثبت"}
          </Button>
          {data?.morningWeightKg != null || data?.sleepQuality != null ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">پایش امروز ثبت شده است.</p>
          ) : null}
        </div>
      )}
    </SectionPanel>
  );
}

function CheckinTasksCard({ loading, tracking }) {
  const due = dueLabel(tracking?.nextDueDate);
  const photos = tracking?.photosSubmitted || {};
  const allPhotos =
    Object.keys(photos).length > 0 && Object.values(photos).every(Boolean);
  const weightDone = !!tracking?.weightSubmitted;
  const canLog = !loading && !!tracking;

  const action = canLog ? (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/user/tracking">
        ثبت گزارش
        <Plus className="size-3.5" data-icon="inline-end" />
      </Link>
    </Button>
  ) : (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled
      className="pointer-events-none opacity-40"
    >
      ثبت گزارش
      <Plus className="size-3.5" data-icon="inline-end" />
    </Button>
  );

  return (
    <SectionPanel
      icon={ClipboardList}
      iconClass="text-amber-500"
      title="پایش و چک‌این روزانه"
      action={action}
    >
      {loading ? (
        <Skeleton className="h-28 w-full" />
      ) : !tracking ? (
        <EmptyState
          icon={ClipboardList}
          text="برای ثبت گزارش‌های روزانه و تحلیل هوشمند، ابتدا دوره پایش خود را فعال کنید."
          actionHref={FUNNEL_PATH}
          actionLabel="فعال‌سازی پایش و آنالیز"
        />
      ) : (
        <div className="flex flex-col gap-3">
          <TaskRow done={weightDone} label="ثبت وزن این دوره" />
          <TaskRow done={allPhotos} label="آپلود عکس‌های پایش (جلو، بغل، پشت)" icon={Camera} />
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="size-4" />
              مهلت چک‌این بعدی
            </span>
            <Badge variant={due.overdue ? "destructive" : "secondary"}>{due.text}</Badge>
          </div>
        </div>
      )}
    </SectionPanel>
  );
}

function TaskRow({ done, label, icon: Icon }) {
  return (
    <div className="flex items-center gap-3">
      {done ? (
        <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
      ) : (
        <Circle className="size-5 shrink-0 text-muted-foreground/50" />
      )}
      <span className={cn("flex items-center gap-1.5 text-sm", done ? "text-muted-foreground line-through" : "text-foreground")}>
        {Icon ? <Icon className="size-3.5 opacity-60" /> : null}
        {label}
      </span>
    </div>
  );
}

function TodayPlanCard({ loading, program }) {
  const items = program?.items || [];
  const num = todayDayNumber();
  const todays = items
    .filter((it) => it.day_number === num)
    .sort((a, b) => a.order_index - b.order_index);
  const trainingDays = [...new Set(items.map((it) => it.day_number))].sort((a, b) => a - b);

  return (
    <SectionPanel
      icon={Dumbbell}
      iconClass="text-primary"
      title="برنامه تمرینی امروز"
    >
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : !program ? (
        <EmptyState
          icon={Dumbbell}
          text="هنوز برنامه تمرینی فعالی برای شما ثبت نشده است."
          actionHref={FUNNEL_PATH}
          actionLabel="دریافت برنامه تمرینی اختصاصی"
        />
      ) : todays.length === 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">امروز ({DAY_LABELS[num]}) روز استراحت است. 🛌</p>
          {trainingDays.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {trainingDays.map((d) => (
                <Badge key={d} variant={d === num ? "default" : "outline"}>
                  {DAY_LABELS[d] || `روز ${formatFa(d)}`}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border/60">
          {todays.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="truncate text-sm font-medium text-foreground">{it.exercise}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatFa(it.sets)} ست × {it.reps} تکرار
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}

function PersonalRecordsCard({ loading, items }) {
  const max = items.reduce((m, r) => Math.max(m, r.est1rm || 0), 0) || 1;
  const action = (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/user/workout-history">
        ثبت رکورد جدید
        <Plus className="size-3.5" data-icon="inline-end" />
      </Link>
    </Button>
  );
  return (
    <SectionPanel
      icon={Trophy}
      iconClass="text-amber-500"
      title="رکوردهای شخصی (PR)"
      action={action}
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Trophy}
          text="هنوز رکوردی ثبت نکرده‌اید. بهترین وزنه، بیشترین تکرار یا طولانی‌ترین نگه‌داشتن خود را اینجا ثبت کنید."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((r) => (
            <li key={r.exerciseName} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">{r.exerciseName}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatFa(r.bestWeightKg)} کیلوگرم × {formatFa(r.bestReps)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${Math.round((r.est1rm / max) * 100)}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs font-semibold text-amber-600 tabular-nums">
                  {formatFa(r.est1rm)} کیلوگرم 1RM
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}

function RecentSessionsCard({ loading, items }) {
  const action = (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/user/workout-history">
        ثبت تمرین
        <Plus className="size-3.5" data-icon="inline-end" />
      </Link>
    </Button>
  );

  return (
    <SectionPanel
      icon={Activity}
      iconClass="text-sky-500"
      title="تاریخچه و جلسات اخیر"
      action={action}
    >
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          text="هیچ جلسه‌ای ثبت نشده است. اولین تمرین خود را ثبت کنید تا روند پیشرفت‌تان محاسبه شود."
          actionHref="/user/workout-history"
          actionLabel="شروع و ثبت اولین تمرین"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((s) => (
            <li key={s.id} className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Dumbbell className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {s.programTitle || "تمرین"} — {s.dayLabel}
                </p>
                <p className="text-xs text-muted-foreground">{timeAgo(s.completedAt)}</p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {formatFa(s.durationMin)} دقیقه
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}

function ProfileBoostCard({ profile, loading }) {
  const progress = profile?.profileProgress;
  if (loading) {
    return <Skeleton className="h-36 w-full rounded-2xl" />;
  }
  if (!progress || progress.percent >= 100) return null;

  const items = [
    {
      key: "essentials",
      done: progress.essentials,
      label: "نام و هدف",
      href: "/user/onboarding",
    },
    {
      key: "body",
      done: progress.body,
      label: "قد، وزن و وضعیت بدن",
      href: "/user/profile#body",
    },
    {
      key: "medical",
      done: progress.medical,
      label: "سوابق پزشکی",
      href: "/user/profile#medical",
    },
    {
      key: "photos",
      done: progress.photos,
      label: "عکس‌های بدن",
      href: "/user/profile#photos",
    },
  ];

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardContent className="space-y-4 p-6 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="text-start">
            <p className="text-sm font-iranianSansDemiBold text-foreground">
              تکمیل پروفایل — {formatFa(progress.percent)}٪
            </p>
            <p className="mt-1 text-xs font-iranianSansMedium text-muted-foreground">
              هر بخش را کامل کنید تا مربی برنامه دقیق‌تری بسازد. اجباری نیست.
            </p>
          </div>
          <Badge
            variant="outline"
            className="fitino-meta-badge tabular-nums font-iranianSansDemiBold"
          >
            {formatFa(items.filter((i) => i.done).length)} از{" "}
            {formatFa(items.length)}
          </Badge>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/80">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#14b8a6,#0d9488)] transition-all"
            style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
          />
        </div>

        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                  item.done
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                    : "border-border/70 bg-background/70 text-foreground hover:bg-muted/60"
                )}
              >
                {item.done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1 truncate text-start">{item.label}</span>
                {!item.done ? (
                  <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function SubscriptionCard({ loading, sub }) {
  let remaining = null;
  let total = null;
  let pctUsed = null;
  if (sub?.ends_at) {
    const ends = new Date(sub.ends_at).getTime();
    const starts = sub.starts_at ? new Date(sub.starts_at).getTime() : null;
    remaining = Math.max(0, Math.ceil((ends - Date.now()) / 86400000));
    total = sub.plan?.duration_days || (starts ? Math.round((ends - starts) / 86400000) : null);
    if (total && total > 0) {
      pctUsed = Math.min(100, Math.max(0, Math.round(((total - remaining) / total) * 100)));
    }
  }

  return (
    <SectionPanel
      icon={CreditCard}
      iconClass="text-emerald-500"
      title="وضعیت اشتراک و دوره"
    >
      {loading ? (
        <Skeleton className="h-28 w-full" />
      ) : !sub ? (
        <EmptyState
          icon={CreditCard}
          text="در حال حاضر اشتراک فعالی ندارید. برای دسترسی به برنامه و پایش هوشمند، دوره خود را فعال کنید."
          actionHref={FUNNEL_PATH}
          actionLabel="فعال‌سازی و ارتقای اشتراک"
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{sub.plan?.name || "اشتراک"}</span>
            <Badge variant="secondary">{sub.plan?.type === "both" ? "تمرین + تغذیه" : sub.plan?.type}</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">
              {formatFa(remaining ?? 0)} <span className="text-sm font-normal text-muted-foreground">روز باقی‌مانده</span>
            </p>
          </div>
          {pctUsed != null ? (
            <div className="space-y-1.5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pctUsed}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatFa(pctUsed)}٪ از دوره {formatFa(total)} روزه سپری شده
              </p>
            </div>
          ) : null}
        </div>
      )}
    </SectionPanel>
  );
}
