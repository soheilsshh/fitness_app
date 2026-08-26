"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Moon, Ruler, Scale, Sparkles, Upload } from "lucide-react";
import { api } from "@/lib/axios/client";
import PageHeader from "@/app/(panel)/user/_components/ui/PageHeader";
import PanelEmptyState from "@/app/(panel)/user/_components/ui/PanelEmptyState";
import ProgramOffer from "@/app/(panel)/user/_components/ProgramOffer";
import PhotoCompareBox from "@/components/tracking/PhotoCompareBox";
import { BodyChangesCard, RecoveryCard, WorkoutPerformanceCard } from "@/components/tracking/ProgressReportCards";
import TrackingAlerts from "@/components/tracking/TrackingAlerts";
import WeightChart from "@/components/tracking/WeightChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";

const TRACKING_UNLOCK_PREVIEWS = [
  { emoji: "📈", label: "نمودار هوشمند تغییرات وزن و سایز" },
  { emoji: "📸", label: "آلبوم مقایسه تصویر بدنی (قبل و بعد)" },
  { emoji: "🛡", label: "سیستم هشدار خودکارِ استپ وزنی" },
];

const PHOTO_SLOTS = [
  { type: "front", label: "جلو" },
  { type: "back", label: "پشت" },
  { type: "side", label: "بغل" },
];

const PERIOD_LABEL = { weekly: "هفتگی", monthly: "ماهانه" };

