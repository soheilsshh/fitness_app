"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
} from "recharts";
import {
  AlertTriangle,
  Bell,
  Camera,
  CalendarClock,
  ChevronLeft,
  Dumbbell,
  Scale,
  Ticket,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserPlus,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { SectionCards } from "@/components/section-cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

function formatFa(value) {
  try {
    return new Intl.NumberFormat("fa-IR").format(Number(value) || 0);
  } catch {
    return String(value ?? 0);
  }
}

function formatToman(value) {
  return `${formatFa(value)} تومان`;
}

function jalaliLong(date = new Date()) {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
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
    return new Intl.DateTimeFormat("fa-IR", {
      day: "numeric",
      month: "long",
    }).format(d);
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

function deltaBadge(pct) {
  if (pct == null) return null;
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn("flex items-center gap-1", up ? "text-emerald-600" : "text-rose-600")}>
      <Icon className="size-3" />
      {formatFa(Math.abs(pct))}٪ نسبت به ماه قبل
    </span>
  );
}

const NOTIF_META = {
  new_subscription: { icon: UserPlus, className: "bg-emerald-500/10 text-emerald-500" },
  checkin_reminder: { icon: CalendarClock, className: "bg-amber-500/10 text-amber-500" },
  ticket: { icon: Ticket, className: "bg-sky-500/10 text-sky-500" },
  workout_logged: { icon: Dumbbell, className: "bg-primary/10 text-primary" },
  payment: { icon: Wallet, className: "bg-emerald-500/10 text-emerald-500" },
  program_updated: { icon: Bell, className: "bg-primary/10 text-primary" },
  message_from_coach: { icon: Bell, className: "bg-primary/10 text-primary" },
};

function notifMeta(type) {
  return NOTIF_META[type] ?? { icon: Bell, className: "bg-muted text-muted-foreground" };
}

const chartConfig = {
  value: { label: "جلسات تمرین", color: "var(--primary)" },
};

export default function CoachDashboardClient() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [attention, setAttention] = useState([]);
  const [attentionLoading, setAttentionLoading] = useState(true);
  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [top, setTop] = useState([]);
  const [topLoading, setTopLoading] = useState(true);
  const [series, setSeries] = useState([]);
  const [seriesLoading, setSeriesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const statsP = api.get("/coach/dashboard/stats").then((r) => r.data).catch(() => null);
      const notifP = api
        .get("/coach/notifications", { params: { limit: 5 } })
        .then((r) => r.data?.items ?? [])
        .catch(() => []);
      const attP = api
        .get("/coach/tracking/students")
        .then((r) => (r.data?.items ?? []).filter((s) => (s.alerts?.length ?? 0) > 0))
        .catch(() => []);
      const recentP = api
        .get("/coach/dashboard/recent-students", { params: { limit: 5 } })
        .then((r) => r.data?.items ?? [])
        .catch(() => []);
      const topP = api
        .get("/coach/dashboard/top-students", { params: { limit: 3 } })
        .then((r) => r.data?.items ?? [])
        .catch(() => []);
      const seriesP = api
        .get("/coach/dashboard/progress-series", { params: { days: 30 } })
        .then((r) => r.data?.items ?? [])
        .catch(() => []);

      const [s, n, a, rc, tp, sr] = await Promise.all([statsP, notifP, attP, recentP, topP, seriesP]);
      if (cancelled) return;
      setStats(s);
      setStatsLoading(false);
      setNotifications(n);
      setNotifLoading(false);
      setAttention(a);
      setAttentionLoading(false);
      setRecent(rc);
      setRecentLoading(false);
      setTop(tp);
      setTopLoading(false);
      setSeries(sr);
      setSeriesLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const statItems = useMemo(
    () => [
      {
        title: "درآمد این ماه",
        value: stats?.monthlySales ?? 0,
        displayValue: formatToman(stats?.monthlySales),
        badge: deltaBadge(stats?.monthlySalesDeltaPct),
        hint: "سفارش‌های پرداخت‌شده در ماه جاری",
      },
      {
        title: "شاگردان فعال",
        value: stats?.activeSubscriptions ?? 0,
        hint: "اشتراک‌های جاری",
      },
      {
        title: "پایبندی شاگردان به برنامه",
        value: stats?.programAdherence ?? 0,
        displayValue: `${formatFa(stats?.programAdherence ?? 0)}٪`,
        hint: "میانگین تکمیل تمرین‌های این هفته",
      },
      {
        title: "جلسات تکمیل‌شده",
        value: stats?.completedSessions ?? 0,
        badge: deltaBadge(stats?.completedSessionsDeltaPct),
        hint: "تمرین‌های ثبت‌شده این ماه",
      },
      {
        title: "کل شاگردان",
        value: stats?.totalStudents ?? 0,
        hint: "همه دانشجویان شما",
      },
    ],
    [stats]
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-col gap-1 px-1">
        <h1 className="flex items-center gap-2 text-xl font-bold text-foreground md:text-2xl">
          سلام مربی عزیز <span aria-hidden>👋</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          امروز {jalaliLong()} — نمای کلی فعالیت‌ها و شاگردان شما
        </p>
      </div>

      <SectionCards items={statItems} loading={statsLoading} />

      <ProgressChartCard loading={seriesLoading} data={series} />

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <TopStudentsCard loading={topLoading} items={top} />
        <RecentStudentsCard loading={recentLoading} items={recent} />
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <RemindersCard loading={notifLoading} items={notifications} />
        <AttentionCard loading={attentionLoading} items={attention} />
      </div>
    </div>
  );
}

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

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2">
      <Skeleton className="size-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
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
  return (
    <SectionPanel icon={TrendingUp} iconClass="text-primary" title="نمودار فعالیت شاگردان">
      {loading ? (
        <Skeleton className="h-[240px] w-full" />
      ) : data.length === 0 ? (
        <EmptyState icon={TrendingUp} text="هنوز فعالیتی ثبت نشده است." />
      ) : (
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="fillSessions" x1="0" y1="0" x2="0" y2="1">
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
              fill="url(#fillSessions)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </SectionPanel>
  );
}

const RANK_STYLE = [
  "bg-amber-400/20 text-amber-600",
  "bg-slate-400/20 text-slate-500",
  "bg-orange-400/20 text-orange-600",
];

function TopStudentsCard({ loading, items }) {
  return (
    <SectionPanel icon={Trophy} iconClass="text-amber-500" title="شاگردان با بیشترین پیشرفت">
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Trophy} text="هنوز داده‌ای برای رتبه‌بندی نیست." />
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((s, i) => (
            <li key={s.studentId} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  RANK_STYLE[i] ?? "bg-muted text-muted-foreground"
                )}
              >
                {formatFa(i + 1)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{s.fullName}</p>
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                    {formatFa(s.adherence)}٪
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, s.adherence))}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}

