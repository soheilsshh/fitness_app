"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  CheckCircle2,
  Circle,
  CreditCard,
  Eye,
  ExternalLink,
  Loader2,
  Phone,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import PanelPagination from "@/app/(panel)/_shared/Pagination";
import FilterChip from "@/app/(panel)/admin/plans/_components/FilterChip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ANSWER_LABELS,
  FUNNEL_PIPELINE,
  GOAL_LABELS,
  QUESTIONS,
  STATUS_LABELS,
} from "@/app/(site)/ali-rashidabadi/_lib/funnelConfig";

const Q_SHORT = {
  primaryGoal: "هدف اصلی",
  activityLevel: "سطح فعالیت روزانه",
  trainingEnv: "محیط تمرین",
  experience: "سابقه تمرینی",
  nutritionChallenge: "چالش تغذیه",
  mainObstacle: "مانع اصلی",
  commitment: "میزان تعهد",
};

const fa = (n) => new Intl.NumberFormat("fa-IR").format(Number(n || 0));

function formatToman(n) {
  return fa(n) + " تومان";
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function answerLabel(key, val) {
  if (!val) return "—";
  if (key === "primaryGoal") return GOAL_LABELS[val] || val;
  return ANSWER_LABELS[key]?.[val] || val;
}

function statusClass(status) {
  return cn(
    status === "paid" &&
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    status === "contacted" &&
      "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    status === "pending_payment" &&
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    status === "failed" &&
      "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
  );
}

function stageIndexOf(status) {
  if (status === "contacted") return 4;
  if (status === "paid") return 3;
  return 2;
}

function parseMetricsLine(body) {
  if (!body) return null;
  const m = String(body).match(/شاخص‌ها:\s*(.+)$/m);
  return m ? m[1].trim() : null;
}

function KpiCard({ icon: Icon, label, value, sub, accent, onClick, active }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Card
      className={cn(
        "overflow-hidden transition",
        onClick && "cursor-pointer hover:border-primary/40",
        active && "border-primary ring-1 ring-primary/30"
      )}
    >
      <CardContent className="p-0">
        <Comp
          type={onClick ? "button" : undefined}
          onClick={onClick}
          className="flex w-full items-start justify-between gap-3 p-4 text-start"
        >
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              accent || "bg-primary/10 text-primary"
            )}
          >
            <Icon className="size-5" />
          </span>
        </Comp>
      </CardContent>
    </Card>
  );
}

