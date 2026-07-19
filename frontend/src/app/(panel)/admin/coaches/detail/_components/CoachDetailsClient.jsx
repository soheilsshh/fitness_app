"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { api } from "@/lib/axios/client";
import { getApiErrorMessage } from "@/lib/api/translateError";
import { getCoachPublicPath } from "@/lib/routes/coach-public";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function CoachDetailsClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branding, setBranding] = useState({ displayName: "", slug: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/coaches/${id}`);
      setCoach(res.data);
      setBranding({
        displayName: res.data?.displayName || "",
        slug: res.data?.slug || "",
      });
    } catch {
      setCoach(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (patchBody) => {
    setSaving(true);
    try {
      const res = await api.patch(`/admin/coaches/${id}`, patchBody);
      setCoach(res.data);
      setBranding({
        displayName: res.data?.displayName || "",
        slug: res.data?.slug || "",
      });
      return true;
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "خطا",
        text: getApiErrorMessage(error, "بروزرسانی انجام نشد."),
        confirmButtonText: "باشه",
        background: "#0a0a0a",
        color: "#fff",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveBranding = async () => {
    const displayName = branding.displayName.trim();
    const slug = branding.slug.trim();
    if (!displayName) {
      await Swal.fire({
        icon: "warning",
        title: "نام نمایشی الزامی است",
        confirmButtonText: "باشه",
      });
      return;
    }
    const ok = await patch({ displayName, slug });
    if (ok) {
      await Swal.fire({
        icon: "success",
        title: "ذخیره شد",
        text: "نام نمایشی و شناسه لینک به‌روز شد.",
        confirmButtonText: "باشه",
        timer: 1800,
        showConfirmButton: false,
      });
    }
  };

  if (loading) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle>در حال بارگذاری...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!coach) {
    return (
      <Card dir="rtl">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          مربی پیدا نشد.
        </CardContent>
      </Card>
    );
  }

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/coaches" className="inline-flex items-center gap-2">
              <ChevronLeft className="size-4" />
              بازگشت
            </Link>
          </Button>
          <h1 className="text-lg font-extrabold">{coach.displayName}</h1>
        </div>
        {coach.isPublished && coach.slug ? (
          <Button asChild variant="outline">
            <Link
              href={getCoachPublicPath(coach.slug)}
              target="_blank"
              className="inline-flex items-center gap-2"
            >
              صفحه عمومی
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>برندینگ عمومی</CardTitle>
          <CardDescription>
            نام نمایشی و شناسه لینک فقط توسط ادمین تنظیم می‌شود؛ مربی نمی‌تواند
            آن‌ها را تغییر دهد.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="admin-display-name">نام نمایشی</Label>
              <Input
                id="admin-display-name"
                value={branding.displayName}
                onChange={(e) =>
                  setBranding((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
                placeholder="مثلاً علی رضایی"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-slug">شناسه لینک (slug)</Label>
              <Input
                id="admin-slug"
                dir="ltr"
                value={branding.slug}
                onChange={(e) =>
                  setBranding((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="ali-rezaei"
                disabled={saving}
              />
            </div>
          </div>
          <Button type="button" onClick={saveBranding} disabled={saving}>
            {saving ? "در حال ذخیره..." : "ذخیره برندینگ"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>جزئیات مربی</CardTitle>
          <CardDescription>اطلاعات عمومی و وضعیت انتشار</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoItem label="عنوان" value={coach.title || "—"} />
            <InfoItem
              label="اسلاگ فعلی"
              value={coach.slug ? `/${coach.slug}` : "—"}
            />
            <InfoItem label="تخصص" value={coach.specialty || "—"} />
            <InfoItem label="تعداد دانشجویان" value={coach.studentCount} />
          </div>

          {coach.bio ? (
            <Card className="mt-6 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-sm">بیو</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
                {coach.bio}
              </CardContent>
            </Card>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Badge variant="outline" className="h-auto rounded-md px-3 py-2">
              وضعیت ذخیره: {saving ? "در حال ذخیره..." : "آماده"}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <ToggleButton
              label="انتشار"
              active={coach.isPublished}
              disabled={saving}
              onToggle={() => patch({ isPublished: !coach.isPublished })}
              activeText="منتشر شده"
              inactiveText="پیش‌نویس"
            />
            <ToggleButton
              label="وضعیت"
              active={coach.isActive}
              disabled={saving}
              onToggle={() => patch({ isActive: !coach.isActive })}
              activeText="فعال"
              inactiveText="غیرفعال"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleButton({
  label,
  active,
  disabled,
  onToggle,
  activeText,
  inactiveText,
}) {
  return (
    <Button
      variant="outline"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "h-auto px-4 py-3 text-sm font-extrabold transition disabled:opacity-50",
        active
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300"
          : "text-muted-foreground",
      )}
    >
      {label}: {active ? activeText : inactiveText}
    </Button>
  );
}

function InfoItem({ label, value }) {
  return (
    <Card className="bg-muted/20">
      <CardContent className="pt-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-sm font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
