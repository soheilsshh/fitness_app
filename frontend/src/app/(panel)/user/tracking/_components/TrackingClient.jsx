"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Scale, Upload } from "lucide-react";
import { api } from "@/lib/axios/client";
import PhotoCompareBox from "@/components/tracking/PhotoCompareBox";
import TrackingAlerts from "@/components/tracking/TrackingAlerts";
import WeightChart from "@/components/tracking/WeightChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const PHOTO_SLOTS = [
  { type: "front", label: "جلو" },
  { type: "back", label: "پشت" },
  { type: "side", label: "بغل" },
];

export default function TrackingClient({ showWeightChart = true }) {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState("");
  const [submittingWeight, setSubmittingWeight] = useState(false);
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

  async function handleWeightSubmit(e) {
    e.preventDefault();
    const value = Number(weight);
    if (!value || value < 20 || value > 300) {
      toast.error("وزن باید بین ۲۰ تا ۳۰۰ کیلوگرم باشد");
      return;
    }
    setSubmittingWeight(true);
    try {
      const res = await api.post("/me/tracking/weight", { weight: value });
      setTracking(res.data);
      setWeight("");
      toast.success("وزن با موفقیت ثبت شد");
    } catch (err) {
      toast.error(err?.response?.data?.error || "ثبت وزن ناموفق بود");
    } finally {
      setSubmittingWeight(false);
    }
  }

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
      <Card dir="rtl">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          برای استفاده از پایش، ابتدا باید اشتراک فعال داشته باشید.
        </CardContent>
      </Card>
    );
  }

  const photoMap = Object.fromEntries(
    (tracking.photoHistories || []).map((h) => [h.type, h.photos || []])
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="text-start">
        <h2 className="text-lg font-semibold tracking-tight">پایش پیشرفت</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          هر {tracking.frequencyDays?.toLocaleString("fa-IR") || "۱۴"} روز یک‌بار وزن و عکس‌های جلو، پشت و بغل را ثبت کنید.
        </p>
        {tracking.nextDueDate && (
          <Badge variant="outline" className="mt-2">
            موعد بعدی:{" "}
            {new Intl.DateTimeFormat("fa-IR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date(tracking.nextDueDate))}
          </Badge>
        )}
      </div>

      <TrackingAlerts alerts={tracking.alerts} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="size-4 text-primary" />
              ثبت وزن
            </CardTitle>
            <CardDescription>وزن فعلی خود را وارد کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWeightSubmit} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[140px] flex-1 space-y-2">
                <Label htmlFor="tracking-weight">وزن (کیلوگرم)</Label>
                <Input
                  id="tracking-weight"
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={tracking.lastWeightKg ? String(tracking.lastWeightKg) : "مثلاً ۷۵"}
                />
              </div>
              <Button type="submit" disabled={submittingWeight}>
                {submittingWeight ? "در حال ثبت..." : "ثبت وزن"}
              </Button>
            </form>
            {tracking.weightSubmitted && (
              <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">
                وزن این دوره ثبت شده است.
              </p>
            )}
          </CardContent>
        </Card>

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
      </div>

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
    </div>
  );
}
