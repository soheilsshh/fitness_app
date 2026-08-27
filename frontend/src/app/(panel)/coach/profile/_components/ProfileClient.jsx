"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Camera,
  Clock,
  Eye,
  ImagePlus,
  Loader2,
  Lock,
  Plus,
  Save,
  Send,
  X,
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
import {
  isValidIranNationalID,
  normalizeNumericInput,
  toastError,
  toastSuccess,
} from "@/app/(site)/auth/_components/helpers";
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

const BIO_MAX = 150;

const REQUIRED_FIELDS = [
  { key: "coverImageUrl", label: "کاور لندینگ" },
  { key: "avatarUrl", label: "عکس آواتار" },
  { key: "displayName", label: "نام نمایشی" },
  { key: "title", label: "عنوان / تخصص اصلی" },
  { key: "nationalId", label: "کد ملی" },
  { key: "city", label: "شهر محل سکونت" },
  { key: "contactPhone", label: "شماره تماس پشتیبانی" },
  { key: "grade3", label: "مدرک مربی‌گری درجه سه (با تصویر)" },
];

function filled(value) {
  return Boolean(String(value || "").trim());
}

function fieldAnchorId(key) {
  return `coach-profile-${key}`;
}

function getMissingFieldKeys(form, hasGrade3) {
  const missing = [];
  if (!filled(form.coverImageUrl)) missing.push("coverImageUrl");
  if (!filled(form.avatarUrl)) missing.push("avatarUrl");
  if (!filled(form.displayName)) missing.push("displayName");
  if (!filled(form.title)) missing.push("title");
  if (!isValidIranNationalID(form.nationalId)) missing.push("nationalId");
  if (!filled(form.city)) missing.push("city");
  if (!filled(form.contactPhone)) missing.push("contactPhone");
  if (!hasGrade3) missing.push("grade3");
  return missing;
}

function RequiredStar() {
  return (
    <span className="text-destructive" aria-hidden="true">
      *
    </span>
  );
}

