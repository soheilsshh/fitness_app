"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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
  LineChart,
  Scale,
  Target,
  Timer,
  Trophy,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import TrackingAlerts from "@/components/tracking/TrackingAlerts";
import WeightChart from "@/components/tracking/WeightChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

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
    return new Intl.DateTimeFormat("fa-IR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
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

  const firstName = profile?.firstName || "ورزشکار";

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      {/* greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="text-start">
          <h2 className="text-xl font-bold tracking-tight">سلام {firstName} 👋</h2>
          <p className="mt-1 text-sm text-muted-foreground">امروز {jalaliLong()}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/user/tracking">
            <LineChart className="size-4" />
            پایش کامل
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      </div>

      {/* alerts */}
      {!loading && tracking?.alerts?.length ? (
        <TrackingAlerts alerts={tracking.alerts} />
      ) : null}

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Dumbbell}
          accent="text-primary"
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
          accent="text-emerald-500"
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
          accent="text-sky-500"
          label="میانگین مدت جلسه"
          loading={loading}
          value={`${formatFa(summary?.avgDurationMin ?? 0)} دقیقه`}
          sub="میانگین کل تمرین‌ها"
        />
        <StatCard
          icon={Flame}
          accent="text-orange-500"
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
        description="روند تغییرات وزن در پایش‌ها"
      />
    </div>
  );
}

/* ---------------- building blocks ---------------- */

function SectionPanel({ icon: Icon, iconClass, title, action, children }) {
  return (
    <Card className="bg-gradient-to-t from-primary/5 to-card">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Icon className={cn("size-5", iconClass)} />
            {title}
          </h2>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function StatCard({ icon: Icon, accent, label, value, sub, loading }) {
  return (
    <Card className="bg-gradient-to-t from-primary/5 to-card">
      <CardContent className="flex flex-col gap-1.5 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className={cn("size-4", accent)} />
        </div>
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <span className="text-2xl font-bold tabular-nums text-foreground">{value}</span>
        )}
        {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
      <Icon className="size-8 opacity-40" />
      <p className="text-sm">{text}</p>
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
    bmi = current / Math.pow(height / 100, 2);
  }

  let pct = null;
  if (history.length >= 2 && target != null) {
    const start = history[0].weight;
    const total = Math.abs(start - target);
    const done = Math.abs(start - current);
    if (total > 0) pct = Math.min(100, Math.round((done / total) * 100));
  }

  const diff = current != null && target != null ? current - target : null;

  return (
    <SectionPanel icon={Scale} iconClass="text-emerald-500" title="هدف وزن">
      {loading ? (
        <Skeleton className="h-28 w-full" />
      ) : current == null || target == null ? (
        <EmptyState icon={Scale} text="وزن فعلی یا هدف ثبت نشده است." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">وزن فعلی</p>
              <p className="text-2xl font-bold tabular-nums">{formatFa(current)} کیلوگرم</p>
            </div>
            <div className="text-start">
              <p className="text-xs text-muted-foreground">هدف</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-600">
                {formatFa(target)} کیلوگرم
              </p>
            </div>
          </div>

          {pct != null ? (
            <div className="space-y-1.5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{formatFa(pct)}٪ مسیر تا هدف طی شده</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {Math.abs(diff) < 0.1
                ? "به هدف رسیده‌اید! 🎉"
                : `${formatFa(Math.abs(Math.round(diff * 10) / 10))} کیلوگرم تا هدف ${diff > 0 ? "کاهش" : "افزایش"}`}
            </p>
          )}

          {bmi != null ? (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">شاخص توده بدنی (BMI)</span>
              <span className="font-semibold tabular-nums">{formatFa(Math.round(bmi * 10) / 10)}</span>
            </div>
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

  const action = (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/user/tracking">
        ثبت
        <ChevronLeft className="size-4" />
      </Link>
    </Button>
  );

  return (
    <SectionPanel
      icon={ClipboardList}
      iconClass="text-amber-500"
      title="کارهای پایش این دوره"
      action={action}
    >
      {loading ? (
        <Skeleton className="h-28 w-full" />
      ) : !tracking ? (
        <EmptyState icon={ClipboardList} text="اشتراک فعالی برای پایش یافت نشد." />
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
    <SectionPanel icon={Dumbbell} iconClass="text-primary" title="تمرین امروز">
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : !program ? (
        <EmptyState icon={Dumbbell} text="برنامه تمرینی فعالی ندارید." />
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
        ثبت تمرین
        <ChevronLeft className="size-4" />
      </Link>
    </Button>
  );
  return (
    <SectionPanel icon={Trophy} iconClass="text-amber-500" title="رکوردهای شخصی" action={action}>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Trophy} text="هنوز رکوردی ثبت نشده. وزنه‌های تمرین را ثبت کن." />
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
  return (
    <SectionPanel icon={Activity} iconClass="text-sky-500" title="جلسات اخیر">
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Activity} text="هنوز جلسه‌ای ثبت نکرده‌اید." />
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
    <SectionPanel icon={CreditCard} iconClass="text-emerald-500" title="اشتراک من">
      {loading ? (
        <Skeleton className="h-28 w-full" />
      ) : !sub ? (
        <EmptyState icon={CreditCard} text="اشتراک فعالی ندارید." />
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
