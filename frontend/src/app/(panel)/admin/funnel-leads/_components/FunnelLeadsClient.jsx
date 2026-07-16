"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  CreditCard,
  Eye,
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

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between gap-3 p-4">
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
        background: "#0a0a0a",
        color: "#fff",
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
      background: "#0a0a0a",
      color: "#fff",
    });
    if (!result.isConfirmed) return;

    setBusyId(lead.id);
    try {
      await api.delete(`/admin/funnel-leads/${lead.id}`);
      reload();
      Swal.fire({
        icon: "success",
        title: "حذف شد",
        timer: 1200,
        showConfirmButton: false,
        background: "#0a0a0a",
        color: "#fff",
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "خطا",
        text: "حذف انجام نشد.",
        confirmButtonText: "باشه",
        background: "#0a0a0a",
        color: "#fff",
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

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div>
        <h1 className="text-xl font-extrabold md:text-2xl">قیف فروش</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          لیدهای ارزیابی آنلاین، تحلیل آن‌ها و نرخ تبدیل به کاربر ثبت‌نام‌شده
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats ? (
          <>
            <KpiCard
              icon={TrendingUp}
              label="نرخ تبدیل"
              value={`${fa(stats.conversionRate)}٪`}
              sub={`${fa(stats.converted)} از ${fa(stats.uniquePeople)} نفر ثبت‌نام کرده‌اند`}
              accent="bg-emerald-500/10 text-emerald-500"
            />
            <KpiCard
              icon={Users}
              label="کل لیدها"
              value={fa(stats.totalLeads)}
              sub={`${fa(stats.uniquePeople)} نفر یکتا`}
            />
            <KpiCard
              icon={CreditCard}
              label="پرداخت شده"
              value={fa(stats.paid)}
              sub={`نرخ پرداخت ${fa(stats.paymentRate)}٪`}
              accent="bg-sky-500/10 text-sky-500"
            />
            <KpiCard
              icon={Wallet}
              label="درآمد قیف"
              value={formatToman(stats.paidRevenue)}
              accent="bg-amber-500/10 text-amber-500"
            />
          </>
        ) : (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        )}
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilterReset("all")}>
          همه
        </FilterChip>
        <FilterChip active={filter === "paid"} onClick={() => setFilterReset("paid")}>
          پرداخت شده
        </FilterChip>
        <FilterChip active={filter === "contacted"} onClick={() => setFilterReset("contacted")}>
          تماس گرفته شد
        </FilterChip>
        <FilterChip
          active={filter === "pending_payment"}
          onClick={() => setFilterReset("pending_payment")}
        >
          پرداخت نشده
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

      {/* table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">موردی یافت نشد.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام</TableHead>
                  <TableHead>موبایل</TableHead>
                  <TableHead>هدف</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>تبدیل</TableHead>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead className="text-end">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.fullName}</TableCell>
                    <TableCell dir="ltr" className="text-start tabular-nums">
                      {lead.phone}
                    </TableCell>
                    <TableCell>{GOAL_LABELS[lead.primaryGoal] || lead.primaryGoal}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusClass(lead.status)}>
                        {STATUS_LABELS[lead.status] || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.converted ? (
                        <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                          <UserCheck className="size-3.5" />
                          ثبت‌نام شده
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
                          title="مشاهده جزئیات"
                          onClick={() => openDetail(lead.id)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        {lead.status === "paid" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="تماس گرفته شد"
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <PanelPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              {detailLoading ? "در حال بارگذاری..." : detail?.fullName}
              {!detailLoading && detail?.status && (
                <Badge variant="outline" className={statusClass(detail.status)}>
                  {STATUS_LABELS[detail.status] || detail.status}
                </Badge>
              )}
              {!detailLoading && detail?.converted && (
                <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                  <UserCheck className="size-3.5" />
                  ثبت‌نام شده
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>پاسخ‌های ارزیابی و تحلیل نهایی این لید</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : detail?.fullName ? (
            <div className="space-y-5">
              {/* contact / meta */}
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                <Meta label="موبایل" value={detail.phone} ltr />
                <Meta label="مربی" value={detail.coachName} />
                <Meta label="مبلغ" value={formatToman(detail.amount)} />
                <Meta label="کد پیگیری" value={detail.trackingCode || "—"} ltr />
                <Meta label="تاریخ ثبت" value={formatDate(detail.createdAt)} />
                <Meta label="پرداخت" value={detail.paidAt ? formatDate(detail.paidAt) : "—"} />
                {(detail.utmSource || detail.utmCampaign) && (
                  <Meta
                    label="منبع (UTM)"
                    value={[detail.utmSource, detail.utmCampaign].filter(Boolean).join(" / ")}
                  />
                )}
              </div>

              {/* answers */}
              <div>
                <h3 className="mb-2 text-sm font-bold text-foreground">پاسخ‌های ۷ سوال ارزیابی</h3>
                <div className="divide-y divide-border rounded-xl border border-border">
                  {QUESTIONS.map((qq) => (
                    <div
                      key={qq.key}
                      className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm"
                    >
                      <span className="text-muted-foreground">{Q_SHORT[qq.key] || qq.key}</span>
                      <span className="text-end font-medium text-foreground">
                        {answerLabel(qq.key, detail[qq.key])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* analysis */}
              <div>
                <h3 className="mb-2 text-sm font-bold text-foreground">تحلیل نهایی</h3>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="font-bold text-foreground">{detail.analysisTitle || "—"}</p>
                  {detail.analysisBody && (
                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                      {detail.analysisBody}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
