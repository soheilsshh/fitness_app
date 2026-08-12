"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";
import { api } from "@/lib/axios/client";
import PageHeader from "@/app/(panel)/user/_components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TYPE_OPTIONS = [
  { value: "result", label: "تضمین نتیجه (عدم پیشرفت با وجود پایبندی)" },
  { value: "quality", label: "تضمین کیفیت خدمات مربی" },
];

const STATUS_META = {
  pending: { label: "در انتظار بررسی", icon: Clock, className: "text-amber-600 dark:text-amber-400" },
  approved: { label: "تأیید شده", icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-400" },
  rejected: { label: "رد شده", icon: XCircle, className: "text-red-600 dark:text-red-400" },
};

function CompliancePercentRow({ label, percent }) {
  const value = Math.round(percent ?? 0);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">{value.toLocaleString("fa-IR")}٪</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

function ComplianceCard({ compliance, loading, error }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4 text-primary" />
          وضعیت پایبندی من
        </CardTitle>
        <CardDescription>
          این اعداد مستقیماً از ثبت‌های واقعی شما (تغذیه، تمرین، جلسات مربی) محاسبه می‌شود
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </>
        ) : error ? (
          <p className="rounded-lg bg-muted/40 px-3 py-4 text-center text-sm text-muted-foreground">
            {error}
          </p>
        ) : compliance ? (
          <>
            <CompliancePercentRow
              label="پایبندی به برنامه تغذیه"
              percent={compliance.nutritionCompliancePercent}
            />
            <CompliancePercentRow
              label="پایبندی به برنامه تمرین"
              percent={compliance.workoutCompliancePercent}
            />
            <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-sm">
              <span>جلسات با مربی</span>
              <span className="tabular-nums font-iranianSansDemiBold">
                {(compliance.coachSessionsCount ?? 0).toLocaleString("fa-IR")}
              </span>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ClaimRow({ claim }) {
  const meta = STATUS_META[claim.status] || STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <div className="space-y-2 rounded-xl border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className={cn("gap-1", meta.className)}>
          <Icon className="size-3.5" />
          {meta.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {claim.createdAt
            ? new Date(claim.createdAt).toLocaleDateString("fa-IR")
            : ""}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        نوع: {claim.type === "result" ? "تضمین نتیجه" : "تضمین کیفیت"}
      </p>
      <p className="text-sm">{claim.reason}</p>
      {claim.resolutionNotes ? (
        <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          پاسخ ادمین: {claim.resolutionNotes}
        </p>
      ) : null}
    </div>
  );
}

export default function GuaranteeClient() {
  const [compliance, setCompliance] = useState(null);
  const [complianceError, setComplianceError] = useState("");
  const [complianceLoading, setComplianceLoading] = useState(true);

  const [claims, setClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(true);

  const [type, setType] = useState("result");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCompliance = useCallback(async () => {
    setComplianceLoading(true);
    setComplianceError("");
    try {
      const res = await api.get("/me/guarantee/compliance");
      setCompliance(res.data);
    } catch (err) {
      setComplianceError(
        err?.response?.data?.error || "اشتراک فعالی برای محاسبه پایبندی یافت نشد"
      );
    } finally {
      setComplianceLoading(false);
    }
  }, []);

  const loadClaims = useCallback(async () => {
    setClaimsLoading(true);
    try {
      const res = await api.get("/me/guarantee/requests");
      setClaims(res.data?.items || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || "بارگذاری درخواست‌ها ناموفق بود");
    } finally {
      setClaimsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompliance();
    loadClaims();
  }, [loadCompliance, loadClaims]);

  const hasOpenClaim = claims.some((c) => c.status === "pending");

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("لطفاً دلیل درخواست را بنویسید");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/me/guarantee/requests", { type, reason: reason.trim() });
      toast.success("درخواست تضمین شما ثبت شد");
      setReason("");
      await loadClaims();
    } catch (err) {
      toast.error(err?.response?.data?.error || "ثبت درخواست ناموفق بود");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="وضعیت تضمین من"
        description="درصد پایبندی شما و درخواست‌های تضمین ثبت‌شده"
      />

      <ComplianceCard
        compliance={compliance}
        loading={complianceLoading}
        error={complianceError}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ثبت درخواست تضمین جدید</CardTitle>
          <CardDescription>
            اگر با وجود پایبندی به برنامه به نتیجه نرسیدید یا از کیفیت خدمات مربی
            راضی نبودید، درخواست خود را ثبت کنید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="توضیح دهید که چرا این درخواست را ثبت می‌کنید..."
            rows={4}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={submitting || hasOpenClaim}
              onClick={handleSubmit}
            >
              {hasOpenClaim ? "یک درخواست باز در انتظار بررسی است" : "ثبت درخواست"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <p className="text-sm font-iranianSansDemiBold text-foreground">
          تاریخچه درخواست‌های من
        </p>
        {claimsLoading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : claims.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              هنوز درخواست تضمینی ثبت نکرده‌اید
            </CardContent>
          </Card>
        ) : (
          claims.map((claim) => <ClaimRow key={claim.id} claim={claim} />)
        )}
      </div>
    </div>
  );
}