function splitSpecialties(value) {
  return String(value || "")
    .split(/[،,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinSpecialties(tags) {
  return tags.join("، ");
}

function publicPathLabel(slug, publicUrl) {
  const path = getCoachPublicPath(slug) || getCoachPublicPath(publicUrl);
  if (!path) return "fitino.app/…";
  return `fitino.app${path}`;
}

function ImageUploadBox({
  id,
  label,
  hint,
  url,
  onUpload,
  uploading,
  disabled,
  icon: Icon,
  required,
}) {
  return (
    <Card
      id={id}
      size="sm"
      className={cn(disabled && "opacity-70", required && "ring-destructive/45")}
    >
      <CardHeader className="pb-3">
        <CardTitle className="inline-flex items-center gap-1 text-sm">
          {label}
          {required ? <RequiredStar /> : null}
        </CardTitle>
        {hint ? <CardDescription>{hint}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className={cn(
            "overflow-hidden rounded-xl border border-dashed bg-muted/30",
            required ? "border-destructive/70" : "border-border/80",
          )}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={apiAssetUrl(url)}
              alt={label}
              className="h-40 w-full object-cover"
            />
          ) : (
            <div className="flex h-40 flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground">
              {Icon ? <Icon className="size-7 text-primary/80" /> : null}
              <span>تصویری انتخاب نشده</span>
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
            {Icon ? <Icon data-icon="inline-start" /> : null}
            {uploading ? "در حال آپلود..." : "بارگذاری تصویر"}
          </Button>
        </label>
      </CardContent>
    </Card>
  );
}

function SpecialtyPills({ value, onChange, disabled }) {
  const tags = useMemo(() => splitSpecialties(value), [value]);
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const next = draft.trim();
    if (!next || disabled) return;
    if (tags.some((t) => t === next)) {
      setDraft("");
      return;
    }
    onChange(joinSpecialties([...tags, next]));
    setDraft("");
  };

  const removeTag = (tag) => {
    if (disabled) return;
    onChange(joinSpecialties(tags.filter((t) => t !== tag)));
  };

  return (
    <div className="space-y-3 md:col-span-2">
      <Label>تخصص‌ها</Label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="gap-1.5 border-primary/25 bg-primary/10 px-2.5 py-1 text-foreground"
          >
            {tag}
            {!disabled ? (
              <button
                type="button"
                className="rounded-sm opacity-70 transition hover:opacity-100"
                onClick={() => removeTag(tag)}
                aria-label={`حذف ${tag}`}
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </Badge>
        ))}
      </div>
      {!disabled ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="مثال: کاهش وزن، هایپرتروفی، آمادگی جسمانی"
          />
          <Button type="button" variant="outline" onClick={addTag} disabled={!draft.trim()}>
            <Plus data-icon="inline-start" />
            افزودن تخصص
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function PrefixedField({ label, prefix, value, onChange, placeholder, disabled, required, invalid }) {
  return (
    <div className="space-y-2">
      <Label className="inline-flex items-center gap-1">
        {label}
        {required ? <RequiredStar /> : null}
      </Label>
      <div
        className={cn(
          "flex overflow-hidden rounded-lg border border-input bg-transparent shadow-xs",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          invalid && "border-destructive ring-3 ring-destructive/20",
          disabled && "opacity-60",
        )}
        dir="ltr"
      >
        <span className="flex shrink-0 items-center border-e border-input bg-muted/40 px-3 text-xs text-muted-foreground">
          {prefix}
        </span>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-required={required || undefined}
          className="border-0 shadow-none focus-visible:ring-0"
          dir="ltr"
        />
      </div>
    </div>
  );
}

function ProfileStatusBanner({ status }) {
  if (status === "pending") {
    return (
      <Alert variant="warning">
        <AlertCircle />
        <AlertTitle>تکمیل پروفایل جهت فعال‌سازی لندینگ اختصاصی</AlertTitle>
        <AlertDescription>
          <p>
            برای انتشار لندینگ عمومی و شروع پذیرش شاگرد، اطلاعات پایه، تصویر پروفایل و
            مدرک مربی‌گری (حداقل درجه ۳) خود را وارد کنید. پس از ثبت، پروفایل شما ظرف
            کمتر از ۲۴ ساعت بررسی می‌شود.
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

function statusBadge(status) {
  if (status === "pending") {
    return (
      <Badge variant="outline" className="border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300">
        وضعیت: در انتظار تکمیل
      </Badge>
    );
  }
  if (status === "reviewing") {
    return (
      <Badge variant="outline" className="border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300">
        وضعیت: در حال بررسی
      </Badge>
    );
  }
  if (status === "approved") {
    return (
      <Badge variant="outline" className="border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
        وضعیت: تأیید شده
      </Badge>
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
  const [hasGrade3, setHasGrade3] = useState(false);
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

  const missingKeys = useMemo(
    () => getMissingFieldKeys(form, hasGrade3),
    [form, hasGrade3],
  );
  const missingSet = useMemo(() => new Set(missingKeys), [missingKeys]);
  const missingLabels = useMemo(
    () =>
      REQUIRED_FIELDS.filter((field) => missingSet.has(field.key)).map(
        (field) => field.label,
      ),
    [missingSet],
  );
  const showMissingMarks = isPending && missingKeys.length > 0;
  const isMissing = (key) => showMissingMarks && missingSet.has(key);
  const profileReady = missingKeys.length === 0;

  const stickyStatusText = useMemo(() => {
    if (isReviewing) return "وضعیت: درخواست شما در حال بررسی است";
    if (isApproved) return "وضعیت: پروفایل تأیید شده است";
    if (profileReady) return "وضعیت: آماده ارسال برای بررسی";
    return "وضعیت: اطلاعات اولیه تکمیل نشده است";
  }, [isApproved, isReviewing, profileReady]);

  const applyProfile = useCallback((p) => {
    setForm({
      slug: p.slug || "",
      displayName: p.displayName || "",
      title: p.title || "",
      bio: p.bio || "",
      aboutCoach: p.aboutCoach || "",
      specialty: p.specialty || "",
      nationalId: normalizeNumericInput(p.nationalId || ""),
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

  const buildPayload = () => {
    const payload = {
      title: form.title,
      bio: form.bio,
      aboutCoach: form.aboutCoach,
      specialty: form.specialty,
      nationalId: normalizeNumericInput(form.nationalId),
      city: form.city,
      contactPhone: form.contactPhone,
      instagram: form.instagram,
      telegram: form.telegram,
      whatsapp: form.whatsapp,
      website: form.website,
    };
    if (isApproved) {
      payload.isPublished = form.isPublished;
    }
    return payload;
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const p = await updateCoachProfile(buildPayload());
      applyProfile(p);
      await refreshProfile();
      toastSuccess("ذخیره شد", "پیش‌نویس پروفایل با موفقیت ذخیره شد");
    } catch (error) {
      toastError("خطا", getApiErrorMessage(error, "ذخیره ناموفق بود"));
    } finally {
      setSaving(false);
    }
  };

  const onSubmitRequest = async () => {
    if (missingKeys.length > 0) {
      const first = missingKeys[0];
      document
        .getElementById(fieldAnchorId(first))
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      toastError(
        "اطلاعات ناقص",
        `این موارد را تکمیل کنید: ${missingLabels.join("، ")}`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await updateCoachProfile(buildPayload());

      const res = await submitProfileRequest();
      setForm((prev) => ({ ...prev, status: res.status || "reviewing" }));
      await refreshProfile();
      toastSuccess(
        "درخواست ثبت شد",
        "اطلاعات شما برای بررسی ادمین ارسال شد. پس از تأیید، پنل شما فعال می‌شود.",
      );
    } catch (error) {
      const msg = getApiErrorMessage(error, "ثبت درخواست ناموفق بود");
      const raw = String(error?.response?.data?.error || "");
      const isGrade3Error =
        raw.includes("grade-3") ||
        raw.includes("Grade3") ||
        raw.includes("مدرک مربی‌گری درجه سه") ||
        msg.includes("grade-3") ||
        msg.includes("مدرک مربی‌گری درجه سه");
      if (isGrade3Error) {
        toastError(
          "مدرک الزامی",
          "برای ارسال درخواست باید «مدرک مربی‌گری درجه سه» را با تصویر در بخش افتخارات ثبت کنید.",
        );
      } else {
        toastError("خطا", msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const previewHref =
    getCoachPublicPath(form.slug) || getCoachPublicPath(form.publicUrl);

  if (loading) {
    return (
      <div className="coach-profile-theme space-y-4 rounded-xl bg-background p-1" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div
      className="coach-profile-theme relative flex min-h-full flex-col gap-4 bg-background pb-28 text-foreground md:gap-6"
      dir="rtl"
    >
      <ProfileStatusBanner status={form.status} />

      <fieldset disabled={readOnly} className="contents">
        {/* Hero: profile & landing identity */}
        <Card>
          <CardHeader className="gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
            <div className="text-start">
              <CardTitle className="text-base">پروفایل و آدرس اختصاصی</CardTitle>
              <CardDescription className="mt-1">
                تصویر کاور، آواتار و هویت عمومی لندینگ شما
              </CardDescription>
            </div>
            {statusBadge(form.status)}
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <ImageUploadBox
                id={fieldAnchorId("coverImageUrl")}
                label="کاور لندینگ"
                hint="پیشنهادی: ۱۲۰۰×۴۰۰"
                icon={ImagePlus}
                url={form.coverImageUrl}
                uploading={uploadingCover}
                disabled={readOnly}
                required={isMissing("coverImageUrl")}
                onUpload={(file) =>
                  uploadImage(file, "/coach/profile/cover", setUploadingCover, "coverImageUrl")
                }
              />
              <ImageUploadBox
                id={fieldAnchorId("avatarUrl")}
                label="عکس آواتار"
                hint="پرتره / تصویر پروفایل"
                icon={Camera}
                url={form.avatarUrl}
                uploading={uploadingAvatar}
                disabled={readOnly}
                required={isMissing("avatarUrl")}
                onUpload={(file) =>
                  uploadImage(file, "/coach/profile/avatar", setUploadingAvatar, "avatarUrl")
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2" id={fieldAnchorId("displayName")}>
                <Label className="inline-flex items-center gap-1.5">
                  نام نمایشی
                  {isMissing("displayName") ? <RequiredStar /> : null}
                  <Lock className="size-3.5 text-muted-foreground" />
                </Label>
                <Input
                  value={form.displayName}
                  disabled
                  dir="rtl"
                  aria-invalid={isMissing("displayName") || undefined}
                />
                <p className="text-xs text-muted-foreground">
                  تنظیم‌شده توسط پشتیبانی — برای تغییر با پشتیبانی تماس بگیرید.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="inline-flex items-center gap-1.5">
                  آدرس اختصاصی لندینگ
                  <Lock className="size-3.5 text-muted-foreground" />
                </Label>
                <Input
                  value={publicPathLabel(form.slug, form.publicUrl)}
                  disabled
                  dir="ltr"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  جهت تغییر با پشتیبانی تماس بگیرید.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main form */}
        <Card>
          <CardHeader className="border-b text-start">
            <CardTitle className="text-base">اطلاعات تخصصی</CardTitle>
            <CardDescription className="mt-1">
              عنوان، مشخصات پایه و تخصص‌هایی که در لندینگ نمایش داده می‌شوند
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
            <FormField
              id={fieldAnchorId("title")}
              label="عنوان / تخصص اصلی"
              value={form.title}
              onChange={(v) => updateField("title", v)}
              placeholder="مثال: مربی رسمی فدراسیون بدنسازی | متخصص اصلاح توده بدنی"
              className="md:col-span-2"
              disabled={readOnly}
              required={isMissing("title")}
              invalid={isMissing("title")}
            />
            <FormField
              id={fieldAnchorId("nationalId")}
              label="کد ملی"
              value={form.nationalId}
              onChange={(v) =>
                updateField("nationalId", normalizeNumericInput(v).slice(0, 10))
              }
              placeholder="۱۰ رقم"
              dir="ltr"
              disabled={readOnly}
              required={isMissing("nationalId")}
              invalid={isMissing("nationalId")}
              hint={
                form.nationalId && !isValidIranNationalID(form.nationalId)
                  ? "کد ملی باید ۱۰ رقم معتبر باشد."
                  : null
              }
            />
            <FormField
              id={fieldAnchorId("city")}
              label="شهر محل سکونت"
              value={form.city}
              onChange={(v) => updateField("city", v)}
              placeholder="مثلاً تهران"
              disabled={readOnly}
              required={isMissing("city")}
              invalid={isMissing("city")}
            />
            <SpecialtyPills
              value={form.specialty}
              onChange={(v) => updateField("specialty", v)}
              disabled={readOnly}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b text-start">
            <CardTitle className="text-base">بیوگرافی و رزومه</CardTitle>
            <CardDescription className="mt-1">
              معرفی کوتاه برای کارت‌ها و متن کامل رزومه در لندینگ
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>معرفی کوتاه (خلاصه رزومه در لندینگ)</Label>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    form.bio.length > BIO_MAX ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {form.bio.length.toLocaleString("fa-IR")} / {BIO_MAX.toLocaleString("fa-IR")}
                </span>
              </div>
              <Textarea
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value.slice(0, BIO_MAX))}
                rows={3}
                disabled={readOnly}
                placeholder="یک جمله جذاب برای کارت‌های معرفی (حداکثر ۱۵۰ کاراکتر)"
              />
              <p className="text-xs text-muted-foreground">
                یک جمله جذاب برای کارت‌های معرفی (حداکثر ۱۵۰ کاراکتر)
              </p>
            </div>
            <div className="space-y-2">
              <Label>درباره مربی (متن کامل رزومه)</Label>
              <Textarea
                value={form.aboutCoach}
                onChange={(e) => updateField("aboutCoach", e.target.value)}
                rows={6}
                disabled={readOnly}
                placeholder="سوابق ورزشی، فلسفه تمرینی و افتخارات خود را مشروح بنویسید."
              />
              <p className="text-xs text-muted-foreground">
                سوابق ورزشی، فلسفه تمرینی و افتخارات خود را مشروح بنویسید.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b text-start">
            <CardTitle className="text-base">راه‌های ارتباطی</CardTitle>
            <CardDescription className="mt-1">
              کانال‌هایی که شاگردان از طریق آن‌ها با شما در ارتباط خواهند بود
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
            <FormField
              id={fieldAnchorId("contactPhone")}
              label="شماره تماس پشتیبانی"
              value={form.contactPhone}
              onChange={(v) => updateField("contactPhone", v)}
              placeholder="09026531451"
              dir="ltr"
              disabled={readOnly}
              required={isMissing("contactPhone")}
              invalid={isMissing("contactPhone")}
            />
            <PrefixedField
              label="آیدی اینستاگرام"
              prefix="instagram.com/"
              value={form.instagram}
              onChange={(v) => updateField("instagram", v)}
              placeholder="آیدی شما"
              disabled={readOnly}
            />
            <PrefixedField
              label="آیدی تلگرام"
              prefix="t.me/"
              value={form.telegram}
              onChange={(v) => updateField("telegram", v)}
              placeholder="آیدی شما"
              disabled={readOnly}
            />
            <FormField
              label="واتساپ"
              value={form.whatsapp}
              onChange={(v) => updateField("whatsapp", v)}
              placeholder="لینک یا شماره واتساپ"
              dir="ltr"
              disabled={readOnly}
            />
            <FormField
              label="وب‌سایت"
              value={form.website}
              onChange={(v) => updateField("website", v)}
              placeholder="لینک اختصاصی"
              dir="ltr"
              disabled={readOnly}
            />
          </CardContent>
        </Card>
      </fieldset>

      <CoachAchievementsEditor
        readOnly={readOnly}
        requiredMissing={isMissing("grade3")}
        onGrade3Change={setHasGrade3}
      />

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

      {/* Sticky action bar */}
      <div className="coach-profile-sticky-bar fixed inset-x-0 bottom-0 z-30 border-t md:inset-s-(--sidebar-width,0px)">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="text-start">
            <p className="text-sm font-medium">{stickyStatusText}</p>
            {showMissingMarks ? (
              <p className="mt-0.5 text-xs text-destructive">
                موارد ناقص: {missingLabels.join("، ")}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isPending
                  ? "پس از تکمیل، درخواست را برای بررسی و فعال‌سازی ارسال کنید."
                  : isReviewing
                    ? "تا پایان بررسی، امکان ویرایش وجود ندارد."
                    : "می‌توانید پیش‌نویس را ذخیره کنید یا لندینگ را پیش‌نمایش کنید."}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {previewHref ? (
              <Button variant="outline" size="sm" asChild>
                <a href={previewHref} target="_blank" rel="noreferrer">
                  <Eye data-icon="inline-start" />
                  پیش‌نمایش لندینگ
                </a>
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" disabled>
                <Eye data-icon="inline-start" />
                پیش‌نمایش لندینگ
              </Button>
            )}
            {!readOnly ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSave}
                disabled={saving || submitting}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                ) : (
                  <Save data-icon="inline-start" />
                )}
                {saving ? "در حال ذخیره..." : "ذخیره پیش‌نویس"}
              </Button>
            ) : null}
            {isPending ? (
              <Button
                type="button"
                size="sm"
                onClick={onSubmitRequest}
                disabled={submitting || saving}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                ) : (
                  <Send data-icon="inline-start" />
                )}
                {submitting ? "در حال ارسال..." : "ثبت نهایی جهت بررسی و فعال‌سازی"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
  placeholder,
  dir,
  className,
  disabled,
  required,
  invalid,
  hint,
}) {
  return (
    <div className={cn("space-y-2", className)} id={id}>
      <Label className="inline-flex items-center gap-1">
        {label}
        {required ? <RequiredStar /> : null}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
      />
      {hint ? <p className="text-xs text-destructive">{hint}</p> : null}
    </div>
  );
}