function RecentStudentsCard({ loading, items }) {
  return (
    <SectionPanel icon={UserPlus} iconClass="text-emerald-500" title="آخرین شاگردان اضافه‌شده">
      {loading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={UserPlus} text="شاگرد جدیدی ثبت نشده است." />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((s) => (
            <li key={s.studentId}>
              <Link
                href={`/coach/students/${s.studentId}`}
                className="group flex items-center gap-3 py-3 transition-colors hover:bg-muted/40"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-600">
                  {s.fullName?.trim()?.charAt(0) || "؟"}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {s.fullName}
                </p>
                <time className="shrink-0 text-xs text-muted-foreground">{timeAgo(s.joinedAt)}</time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}

function RemindersCard({ loading, items }) {
  return (
    <SectionPanel
      icon={Bell}
      iconClass="text-primary"
      title="یادآوری‌های امروز"
      action={
        !loading && items.length > 0 ? (
          <Badge variant="secondary">{formatFa(items.length)} مورد</Badge>
        ) : null
      }
    >
      {loading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} text="یادآوری جدیدی ندارید." />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((n) => {
            const meta = notifMeta(n.type);
            const Icon = meta.icon;
            return (
              <li key={n.id} className="flex items-start gap-3 py-3">
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", meta.className)}>
                  <Icon className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                    {!n.isRead ? <span className="size-2 shrink-0 rounded-full bg-primary" /> : null}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{n.message}</p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</time>
              </li>
            );
          })}
        </ul>
      )}
    </SectionPanel>
  );
}

function AttentionCard({ loading, items }) {
  return (
    <SectionPanel
      icon={AlertTriangle}
      iconClass="text-amber-500"
      title="شاگردان نیازمند توجه"
      action={
        !loading && items.length > 0 ? (
          <Badge variant="destructive">{formatFa(items.length)} نفر</Badge>
        ) : null
      }
    >
      {loading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={AlertTriangle} text="همه شاگردان به‌روز هستند." />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((s) => (
            <li key={s.id}>
              <Link
                href={`/coach/tracking/${s.id}`}
                className="group flex items-center gap-3 py-3 transition-colors hover:bg-muted/40"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-sm font-semibold text-amber-600">
                  {s.fullName?.trim()?.charAt(0) || "؟"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{s.fullName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {s.weightOverdue ? (
                      <Badge variant="outline" className="gap-1 text-amber-600">
                        <Scale className="size-3" /> وزن
                      </Badge>
                    ) : null}
                    {s.photosOverdue ? (
                      <Badge variant="outline" className="gap-1 text-amber-600">
                        <Camera className="size-3" /> عکس
                      </Badge>
                    ) : null}
                    {s.maxOverdueDays > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {formatFa(s.maxOverdueDays)} روز تأخیر
                      </span>
                    ) : null}
                  </div>
                </div>
                <ChevronLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}