function Meta({ label, value, ltr }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn("truncate font-medium text-foreground", ltr && "tabular-nums")}
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function JourneySteps({ status }) {
  const idx = stageIndexOf(status);
  const steps = [
    { n: 1, label: "ارزیابی ۷ سوالی", done: true },
    { n: 2, label: "ثبت نام و موبایل", done: true },
    { n: 3, label: "پرداخت / خرید", done: idx >= 3 },
    { n: 4, label: "تماس تیم مربی", done: idx >= 4 },
  ];
  return (
    <ol className="grid gap-2 sm:grid-cols-2">
      {steps.map((s) => (
        <li
          key={s.n}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm",
            s.done
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-border bg-muted/20 text-muted-foreground"
          )}
        >
          {s.done ? (
            <CheckCircle2 className="size-4 shrink-0 text-primary" />
          ) : (
            <Circle className="size-4 shrink-0 opacity-50" />
          )}
          <span>
            <span className="tabular-nums text-xs text-muted-foreground">مرحله {fa(s.n)} · </span>
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function PipelineBar({ stats, filter, onSelect }) {
  const pending = stats?.pending ?? 0;
  const paid = stats?.paid ?? 0;
  const contacted = stats?.contacted ?? 0;
  const total = Math.max(1, pending + paid + contacted);

  const segments = [
    {
      key: "pending_payment",
      label: FUNNEL_PIPELINE[0].label,
      count: pending,
      color: "bg-amber-500",
      pct: (pending / total) * 100,
    },
    {
      key: "paid",
      label: FUNNEL_PIPELINE[1].label,
      count: paid,
      color: "bg-emerald-500",
      pct: (paid / total) * 100,
    },
    {
      key: "contacted",
      label: FUNNEL_PIPELINE[2].label,
      count: contacted,
      color: "bg-sky-500",
      pct: (contacted / total) * 100,
    },
  ];

  return (
    <Card>
      <CardContent className="space-y-4 p-4 md:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-foreground">مسیر قیف علی رشیدآبادی</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              از ثبت لید تا خرید نهایی و تماس تیم — روی هر مرحله کلیک کنید تا فیلتر شود
            </p>
          </div>
          <Link
            href="/ali-rashidabadi"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            مشاهده صفحه فانل
            <ExternalLink className="size-3.5" />
          </Link>
        </div>

        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          {segments.map((s) =>
            s.count > 0 ? (
              <div
                key={s.key}
                className={cn("h-full transition-all", s.color)}
                style={{ width: `${Math.max(s.pct, 2)}%` }}
                title={`${s.label}: ${s.count}`}
              />
            ) : null
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {segments.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelect(s.key)}
              className={cn(
                "rounded-xl border px-3 py-3 text-start transition",
                filter === s.key
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", s.color)} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="mt-1 text-xl font-extrabold tabular-nums">{fa(s.count)}</p>
              <p className="text-[11px] text-muted-foreground">
                {FUNNEL_PIPELINE.find((p) => p.key === s.key)?.desc}
              </p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function FunnelLeadsClient() {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 20;

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function fetchLeads() {
      setLoading(true);
      try {
        const res = await api.get("/admin/funnel-leads", {
          params: { page, pageSize, status: filter, query: q },
        });
        if (cancelled) return;
        setItems(res.data?.items || []);
        setTotal(res.data?.total || 0);
      } catch {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLeads();
    return () => {
      cancelled = true;
    };
  }, [filter, q, page, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/admin/funnel-stats")
      .then((res) => !cancelled && setStats(res.data))
      .catch(() => !cancelled && setStats(null));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setDetail({ id });
    try {
      const res = await api.get(`/admin/funnel-leads/${id}`);
      setDetail(res.data);
    } catch {
      setDetail(null);
      Swal.fire({
        icon: "error",
        title: "خطا",
        text: "دریافت جزئیات ناموفق بود.",
        confirmButtonText: "باشه",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const markContacted = async (id) => {
    setBusyId(id);
    try {
      await api.patch(`/admin/funnel-leads/${id}`, { status: "contacted" });
      reload();
      if (detail?.id === id) {
        const res = await api.get(`/admin/funnel-leads/${id}`);
        setDetail(res.data);
      }
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (lead) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "حذف لید؟",
      html: `لید <b>${lead.fullName}</b> و تحلیل آن حذف می‌شود.<br/>این عمل قابل بازگشت نیست.`,
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "انصراف",
      confirmButtonColor: "#f43f5e",
    });
    if (!result.isConfirmed) return;

    setBusyId(lead.id);
    try {
      await api.delete(`/admin/funnel-leads/${lead.id}`);
      if (detail?.id === lead.id) setDetail(null);
      reload();
      Swal.fire({
        icon: "success",
        title: "حذف شد",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "خطا",
        text: "حذف انجام نشد.",
        confirmButtonText: "باشه",
      });
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const setFilterReset = (f) => {
    setFilter(f);
    setPage(1);
  };

  const metricsLine = useMemo(
    () => (detail?.analysisBody ? parseMetricsLine(detail.analysisBody) : null),
    [detail]
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div>
        <h1 className="text-xl font-extrabold md:text-2xl">لید و فانل</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          قیف فروش مربی علی رشیدآبادی — وضعیت هر لید، پاسخ سوالات، و خرید نهایی
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats ? (
          <>
            <KpiCard
              icon={Users}
              label="کل لیدها"
              value={fa(stats.totalLeads)}
              sub={`${fa(stats.uniquePeople)} نفر یکتا`}
              onClick={() => setFilterReset("all")}
              active={filter === "all"}
            />
            <KpiCard
              icon={CreditCard}
              label="در انتظار پرداخت"
              value={fa(stats.pending)}
              sub="لید ثبت‌شده بدون خرید"
              accent="bg-amber-500/10 text-amber-500"
              onClick={() => setFilterReset("pending_payment")}
              active={filter === "pending_payment"}
            />
            <KpiCard
              icon={Wallet}
              label="خرید نهایی"
              value={fa(stats.paid)}
              sub={`نرخ پرداخت ${fa(stats.paymentRate)}٪ · درآمد ${formatToman(stats.paidRevenue)}`}
              accent="bg-emerald-500/10 text-emerald-500"
              onClick={() => setFilterReset("paid")}
              active={filter === "paid"}
            />
            <KpiCard
              icon={TrendingUp}
              label="تماس / تبدیل"
              value={fa(stats.contacted)}
              sub={`تماس: ${fa(stats.contacted)} · ثبت‌نام اپ: ${fa(stats.converted)} (${fa(stats.conversionRate)}٪)`}
              accent="bg-sky-500/10 text-sky-500"
              onClick={() => setFilterReset("contacted")}
              active={filter === "contacted"}
            />
          </>
        ) : (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        )}
      </div>

      {stats ? (
        <PipelineBar stats={stats} filter={filter} onSelect={setFilterReset} />
      ) : (
        <Skeleton className="h-40 w-full rounded-xl" />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilterReset("all")}>
          همه
        </FilterChip>
        <FilterChip
          active={filter === "pending_payment"}
          onClick={() => setFilterReset("pending_payment")}
        >
          در انتظار پرداخت
        </FilterChip>
        <FilterChip active={filter === "paid"} onClick={() => setFilterReset("paid")}>
          خرید نهایی
        </FilterChip>
        <FilterChip active={filter === "contacted"} onClick={() => setFilterReset("contacted")}>
          تماس گرفته شد
        </FilterChip>
        <FilterChip active={filter === "failed"} onClick={() => setFilterReset("failed")}>
          ناموفق
        </FilterChip>
      </div>

      <Input
        placeholder="جستجو نام یا شماره..."
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
        className="max-w-sm"
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              لیدی در این فیلتر نیست. لینک فانل:{" "}
              <Link href="/ali-rashidabadi" className="text-primary hover:underline">
                /ali-rashidabadi
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام</TableHead>
                    <TableHead>موبایل</TableHead>
                    <TableHead>هدف</TableHead>
                    <TableHead>مرحله قیف</TableHead>
                    <TableHead>خرید</TableHead>
                    <TableHead>تبدیل اپ</TableHead>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead className="text-end">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((lead) => {
                    const bought =
                      lead.status === "paid" || lead.status === "contacted";
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.fullName}</TableCell>
                        <TableCell dir="ltr" className="text-start tabular-nums">
                          {lead.phone}
                        </TableCell>
                        <TableCell>
                          {GOAL_LABELS[lead.primaryGoal] || lead.primaryGoal}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusClass(lead.status)}>
                            {lead.stageLabel || STATUS_LABELS[lead.status] || lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {bought ? (
                            <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                              بله
                            </Badge>
                          ) : (
                            <span className="text-xs text-amber-600 dark:text-amber-400">خیر</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.converted ? (
                            <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                              <UserCheck className="size-3.5" />
                              ثبت‌نام
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="tabular-nums">{formatToman(lead.amount)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(lead.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="جزئیات و پاسخ‌ها"
                              onClick={() => openDetail(lead.id)}
                            >
                              <Eye className="size-4" />
                            </Button>
                            {lead.status === "paid" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="علامت تماس گرفته شد"
                                disabled={busyId === lead.id}
                                onClick={() => markContacted(lead.id)}
                              >
                                <UserCheck className="size-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" title="تماس" asChild>
                              <a href={`tel:${lead.phone}`}>
                                <Phone className="size-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="حذف"
                              disabled={busyId === lead.id}
                              onClick={() => onDelete(lead)}
                              className="text-rose-500 hover:text-rose-600"
                            >
                              {busyId === lead.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <PanelPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              {detailLoading ? "در حال بارگذاری..." : detail?.fullName}
              {!detailLoading && detail?.status && (
                <Badge variant="outline" className={statusClass(detail.status)}>
                  {detail.stageLabel || STATUS_LABELS[detail.status]}
                </Badge>
              )}
              {!detailLoading && detail?.converted && (
                <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                  <UserCheck className="size-3.5" />
                  کاربر اپ
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              مسیر لید در قیف فروش علی رشیدآبادی + پاسخ‌های ارزیابی
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : detail?.fullName ? (
            <div className="space-y-5">
              <div>
                <h3 className="mb-2 text-sm font-bold">پیشرفت در قیف</h3>
                <JourneySteps status={detail.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                <Meta label="موبایل" value={detail.phone} ltr />
                <Meta label="مربی" value={detail.coachName} />
                <Meta label="مبلغ پکیج" value={formatToman(detail.amount)} />
                <Meta label="کد پیگیری" value={detail.trackingCode || "—"} ltr />
                <Meta label="ثبت لید" value={formatDate(detail.createdAt)} />
                <Meta
                  label="خرید نهایی"
                  value={
                    detail.paidAt
                      ? formatDate(detail.paidAt)
                      : detail.status === "paid" || detail.status === "contacted"
                        ? "بله"
                        : "هنوز نه"
                  }
                />
                <Meta label="تماس تیم" value={detail.contactedAt ? formatDate(detail.contactedAt) : "—"} />
                {(detail.utmSource || detail.utmCampaign) && (
                  <Meta
                    label="منبع (UTM)"
                    value={[detail.utmSource, detail.utmCampaign].filter(Boolean).join(" / ")}
                  />
                )}
              </div>

              {metricsLine && (
                <div className="rounded-xl border border-border bg-card p-4 text-sm">
                  <p className="text-xs text-muted-foreground">شاخص‌های بدنی (از ارزیابی)</p>
                  <p className="mt-1 font-medium leading-7 text-foreground">{metricsLine}</p>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-sm font-bold text-foreground">
                  پاسخ‌های ۷ سوال ارزیابی
                </h3>
                <div className="divide-y divide-border rounded-xl border border-border">
                  {QUESTIONS.map((qq, i) => (
                    <div
                      key={qq.key}
                      className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">سوال {fa(i + 1)}</p>
                        <p className="text-muted-foreground">{Q_SHORT[qq.key] || qq.key}</p>
                      </div>
                      <span className="max-w-[55%] text-end font-medium text-foreground">
                        {answerLabel(qq.key, detail[qq.key])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold text-foreground">تحلیل نهایی ارائه‌شده</h3>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="font-bold text-foreground">{detail.analysisTitle || "—"}</p>
                  {detail.analysisBody && (
                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                      {detail.analysisBody}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${detail.phone}`}>
                    <Phone className="size-4" />
                    تماس
                  </a>
                </Button>
                {detail.status === "paid" && (
                  <Button
                    size="sm"
                    disabled={busyId === detail.id}
                    onClick={() => markContacted(detail.id)}
                  >
                    {busyId === detail.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UserCheck className="size-4" />
                    )}
                    علامت‌گذاری: تماس گرفته شد
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
