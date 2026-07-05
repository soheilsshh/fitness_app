"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, ExternalLink, Save, Upload } from "lucide-react";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import { getCoachPublicPath } from "@/lib/routes/coach-public";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import CoachAchievementsEditor from "./CoachAchievementsEditor";

function ImageUploadBox({ label, url, onUpload, uploading }) {
  return (
    <Card size="sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-hidden rounded-lg border bg-muted/30">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={apiAssetUrl(url)}
              alt={label}
              className="h-40 w-full object-cover"
            />
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              تصویری انتخاب نشده
            </div>
          )}
        </div>
        <label className="block cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="pointer-events-none w-full"
            disabled={uploading}
            tabIndex={-1}
          >
            <Upload data-icon="inline-start" />
            {uploading ? "در حال آپلود..." : "انتخاب تصویر"}
          </Button>
        </label>
      </CardContent>
    </Card>
  );
}

export default function ProfileClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [slugStatus, setSlugStatus] = useState(null);

  const [form, setForm] = useState({
    slug: "",
    displayName: "",
    title: "",
    bio: "",
    aboutCoach: "",
    specialty: "",
    contactPhone: "",
    instagram: "",
    telegram: "",
    whatsapp: "",
    website: "",
    isPublished: false,
    avatarUrl: "",
    coverImageUrl: "",
    publicUrl: "",
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/coach/profile");
      const p = res.data;
      setForm({
        slug: p.slug || "",
        displayName: p.displayName || "",
        title: p.title || "",
        bio: p.bio || "",
        aboutCoach: p.aboutCoach || "",
        specialty: p.specialty || "",
        contactPhone: p.social?.phone || "",
        instagram: p.social?.instagram || "",
        telegram: p.social?.telegram || "",
        whatsapp: p.social?.whatsapp || "",
        website: p.social?.website || "",
        isPublished: !!p.isPublished,
        avatarUrl: p.avatarUrl || "",
        coverImageUrl: p.coverImageUrl || "",
        publicUrl: p.publicUrl || "",
      });
    } catch (error) {
      toastError("خطا", error?.response?.data?.error || "بارگذاری پروفایل ناموفق بود");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!form.slug || form.slug.length < 3) {
      setSlugStatus(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/coach/profile/slug/check", {
          params: { slug: form.slug },
        });
        setSlugStatus(res.data?.available ? "available" : "taken");
      } catch {
        setSlugStatus(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.slug]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const uploadImage = async (file, endpoint, setUploading, urlKey) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post(endpoint, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.url) {
        updateField(urlKey, res.data.url);
      }
      toastSuccess("آپلود شد", "تصویر با موفقیت ذخیره شد");
    } catch (error) {
      toastError("خطا", error?.response?.data?.error || "آپلود ناموفق بود");
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/coach/profile", {
        slug: form.slug,
        displayName: form.displayName,
        title: form.title,
        bio: form.bio,
        aboutCoach: form.aboutCoach,
        specialty: form.specialty,
        contactPhone: form.contactPhone,
        instagram: form.instagram,
        telegram: form.telegram,
        whatsapp: form.whatsapp,
        website: form.website,
        isPublished: form.isPublished,
      });
      const p = res.data;
      setForm((prev) => ({
        ...prev,
        publicUrl: p.publicUrl || prev.publicUrl,
        isPublished: !!p.isPublished,
      }));
      toastSuccess("ذخیره شد", "پروفایل با موفقیت به‌روزرسانی شد");
    } catch (error) {
      toastError("خطا", error?.response?.data?.error || "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  const copyPublicLink = async () => {
    const path = form.publicUrl || getCoachPublicPath(form.slug);
    const full = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(full);
      toastSuccess("کپی شد", "لینک پروفایل کپی شد");
    } catch {
      toastError("خطا", "کپی لینک ناموفق بود");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-start">
          <h1 className="text-xl font-semibold tracking-tight">پروفایل مربی</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            اطلاعات لندینگ عمومی و راه‌های ارتباطی خود را مدیریت کنید.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={copyPublicLink}>
            <Copy data-icon="inline-start" />
            کپی لینک
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <a
              href={form.publicUrl || getCoachPublicPath(form.slug)}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink data-icon="inline-start" />
              پیش‌نمایش
            </a>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={saving || slugStatus === "taken"}
          >
            <Save data-icon="inline-start" />
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ImageUploadBox
          label="تصویر کاور"
          url={form.coverImageUrl}
          uploading={uploadingCover}
          onUpload={(file) =>
            uploadImage(file, "/coach/profile/cover", setUploadingCover, "coverImageUrl")
          }
        />
        <ImageUploadBox
          label="آواتار"
          url={form.avatarUrl}
          uploading={uploadingAvatar}
          onUpload={(file) =>
            uploadImage(file, "/coach/profile/avatar", setUploadingAvatar, "avatarUrl")
          }
        />
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <FormField
            label="نام نمایشی"
            value={form.displayName}
            onChange={(v) => updateField("displayName", v)}
          />
          <div className="space-y-2">
            <FormField
              label="شناسه لینک (slug)"
              value={form.slug}
              onChange={(v) => updateField("slug", v)}
              dir="ltr"
            />
            {slugStatus === "available" ? (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                شناسه در دسترس است
              </Badge>
            ) : null}
            {slugStatus === "taken" ? (
              <Badge variant="outline" className="border-rose-500/30 text-rose-700 dark:text-rose-300">
                شناسه قبلاً استفاده شده
              </Badge>
            ) : null}
          </div>
          <FormField
            label="عنوان / تخصص کوتاه"
            value={form.title}
            onChange={(v) => updateField("title", v)}
            placeholder="مثلاً مربی بدنسازی"
            className="md:col-span-2"
          />
          <TextFormField
            label="معرفی کوتاه"
            value={form.bio}
            onChange={(v) => updateField("bio", v)}
            rows={3}
            className="md:col-span-2"
          />
          <TextFormField
            label="درباره مربی"
            value={form.aboutCoach}
            onChange={(v) => updateField("aboutCoach", v)}
            rows={5}
            className="md:col-span-2"
          />
          <FormField
            label="تخصص"
            value={form.specialty}
            onChange={(v) => updateField("specialty", v)}
          />
          <FormField
            label="شماره تماس"
            value={form.contactPhone}
            onChange={(v) => updateField("contactPhone", v)}
            dir="ltr"
          />
          <FormField
            label="اینستاگرام"
            value={form.instagram}
            onChange={(v) => updateField("instagram", v)}
            dir="ltr"
          />
          <FormField
            label="تلگرام"
            value={form.telegram}
            onChange={(v) => updateField("telegram", v)}
            dir="ltr"
          />
          <FormField
            label="واتساپ"
            value={form.whatsapp}
            onChange={(v) => updateField("whatsapp", v)}
            dir="ltr"
          />
          <FormField
            label="وب‌سایت"
            value={form.website}
            onChange={(v) => updateField("website", v)}
            dir="ltr"
          />
        </CardContent>
      </Card>

      <CoachAchievementsEditor />

      <Card>
        <CardContent className="flex items-start gap-3 pt-6">
          <Checkbox
            id="is-published"
            checked={form.isPublished}
            onCheckedChange={(checked) => updateField("isPublished", !!checked)}
          />
          <div className="text-start">
            <Label htmlFor="is-published" className="font-medium">
              انتشار پروفایل عمومی
            </Label>
            <CardDescription className="mt-1">
              با فعال‌سازی، لندینگ شما در آدرس عمومی قابل مشاهده خواهد بود.
            </CardDescription>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, dir, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
      />
    </div>
  );
}

function TextFormField({ label, value, onChange, rows = 3, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} />
    </div>
  );
}
