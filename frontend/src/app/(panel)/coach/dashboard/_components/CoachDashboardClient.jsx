"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Camera,
  CalendarClock,
  ChevronLeft,
  Dumbbell,
  Scale,
  Ticket,
  UserPlus,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { SectionCards } from "@/components/section-cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function CoachDashboardClient() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [attention, setAttention] = useState([]);
  const [attentionLoading, setAttentionLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const statsP = api
        .get("/coach/dashboard/stats")
        .then((r) => r.data)
        .catch(() => null);
      const notifP = api
        .get("/coach/notifications", { params: { limit: 5 } })
        .then((r) => r.data?.items ?? [])
        .catch(() => []);
      const attP = api
        .get("/coach/tracking/students")
        .then((r) => (r.data?.items ?? []).filter((s) => (s.alerts?.length ?? 0) > 0))
        .catch(() => []);

      const [s, n, a] = await Promise.all([statsP, notifP, attP]);
      if (cancelled) return;
      setStats(s);
      setStatsLoading(false);
      setNotifications(n);
      setNotifLoading(false);
      setAttention(a);
      setAttentionLoading(false);
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
    ],
    [stats]
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <SectionCards items={statItems} loading={statsLoading} className="@3xl/main:grid-cols-3" />

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