// ProgressReportCard shows the latest AI-written weekly/monthly rollup from
// GET /me/progress/reports (backend normally computes this on a Saturday
// 3am schedule). The "تولید فوری" button calls a TEST-ONLY endpoint
// (POST /me/progress/reports/generate) that computes it on demand, so this
// section can be checked from the frontend without waiting for the scheduler.
function ProgressReportCard() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/me/progress/reports", { params: { pageSize: 1 } });
      setReport(res.data?.items?.[0] || null);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerateNow() {
    setGenerating(true);
    try {
      await api.post("/me/progress/reports/generate");
      await load();
      toast.success("گزارش این هفته تولید شد");
    } catch (err) {
      toast.error(err?.response?.data?.error || "تولید گزارش ناموفق بود");
    } finally {
      setGenerating(false);
    }
  }

  const testButton = (
    <Button type="button" variant="outline" size="sm" onClick={handleGenerateNow} disabled={generating}>
      {generating ? "در حال تولید..." : "تولید فوری گزارش (تست)"}
    </Button>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-2 pt-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            هنوز گزارش هوشمند پیشرفتی برای این هفته ساخته نشده.
          </p>
          {testButton}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-iranianSansDemiBold text-foreground">
          <Sparkles className="size-4 text-primary" />
          گزارش هوشمند پیشرفت
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{PERIOD_LABEL[report.periodType] || report.periodType}</Badge>
          {testButton}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <WorkoutPerformanceCard report={report} />
        <BodyChangesCard report={report} />
        <RecoveryCard report={report} />
      </div>

      {report.analysisText ? (
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              تحلیل خودکار عملکرد شما در بازهٔ{" "}
              {new Intl.DateTimeFormat("fa-IR", { month: "long", day: "numeric" }).format(
                new Date(report.periodStart)
              )}{" "}
              تا{" "}
              {new Intl.DateTimeFormat("fa-IR", { month: "long", day: "numeric" }).format(
                new Date(report.periodEnd)
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-lg border bg-primary/5 p-3 text-sm leading-relaxed text-foreground">
              {report.analysisText}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

const SLEEP_OPTIONS = [1, 2, 3, 4, 5];

// DailyCheckInCard replaces the old "ثبت وزن" card — weight moved here
// (morning weight), plus sleep quality (always) and protein intake (only for
// students without an active nutrition plan, per the backend's DTO flag).
function DailyCheckInCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState("");
  const [sleep, setSleep] = useState(null);
  const [protein, setProtein] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/me/daily-checkin/today");
      const d = res.data || {};
      setData(d);
      setWeight(d.morningWeightKg != null ? String(d.morningWeightKg) : "");
      setSleep(d.sleepQuality ?? null);
      setProtein(d.proteinIntakeG != null ? String(d.proteinIntakeG) : "");
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {};
    const w = Number(weight);
    if (weight && w >= 20 && w <= 300) payload.morningWeightKg = w;
    if (sleep) payload.sleepQuality = sleep;
    if (data && !data.hasNutritionPlan && protein) {
      const p = Number(protein);
      if (p >= 0) payload.proteinIntakeG = p;
    }
    if (Object.keys(payload).length === 0) {
      toast.error("حداقل یک فیلد را وارد کنید");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/me/daily-checkin", payload);
      setData(res.data);
      toast.success("پایش امروز ثبت شد");
    } catch (err) {
      toast.error(err?.response?.data?.error || "ثبت پایش روزانه ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card id="daily-checkin" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="size-4 text-primary" />
          پایش روزانه
        </CardTitle>
        <CardDescription>وزن صبح و کیفیت خواب دیشب را وارد کنید</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-24 w-full rounded-md" />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="daily-weight">وزن صبح (کیلوگرم)</Label>
                <Input
                  id="daily-weight"
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="مثلاً ۷۵"
                />
              </div>
              {data && !data.hasNutritionPlan ? (
                <div className="space-y-2">
                  <Label htmlFor="daily-protein">پروتئین دریافتی امروز (گرم)</Label>
                  <Input
                    id="daily-protein"
                    type="number"
                    min="0"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="مثلاً ۱۲۰"
                  />
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Moon className="size-3.5" />
                کیفیت خواب دیشب
              </Label>
              <ToggleGroup
                type="single"
                value={sleep ? String(sleep) : ""}
                onValueChange={(v) => setSleep(v ? Number(v) : null)}
                variant="outline"
                size="sm"
                className="flex flex-wrap justify-start gap-2"
              >
                {SLEEP_OPTIONS.map((v) => (
                  <ToggleGroupItem key={v} value={String(v)}>
                    {v.toLocaleString("fa-IR")}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "در حال ثبت..." : "ثبت پایش امروز"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// WeeklyCheckInCard: waist circumference only (weight already moved to the
// daily card above).
function WeeklyCheckInCard() {
  const [waist, setWaist] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/me/weekly-checkin/current");
      setWaist(res.data?.waistCm != null ? String(res.data.waistCm) : "");
    } catch {
      // no-op — leave the field empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    const w = Number(waist);
    if (!waist || w <= 0) {
      toast.error("دور کمر را به‌درستی وارد کنید");
      return;
    }
    setSaving(true);
    try {
      await api.post("/me/weekly-checkin", { waistCm: w });
      toast.success("پایش هفتگی ثبت شد");
    } catch (err) {
      toast.error(err?.response?.data?.error || "ثبت پایش هفتگی ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card id="weekly-checkin" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Ruler className="size-4 text-primary" />
          پایش هفتگی
        </CardTitle>
        <CardDescription>دور کمر این هفته را وارد کنید</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-14 w-full rounded-md" />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1 space-y-2">
              <Label htmlFor="weekly-waist">دور کمر (سانتی‌متر)</Label>
              <Input
                id="weekly-waist"
                type="number"
                step="0.1"
                min="0"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                placeholder="مثلاً ۸۵"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "در حال ثبت..." : "ثبت پایش هفتگی"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function TrackingClient({ showWeightChart = true }) {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState(null);
  const fileRefs = useRef({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/me/tracking");
      setTracking(res.data);
    } catch {
      setTracking(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Scroll to the daily/weekly check-in card when arriving from a
  // notification deep link (e.g. /user/tracking#daily-checkin).
  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash?.replace("#", "");
    if (!hash) return;
    const el = document.getElementById(hash);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading]);

  async function handlePhotoUpload(type, file) {
    if (!file) return;
    setUploadingType(type);
    try {
      const form = new FormData();
      form.append("photo", file);
      form.append("type", type);
      await api.post("/me/tracking/photos", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await load();
      toast.success("عکس با موفقیت آپلود شد");
    } catch (err) {
      toast.error(err?.response?.data?.error || "آپلود عکس ناموفق بود");
    } finally {
      setUploadingType(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4" dir="rtl">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
        <PageHeader
          title="پایش هوشمند پیشرفت"
          description="ثبت منظم تغییرات بدنی جهت کالیبراسیون برنامه و پیشگیری از استپ وزنی"
        />
        <PanelEmptyState className="px-4 py-8 sm:px-6">
          <div className="space-y-5 text-center">
            <span
              className="fitino-empty-icon mx-auto flex size-14 items-center justify-center rounded-2xl text-2xl"
              aria-hidden
            >
              📊
            </span>
            <div className="space-y-1.5">
              <p className="font-iranianSansDemiBold text-base text-foreground sm:text-lg">
                سیستم پایش ۲۴ ساعته نیازمند دوره فعال است
              </p>
              <p className="mx-auto max-w-lg text-sm font-iranianSansMedium leading-relaxed text-muted-foreground">
                با فعال‌سازی یکی از پلن‌های زیر، موتور هوشمند فیتینو فعال شده و روند
                تغییرات بدنی شما به‌صورت هفتگی آنالیز می‌شود.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-iranianSansDemiBold text-primary/90 sm:text-sm">
                🌟 امکاناتی که با فعال‌سازی این بخش آزاد می‌شوند
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {TRACKING_UNLOCK_PREVIEWS.map(({ emoji, label }) => (
                  <span
                    key={label}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[11px] font-iranianSansMedium text-primary"
                  >
                    <span className="shrink-0" aria-hidden>
                      {emoji}
                    </span>
                    <span className="truncate">{label}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="text-start">
              <ProgramOffer showIntro={false} />
            </div>
          </div>
        </PanelEmptyState>
      </div>
    );
  }

  const photoMap = Object.fromEntries(
    (tracking.photoHistories || []).map((h) => [h.type, h.photos || []])
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="پایش هوشمند پیشرفت"
        description={`ثبت منظم تغییرات بدنی جهت کالیبراسیون برنامه و پیشگیری از استپ وزنی · هر ${tracking.frequencyDays?.toLocaleString("fa-IR") || "۱۴"} روز یک‌بار وزن و عکس‌های جلو، پشت و بغل را ثبت کنید.`}
        meta={
          tracking.nextDueDate ? (
            <Badge variant="outline" className="fitino-meta-badge px-3.5 py-2">
              موعد بعدی:{" "}
              {new Intl.DateTimeFormat("fa-IR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(new Date(tracking.nextDueDate))}
            </Badge>
          ) : null
        }
      />

      <TrackingAlerts alerts={tracking.alerts} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DailyCheckInCard />
        <WeeklyCheckInCard />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="size-4 text-primary" />
            آپلود عکس‌های پایش
          </CardTitle>
          <CardDescription>عکس جلو، پشت و بغل بدن</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {PHOTO_SLOTS.map((slot) => (
            <div key={slot.type} className="space-y-2">
              <input
                ref={(el) => {
                  fileRefs.current[slot.type] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handlePhotoUpload(slot.type, e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={uploadingType === slot.type}
                onClick={() => fileRefs.current[slot.type]?.click()}
              >
                <Upload className="size-4" />
                {uploadingType === slot.type ? "در حال آپلود..." : slot.label}
              </Button>
              {tracking.photosSubmitted?.[slot.type] && (
                <p className="text-center text-xs text-emerald-600 dark:text-emerald-400">ثبت شد</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {PHOTO_SLOTS.map((slot) => (
          <PhotoCompareBox
            key={slot.type}
            label={slot.label}
            photos={photoMap[slot.type] || []}
          />
        ))}
      </div>

      {showWeightChart && (
        <WeightChart data={tracking.weightHistory || []} loading={false} />
      )}

      <ProgressReportCard />
    </div>
  );
}
