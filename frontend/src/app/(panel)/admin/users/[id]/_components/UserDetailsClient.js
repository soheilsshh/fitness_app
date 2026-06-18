"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Phone,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import UserBodySection from "./UserBodySection";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatDateFa(iso) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return "—";
  }
}

function formatToman(n) {
  const num = Number(n) || 0;
  return `${num.toLocaleString("fa-IR")} تومان`;
}

export default function UserDetailsClient({ id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchDetails() {
      setLoading(true);
      try {
        const res = await api.get(`/admin/users/${id}`);
        if (cancelled) return;
        setData(res.data || null);
      } catch (error) {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error("Failed to load admin user details", error);
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) {
      fetchDetails();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle>در حال بارگذاری جزئیات کاربر...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.user) {
    return (
      <Card dir="rtl">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          کاربر پیدا نشد.
        </CardContent>
      </Card>
    );
  }

  const user = data.user;
  const programs = Array.isArray(data.programs) ? data.programs : [];
  const body = data.body || {};
  const activeCount = programs.filter((p) => p.status === "active").length;

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/users" className="inline-flex items-center gap-2">
              <ChevronLeft className="size-4" />
              بازگشت
            </Link>
          </Button>
          <h1 className="text-lg font-extrabold">جزئیات کاربر</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => alert("Demo: open user orders")}
            className="inline-flex items-center gap-2"
          >
            <ShoppingBag className="size-4" />
            سفارش‌ها
          </Button>
          <Button asChild>
            <Link href="/admin/students">رفتن به شاگردها</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>نام و نام خانوادگی</CardDescription>
          <CardTitle className="truncate text-xl">
            {user.firstName} {user.lastName}
          </CardTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            <MetaBadge icon={Phone} label={user.phone} />
            <MetaBadge
              icon={CalendarDays}
              label={`عضویت: ${formatDateFa(user.createdAt)}`}
            />
            <MetaBadge
              icon={Activity}
              label={user.activeProgram ? "برنامه فعال دارد" : "برنامه فعال ندارد"}
              tone={user.activeProgram ? "success" : "neutral"}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <KpiCard
              title="دوره‌های خریداری‌شده"
              value={user.programsCount}
              icon={ClipboardList}
            />
            <KpiCard title="سفارش‌ها" value={user.ordersCount} icon={ShoppingBag} />
            <KpiCard title="دوره‌های فعال" value={activeCount} icon={CheckCircle2} />
          </div>
        </CardContent>
      </Card>

      <UserBodySection
        heightCm={body.heightCm}
        weightKg={body.weightKg}
        photos={body.photos}
      />

      <Card>
        <CardHeader className="flex flex-row items-end justify-between">
          <div>
            <CardTitle>دوره‌های خریداری‌شده</CardTitle>
            <CardDescription>لیست دوره‌ها و وضعیت هر کدام</CardDescription>
          </div>
          <div className="text-xs text-muted-foreground">
            مجموع: <span className="font-bold text-foreground">{programs.length}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {programs.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="pt-4 text-sm text-muted-foreground">
                هنوز دوره‌ای خریداری نشده است.
              </CardContent>
            </Card>
          ) : (
            programs.map((p) => (
              <Card key={p.id} className="bg-muted/20">
                <CardContent className="pt-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold">{p.title}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        نوع:{" "}
                        {p.type === "both"
                          ? "تمرین + تغذیه"
                          : p.type === "workout"
                            ? "تمرین"
                            : "تغذیه"}{" "}
                        • شروع: {formatDateFa(p.startDate)} • مدت: {p.durationDays} روز
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={p.status} />

                      <Badge variant="outline" className="h-auto rounded-md px-3 py-1 text-[11px]">
                        مبلغ:{" "}
                        <span className="mr-1 font-bold text-foreground">
                          {formatToman(p.price)}
                        </span>
                      </Badge>

                      <Button onClick={() => alert("Demo: open program details")}>
                        مشاهده
                      </Button>
                    </div>
                  </div>

                  {p.status === "active" && (
                    <div className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                      این دوره فعال است. {p.remainingDays} روز باقی‌مانده.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetaBadge({ icon: Icon, label, tone = "neutral" }) {
  const toneClass =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "text-foreground";

  return (
    <Badge variant="outline" className={cn("h-auto gap-1.5 rounded-md px-3 py-1.5", toneClass)}>
      <Icon className="size-4" />
      <span>{label}</span>
    </Badge>
  );
}

function KpiCard({ title, value, icon: Icon }) {
  return (
    <Card className="bg-muted/20">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground">{title}</div>
            <div className="mt-1 text-lg font-extrabold">{value}</div>
          </div>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
            <Icon className="size-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusPill({ status }) {
  const isActive = status === "active";
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold",
        isActive
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "text-muted-foreground"
      )}
    >
      {isActive ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
      {isActive ? "فعال" : "اتمام"}
    </Badge>
  );
}
