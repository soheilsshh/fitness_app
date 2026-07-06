"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  Save,
  Send,
  Upload,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import {
  getCoachProfile,
  submitProfileRequest,
  updateCoachProfile,
} from "@/lib/api/coach";
import { getApiErrorMessage } from "@/lib/api/translateError";
import { getCoachPublicPath } from "@/lib/routes/coach-public";
import { useCoachProfile } from "@/app/(panel)/coach/_context/CoachProfileContext";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

function ImageUploadBox({ label, url, onUpload, uploading, disabled }) {
  return (
    <Card size="sm" className={cn(disabled && "opacity-70")}>
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
        <label className={cn("block", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled || uploading}
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
            disabled={disabled || uploading}
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

function ProfileStatusBanner({ status }) {
  if (status === "pending") {
    return (
      <Alert variant="warning">
        <AlertCircle />
        <AlertTitle>تکمیل پروفایل برای فعال‌سازی پنل</AlertTitle>
        <AlertDescription>
          <p>
            برای فعال‌سازی پنل مربی، لطفاً اطلاعات زیر را تکمیل کنید: نام نمایشی،
            کد ملی، شهر، شماره تماس، تصاویر پروفایل و در صورت تمایل مدارک و
            افتخارات خود را نیز اضافه کنید.
          </p>
          <p className="mt-2">
            پس از تکمیل، دکمه «ثبت درخواست» را بزنید تا اطلاعات شما برای بررسی
            ادمین ارسال شود.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "reviewing") {
    return (
      <Alert variant="info">
        <Clock />
        <AlertTitle>در انتظار تأیید ادمین</AlertTitle>
        <AlertDescription>
          اطلاعات شما در دست بررسی است. پس از تایید ادمین، پنل شما فعال خواهد شد.
          تا آن زمان امکان ویرایش پروفایل وجود ندارد.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

export default function ProfileClient() {
  const { refreshProfile } = useCoachProfile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
    nationalId: "",
    city: "",
    contactPhone: "",
    instagram: "",
    telegram: "",
    whatsapp: "",
    website: "",
    isPublished: false,
    avatarUrl: "",
    coverImageUrl: "",
    publicUrl: "",
    status: "pending",
  });

  const isReviewing = form.status === "reviewing";
  const isPending = form.status === "pending";
  const isApproved = form.status === "approved";
  const readOnly = isReviewing;

  const applyProfile = useCallback((p) => {
    setForm({
      slug: p.slug || "",
      displayName: p.displayName || "",
      title: p.title || "",
      bio: p.bio || "",
      aboutCoach: p.aboutCoach || "",
      specialty: p.specialty || "",
      nationalId: p.nationalId || "",
      city: p.city || "",
      contactPhone: p.social?.phone || "",
      instagram: p.social?.instagram || "",
      telegram: p.social?.telegram || "",
      whatsapp: p.social?.whatsapp || "",
      website: p.social?.website || "",
      isPublished: !!p.isPublished,
      avatarUrl: p.avatarUrl || "",
      coverImageUrl: p.coverImageUrl || "",
      publicUrl: p.publicUrl || "",
      status: p.status || "pending",
    });
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getCoachProfile();
      applyProfile(p);
    } catch (error) {
      toastError(
        "خطا",
        getApiErrorMessage(error, "بارگذاری پروفایل ناموفق بود"),
      );
    } finally {
      setLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!form.slug || form.slug.length < 3 || readOnly) {
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
  }, [form.slug, readOnly]);

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
      toastError("خطا", getApiErrorMessage(error, "آپلود ناموفق بود"));
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const p = await updateCoachProfile({
        slug: form.slug,
        displayName: form.displayName,
        title: form.title,
        bio: form.bio,
        aboutCoach: form.aboutCoach,
        specialty: form.specialty,
        nationalId: form.nationalId,
        city: form.city,
        contactPhone: form.contactPhone,
        instagram: form.instagram,
        telegram: form.telegram,
        whatsapp: form.whatsapp,
        website: form.website,
        isPublished: form.isPublished,
      });
      applyProfile(p);
      await refreshProfile();
      toastSuccess("ذخیره شد", "پروفایل با موفقیت به‌روزرسانی شد");
    } catch (error) {
      toastError("خطا", getApiErrorMessage(error, "ذخیره ناموفق بود"));
    } finally {
      setSaving(false);
    }
  };

  const onSubmitRequest = async () => {
    setSubmitting(true);
    try {
      await updateCoachProfile({
        slug: form.slug,
        displayName: form.displayName,
        title: form.title,
        bio: form.bio,
        aboutCoach: form.aboutCoach,
        specialty: form.specialty,
        nationalId: form.nationalId,
        city: form.city,
        contactPhone: form.contactPhone,
        instagram: form.instagram,
        telegram: form.telegram,
        whatsapp: form.whatsapp,
        website: form.website,
        isPublished: form.isPublished,
      });

      const res = await submitProfileRequest();
      setForm((prev) => ({ ...prev, status: res.status || "reviewing" }));
      await refreshProfile();
      toastSuccess(
        "درخواست ثبت شد",
        "اطلاعات شما برای بررسی ادمین ارسال شد. پس از تأیید، پنل شما فعال می‌شود.",
      );
    } catch (error) {
      toastError("خطا", getApiErrorMessage(error, "ثبت درخواست ناموفق بود"));
    } finally {
      setSubmitting(false);
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
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <ProfileStatusBanner status={form.status} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-start">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">پروفایل مربی</h1>
            {isPending ? (
              <Badge variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-300">
                در انتظار تکمیل
              </Badge>
            ) : null}
            {isReviewing ? (
              <Badge variant="outline" className="border-sky-500/30 text-sky-700 dark:text-sky-300">
                در حال بررسی
              </Badge>
            ) : null}
            {isApproved ? (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                تأیید شده
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            اطلاعات لندینگ عمومی و راه‌های ارتباطی خود را مدیریت کنید.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyPublicLink}
            disabled={!isApproved}
          >
            <Copy data-icon="inline-start" />
            کپی لینک
          </Button>
          <Button type="button" variant="outline" size="sm" asChild disabled={!isApproved}>
            <a
              href={form.publicUrl || getCoachPublicPath(form.slug)}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!isApproved}
              className={cn(!isApproved && "pointer-events-none opacity-50")}
            >
              <ExternalLink data-icon="inline-start" />
              پیش‌نمایش
            </a>
          </Button>
          {!readOnly ? (
            <Button
              type="button"
              size="sm"
              onClick={onSave}
              disabled={saving || slugStatus === "taken"}
            >
              <Save data-icon="inline-start" />
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          ) : null}
        </div>
      </div>

      <fieldset disabled={readOnly} className="contents">
        <div className="grid gap-4 md:grid-cols-2">
          <ImageUploadBox
            label="تصویر کاور"
            url={form.coverImageUrl}
            uploading={uploadingCover}
            disabled={readOnly}
            onUpload={(file) =>
              uploadImage(file, "/coach/profile/cover", setUploadingCover, "coverImageUrl")
            }
          />
          <ImageUploadBox
            label="آواتار"
            url={form.avatarUrl}
            uploading={uploadingAvatar}
            disabled={readOnly}
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
              disabled={readOnly}
            />
            <div className="space-y-2">
              <FormField
                label="شناسه لینک (slug)"
                value={form.slug}
                onChange={(v) => updateField("slug", v)}
                dir="ltr"
                disabled={readOnly}
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
              disabled={readOnly}
            />
            <FormField
              label="کد ملی"
              value={form.nationalId}
              onChange={(v) => updateField("nationalId", v.replace(/\D/g, "").slice(0, 10))}
              placeholder="۱۰ رقم"
              dir="ltr"
              disabled={readOnly}
            />
            <FormField
              label="شهر"
              value={form.city}
              onChange={(v) => updateField("city", v)}
              placeholder="مثلاً تهران"
              disabled={readOnly}
            />
            <TextFormField
              label="معرفی کوتاه"
              value={form.bio}
              onChange={(v) => updateField("bio", v)}
              rows={3}
              className="md:col-span-2"
              disabled={readOnly}
            />
            <TextFormField
              label="درباره مربی"
              value={form.aboutCoach}
              onChange={(v) => updateField("aboutCoach", v)}
              rows={5}
              className="md:col-span-2"
              disabled={readOnly}
            />
            <FormField
              label="تخصص"
              value={form.specialty}
              onChange={(v) => updateField("specialty", v)}
              disabled={readOnly}
            />
            <FormField
              label="شماره تماس"
              value={form.contactPhone}
              onChange={(v) => updateField("contactPhone", v)}
              dir="ltr"
              disabled={readOnly}
            />
            <FormField
              label="اینستاگرام"
              value={form.instagram}
              onChange={(v) => updateField("instagram", v)}
              dir="ltr"
              disabled={readOnly}
            />
            <FormField
              label="تلگرام"
              value={form.telegram}
              onChange={(v) => updateField("telegram", v)}
              dir="ltr"
              disabled={readOnly}
            />
            <FormField
              label="واتساپ"
              value={form.whatsapp}
              onChange={(v) => updateField("whatsapp", v)}
              dir="ltr"
              disabled={readOnly}
            />
            <FormField
              label="وب‌سایت"
              value={form.website}
              onChange={(v) => updateField("website", v)}
              dir="ltr"
              disabled={readOnly}
            />
          </CardContent>
        </Card>
      </fieldset>

      <CoachAchievementsEditor readOnly={readOnly} />

      {isApproved ? (
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
      ) : null}

      {isPending ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-start">
              <p className="font-medium">آماده ارسال برای بررسی؟</p>
              <p className="mt-1 text-sm text-muted-foreground">
                پس از تکمیل اطلاعات، درخواست خود را ثبت کنید تا تیم ما پروفایل شما را
                بررسی کند.
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              className="w-full shrink-0 sm:w-auto"
              onClick={onSubmitRequest}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
              ) : (
                <Send data-icon="inline-start" />
              )}
              {submitting ? "در حال ارسال..." : "ثبت درخواست"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, dir, className, disabled }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        disabled={disabled}
      />
    </div>
  );
}

function TextFormField({ label, value, onChange, rows = 3, className, disabled }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        disabled={disabled}
      />
    </div>
  );
}
