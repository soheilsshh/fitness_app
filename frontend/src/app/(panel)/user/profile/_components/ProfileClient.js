"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BookOpen,
  Camera,
  CheckCircle2,
  Circle,
  Edit3,
  Image as ImageIcon,
  Lock,
  Save,
  Shield,
  Target,
  User,
} from "lucide-react";
import JalaliDateField from "@/components/forms/JalaliDateField";
import { Logo } from "@/components/Logo";
import PageHeader from "@/app/(panel)/user/_components/ui/PageHeader";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import { gregorianISOToJalali, jalaliToGregorianISO } from "@/lib/date/jalali";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { emitProfileUpdated } from "@/app/(panel)/user/_components/profileEvents";
import { getApiErrorMessage } from "@/lib/api/translateError";
import { cn } from "@/lib/utils";
import ChangePasswordModal from "./ChangePasswordModal";

const EMPTY_JALALI = { year: "", month: "", day: "" };

const GOAL_OPTIONS = [
  { value: "weight_loss", label: "کاهش وزن" },
  { value: "muscle_gain", label: "افزایش حجم عضلانی" },
  { value: "fitness", label: "آمادگی عمومی" },
  { value: "endurance", label: "استقامت" },
  { value: "flexibility", label: "انعطاف‌پذیری" },
  { value: "rehabilitation", label: "بازگشت به تمرین" },
];

const BODY_CONDITIONS = [
  { value: "slim", label: "لاغر" },
  { value: "average", label: "متوسط" },
  { value: "overweight", label: "اضافه وزن" },
  { value: "athletic", label: "ورزشکار" },
  { value: "muscular", label: "عضلانی" },
];

const PHOTO_SLOTS = [
  { type: "front", label: "جلو" },
  { type: "right", label: "راست" },
  { type: "back", label: "عقب" },
  { type: "left", label: "چپ" },
];

const PHOTO_GUIDE = [
  {
    title: "لباس",
    body: "لباس ورزشی چسبان یا لباس زیر مناسب انتخاب کنید تا فرم بدن مشخص باشد.",
  },
  {
    title: "نور",
    body: "در نور طبیعی یا نور یکنواخت بایستید؛ از نور خیلی شدید پشت‌سر خودداری کنید.",
  },
  {
    title: "زاویه",
    body: "دوربین را هم‌ارتفاع کمر بگیرید. چهار نمای جلو، راست، عقب و چپ کافی است.",
  },
  {
    title: "پس‌زمینه",
    body: "دیوار ساده و خلوت بهترین نتیجه را به مربی می‌دهد.",
  },
];

function emptyProfile() {
  return {
    firstName: "",
    lastName: "",
    phone: "",
    birthDate: "",
    birthDateJalali: EMPTY_JALALI,
    nationalId: "",
    gender: "",
    heightCm: "",
    weightKg: "",
    targetWeightKg: "",
    bodyCondition: "",
    bodyFatPercent: "",
    goals: [],
    primaryGoal: "",
    medicalHistory: "",
    injuries: "",
    physicalLimitations: "",
    avatarUrl: "",
    photos: {},
    profileProgress: null,
    programsCount: 0,
    ordersCount: 0,
  };
}

function mapMeToProfile(data) {
  const photoMap = {};
  for (const p of data.photos || []) {
    if (p?.type) photoMap[p.type] = p;
  }
  const goals = Array.isArray(data.goals) ? data.goals : [];
  const matched = GOAL_OPTIONS.find(
    (g) => goals.includes(g.value) || g.label === data.primaryGoal
  );
  const avatarRaw = data.avatarUrl || data.avatar || "";
  return {
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    phone: data.phone || "",
    avatarUrl: avatarRaw ? apiAssetUrl(avatarRaw) : "",
    birthDate: data.birthDate || "",
    birthDateJalali: gregorianISOToJalali(data.birthDate),
    nationalId: data.nationalId || "",
    gender: data.gender || "",
    heightCm: data.heightCm ?? "",
    weightKg: data.weightKg ?? "",
    targetWeightKg: data.targetWeightKg ?? "",
    bodyCondition: data.bodyCondition || "",
    bodyFatPercent: data.bodyFatPercent ?? "",
    goals,
    primaryGoal: matched?.value || goals[0] || "",
    medicalHistory: data.medicalHistory || "",
    injuries: data.injuries || "",
    physicalLimitations: data.physicalLimitations || "",
    photos: photoMap,
    profileProgress: data.profileProgress || null,
    programsCount: data.programsCount || 0,
    ordersCount: data.ordersCount || 0,
  };
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

function AlertBanner({ type, text, onClose }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        type === "success"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
          : "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="break-words">{text}</span>
        <Button type="button" variant="outline" size="xs" onClick={onClose}>
          بستن
        </Button>
      </div>
    </div>
  );
}

export default function ProfileClient() {
  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState("");
  const [toast, setToast] = useState(null);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get("/me");
        if (cancelled) return;
        const mapped = mapMeToProfile(res.data || {});
        setProfile(mapped);
        setDraft(mapped);
      } catch {
        if (!cancelled) {
          setToast({ type: "error", text: "بارگذاری پروفایل ناموفق بود." });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const progress = profile.profileProgress;
  const progressItems = useMemo(
    () => [
      { key: "essentials", done: progress?.essentials, label: "نام و هدف" },
      { key: "body", done: progress?.body, label: "بدن و اندازه‌ها" },
      { key: "medical", done: progress?.medical, label: "سوابق پزشکی" },
      { key: "photos", done: progress?.photos, label: "عکس‌های بدن" },
    ],
    [progress]
  );

  const setDraftField = (key, value) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const onStartEdit = () => {
    setDraft(profile);
    setEditing(true);
  };

  const onCancelEdit = () => {
    setDraft(profile);
    setEditing(false);
  };

  const onSave = async () => {
    const f = String(draft.firstName || "").trim();
    const l = String(draft.lastName || "").trim();
    if (!f || !l) {
      setToast({ type: "error", text: "نام و نام خانوادگی را وارد کنید." });
      return;
    }

    const payload = { firstName: f, lastName: l };

    const { year, month, day } = draft.birthDateJalali || EMPTY_JALALI;
    if (year && month && day) {
      const iso = jalaliToGregorianISO(year, month, day);
      if (!iso) {
        setToast({ type: "error", text: "تاریخ تولد معتبر نیست." });
        return;
      }
      payload.birthDate = iso;
    }

    if (draft.nationalId?.trim()) {
      if (!/^\d{10}$/.test(draft.nationalId.trim())) {
        setToast({ type: "error", text: "کد ملی باید ۱۰ رقم باشد." });
        return;
      }
      payload.nationalId = draft.nationalId.trim();
    }
    if (draft.gender) payload.gender = draft.gender;

    const optionalNumbers = [
      ["heightCm", draft.heightCm, 80, 250, "قد"],
      ["weightKg", draft.weightKg, 20, 300, "وزن"],
      ["targetWeightKg", draft.targetWeightKg, 20, 300, "وزن هدف"],
      ["bodyFatPercent", draft.bodyFatPercent, 1, 60, "درصد چربی"],
    ];
    for (const [key, raw, min, max, label] of optionalNumbers) {
      if (raw === "" || raw == null) continue;
      const num = Number(raw);
      if (!Number.isFinite(num) || num < min || num > max) {
        setToast({
          type: "error",
          text: `${label} نامعتبر است (بین ${min} تا ${max}).`,
        });
        return;
      }
      payload[key] = num;
    }

    if (draft.bodyCondition) payload.bodyCondition = draft.bodyCondition;

    if (draft.primaryGoal || (draft.goals || []).length) {
      const tag = draft.primaryGoal || draft.goals[0];
      const label =
        GOAL_OPTIONS.find((g) => g.value === tag)?.label || draft.primaryGoal;
      payload.goals = [tag];
      payload.primaryGoal = label;
    }

    if (draft.medicalHistory?.trim()) {
      payload.medicalHistory = draft.medicalHistory.trim();
    }
    if (draft.injuries?.trim()) payload.injuries = draft.injuries.trim();
    if (draft.physicalLimitations?.trim()) {
      payload.physicalLimitations = draft.physicalLimitations.trim();
    }

    setSaving(true);
    try {
      const res = await api.patch("/me", payload);
      const mapped = mapMeToProfile(res.data || {});
      // Keep typed photos from current state (PATCH may return all photos).
      mapped.photos = { ...profile.photos, ...mapped.photos };
      setProfile(mapped);
      setDraft(mapped);
      setEditing(false);
      window.localStorage.setItem(
        "profile_complete",
        res.data?.isProfileComplete ? "1" : "0"
      );
      setToast({ type: "success", text: "اطلاعات پروفایل ذخیره شد." });
    } catch (e) {
      setToast({
        type: "error",
        text: getApiErrorMessage(e, "ذخیره ناموفق بود."),
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file) => {
    if (!file?.type?.startsWith("image/")) {
      setToast({ type: "error", text: "فقط فایل تصویر مجاز است." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: "error", text: "حجم عکس باید کمتر از ۵ مگابایت باشد." });
      return;
    }
    setUploadingAvatar(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await api.post("/me/avatar", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.avatarUrl || res.data?.url || "";
      const absolute = url ? apiAssetUrl(url) : "";
      setProfile((prev) => ({ ...prev, avatarUrl: absolute }));
      emitProfileUpdated({
        avatarUrl: absolute,
        percent: profile.profileProgress?.percent,
        name: `${profile.firstName} ${profile.lastName}`.trim(),
      });
      setToast({ type: "success", text: "عکس پروفایل ذخیره شد." });
    } catch (e) {
      setToast({
        type: "error",
        text: getApiErrorMessage(e, "آپلود عکس پروفایل ناموفق بود."),
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const uploadPhoto = async (type, file) => {
    if (!file?.type?.startsWith("image/")) {
      setToast({ type: "error", text: "فقط فایل تصویر مجاز است." });
      return;
    }
    setUploadingType(type);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("type", type);
      const res = await api.post("/me/body-photos", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((prev) => ({
        ...prev,
        photos: { ...prev.photos, [type]: res.data },
      }));
      setDraft((prev) => ({
        ...prev,
        photos: { ...prev.photos, [type]: res.data },
      }));
      // Refresh progress ticks
      const me = await api.get("/me");
      const mapped = mapMeToProfile(me.data || {});
      setProfile((prev) => ({
        ...mapped,
        photos: { ...prev.photos, [type]: res.data },
      }));
      setToast({ type: "success", text: "عکس ذخیره شد." });
    } catch (e) {
      setToast({
        type: "error",
        text: getApiErrorMessage(e, "آپلود عکس ناموفق بود."),
      });
    } finally {
      setUploadingType("");
    }
  };

  const view = editing ? draft : profile;

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="تکمیل پروفایل"
        description="اطلاعات تکمیلی اختیاری‌اند؛ هر زمان آماده‌اید پر کنید تا برنامه دقیق‌تر شود."
        meta={
          <div className="flex flex-wrap gap-2">
            {!editing ? (
              <Button type="button" variant="outline" size="sm" onClick={onStartEdit}>
                <Edit3 data-icon="inline-start" />
                ویرایش
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancelEdit}
                  disabled={saving}
                >
                  انصراف
                </Button>
                <Button type="button" size="sm" onClick={onSave} disabled={saving}>
                  <Save data-icon="inline-start" />
                  {saving ? "در حال ذخیره..." : "ذخیره"}
                </Button>
              </>
            )}
          </div>
        }
      />

      {toast ? (
        <AlertBanner
          type={toast.type}
          text={toast.text}
          onClose={() => setToast(null)}
        />
      ) : null}

      {progress ? (
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">پیشرفت تکمیل</span>
              <span className="tabular-nums text-muted-foreground">
                {(progress.percent ?? 0).toLocaleString("fa-IR")}٪
              </span>
            </div>
            <Progress value={progress.percent ?? 0} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {progressItems.map((item) => (
                <div
                  key={item.key}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs",
                    item.done
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                      : "border-border bg-muted/30 text-muted-foreground"
                  )}
                >
                  {item.done ? (
                    <CheckCircle2 className="size-3.5 shrink-0" />
                  ) : (
                    <Circle className="size-3.5 shrink-0" />
                  )}
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-primary" />
              خلاصه حساب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-background/50 px-4 py-5">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAvatar(file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="relative size-24 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                aria-label="آپلود عکس پروفایل"
              >
                <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-border">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt="عکس پروفایل"
                      className="size-full object-cover"
                    />
                  ) : (
                    <Logo className="h-12 w-12 object-contain opacity-90" />
                  )}
                </span>
                <span className="absolute -bottom-0.5 -start-0.5 inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background">
                  <Camera className="size-4" />
                </span>
              </button>
              <div className="text-center">
                <p className="text-sm font-iranianSansDemiBold">عکس پروفایل</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {uploadingAvatar
                    ? "در حال آپلود..."
                    : "برای تغییر، روی عکس بزنید (تا ۵ مگابایت)"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatBox label="برنامه‌های فعال" value={profile.programsCount} />
              <StatBox label="سفارش‌ها" value={profile.ordersCount} />
            </div>
            <Card size="sm">
              <CardContent className="flex items-center justify-between gap-4 pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">قد</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {profile.heightCm || "—"}{" "}
                    <span className="text-sm font-normal text-muted-foreground">cm</span>
                  </p>
                </div>
                <div className="text-start">
                  <p className="text-xs text-muted-foreground">وزن</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {profile.weightKg || "—"}{" "}
                    <span className="text-sm font-normal text-muted-foreground">kg</span>
                  </p>
                </div>
              </CardContent>
            </Card>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setPwdOpen(true)}
            >
              <Lock data-icon="inline-start" />
              تغییر رمز عبور
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <SectionCard
            id="personal"
            icon={User}
            title="اطلاعات شخصی"
            description="برای شناسایی شما نزد مربی کافی است؛ جزئیات بیشتر اختیاری است."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="نام"
                value={view.firstName}
                onChange={(v) => setDraftField("firstName", v)}
                disabled={!editing}
              />
              <FormField
                label="نام خانوادگی"
                value={view.lastName}
                onChange={(v) => setDraftField("lastName", v)}
                disabled={!editing}
              />
            </div>
            <FormField label="شماره تماس" value={profile.phone} disabled />
            <JalaliDateField
              label="تاریخ تولد (شمسی) — اختیاری"
              year={view.birthDateJalali?.year || ""}
              month={view.birthDateJalali?.month || ""}
              day={view.birthDateJalali?.day || ""}
              disabled={!editing}
              onChange={(parts) => {
                if (!editing) return;
                const iso = jalaliToGregorianISO(parts.year, parts.month, parts.day);
                setDraft((prev) => ({
                  ...prev,
                  birthDateJalali: parts,
                  birthDate: iso || prev.birthDate,
                }));
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="کد ملی — اختیاری"
                value={view.nationalId}
                onChange={(v) =>
                  setDraftField("nationalId", v.replace(/\D/g, "").slice(0, 10))
                }
                disabled={!editing}
                inputMode="numeric"
              />
              <div className="space-y-2">
                <Label>جنسیت — اختیاری</Label>
                <ToggleGroup
                  type="single"
                  value={view.gender}
                  onValueChange={(v) => editing && v && setDraftField("gender", v)}
                  variant="outline"
                  className="grid w-full grid-cols-2"
                  disabled={!editing}
                >
                  <ToggleGroupItem value="male" disabled={!editing}>
                    مرد
                  </ToggleGroupItem>
                  <ToggleGroupItem value="female" disabled={!editing}>
                    زن
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="body"
            icon={Target}
            title="اهداف و اندازه‌های بدن"
            description="برای طراحی دقیق‌تر برنامه — وقتی آماده‌اید تکمیل کنید."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="قد (cm)"
                value={view.heightCm}
                onChange={(v) => setDraftField("heightCm", v)}
                disabled={!editing}
              />
              <NumberField
                label="وزن فعلی (kg)"
                value={view.weightKg}
                onChange={(v) => setDraftField("weightKg", v)}
                disabled={!editing}
              />
              <NumberField
                label="وزن هدف (kg)"
                value={view.targetWeightKg}
                onChange={(v) => setDraftField("targetWeightKg", v)}
                disabled={!editing}
              />
              <NumberField
                label="درصد چربی — اختیاری"
                value={view.bodyFatPercent}
                onChange={(v) => setDraftField("bodyFatPercent", v)}
                disabled={!editing}
              />
            </div>
            <div className="space-y-2">
              <Label>وضعیت بدنی</Label>
              <ToggleGroup
                type="single"
                value={view.bodyCondition}
                onValueChange={(v) =>
                  editing && v && setDraftField("bodyCondition", v)
                }
                variant="outline"
                className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3"
                disabled={!editing}
              >
                {BODY_CONDITIONS.map((c) => (
                  <ToggleGroupItem
                    key={c.value}
                    value={c.value}
                    disabled={!editing}
                    className="text-xs"
                  >
                    {c.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="space-y-2">
              <Label>هدف اصلی</Label>
              <ToggleGroup
                type="single"
                value={view.primaryGoal}
                onValueChange={(v) => {
                  if (!editing || !v) return;
                  setDraft((prev) => ({
                    ...prev,
                    primaryGoal: v,
                    goals: [v],
                  }));
                }}
                variant="outline"
                className="grid w-full grid-cols-2 gap-2"
                disabled={!editing}
              >
                {GOAL_OPTIONS.map((g) => (
                  <ToggleGroupItem
                    key={g.value}
                    value={g.value}
                    disabled={!editing}
                    className="text-xs"
                  >
                    {g.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </SectionCard>

          <SectionCard
            id="medical"
            icon={Shield}
            title="سوابق پزشکی"
            description="این اطلاعات فقط برای طراحی ایمن برنامه تمرین استفاده می‌شود."
          >
            <TextAreaField
              label="سوابق پزشکی"
              value={view.medicalHistory}
              onChange={(v) => setDraftField("medicalHistory", v)}
              disabled={!editing}
              placeholder="در صورت نداشتن: ندارم"
            />
            <TextAreaField
              label="آسیب‌دیدگی‌ها"
              value={view.injuries}
              onChange={(v) => setDraftField("injuries", v)}
              disabled={!editing}
              placeholder="در صورت نداشتن: ندارم"
            />
            <TextAreaField
              label="محدودیت‌های بدنی"
              value={view.physicalLimitations}
              onChange={(v) => setDraftField("physicalLimitations", v)}
              disabled={!editing}
              placeholder="در صورت نداشتن: ندارم"
            />
          </SectionCard>

          <SectionCard
            id="photos"
            icon={ImageIcon}
            title="عکس‌های بدن"
            description="اختیاری — هر زمان خواستید آپلود کنید."
          >
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-3">
              <p className="text-xs text-muted-foreground sm:text-sm">
                نکات نور، لباس و زاویه مناسب
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="gap-1.5">
                    <BookOpen className="size-3.5" />
                    راهنمای گرفتن عکس
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>راهنمای گرفتن عکس بدن</DialogTitle>
                    <DialogDescription>
                      این نکات کمک می‌کند مربی وضعیت بدنی‌تان را دقیق‌تر ببیند.
                    </DialogDescription>
                  </DialogHeader>
                  <ul className="space-y-3 text-sm">
                    {PHOTO_GUIDE.map((item) => (
                      <li
                        key={item.title}
                        className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-start"
                      >
                        <div className="font-medium">{item.title}</div>
                        <p className="mt-1 text-muted-foreground">{item.body}</p>
                      </li>
                    ))}
                  </ul>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs text-emerald-900 dark:text-emerald-100 sm:text-sm">
              <Shield className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <p>
                این تصاویر فقط توسط مربی شما قابل مشاهده است و در هیچ جای دیگری نمایش
                داده نخواهد شد.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {PHOTO_SLOTS.map((slot) => {
                const photo = profile.photos?.[slot.type];
                const isUploading = uploadingType === slot.type;
                return (
                  <div
                    key={slot.type}
                    className="rounded-2xl border border-border/60 bg-card/70 p-3"
                  >
                    <div className="mb-2 text-sm font-medium">نمای {slot.label}</div>
                    {photo?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={apiAssetUrl(photo.url)}
                        alt={slot.label}
                        className="mb-3 h-36 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="mb-3 flex h-36 items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">
                        هنوز آپلود نشده
                      </div>
                    )}
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={!!uploadingType}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadPhoto(slot.type, file);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="pointer-events-none w-full"
                        disabled={!!uploadingType}
                        tabIndex={-1}
                      >
                        {isUploading
                          ? "در حال آپلود..."
                          : photo
                            ? "تغییر عکس"
                            : "انتخاب عکس"}
                      </Button>
                    </label>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>

      <ChangePasswordModal
        open={pwdOpen}
        onClose={() => setPwdOpen(false)}
        onSuccess={(msg) => setToast({ type: "success", text: msg })}
        onError={(msg) => setToast({ type: "error", text: msg })}
      />
    </div>
  );
}

function SectionCard({ id, icon: Icon, title, description, children }) {
  return (
    <Card id={id} className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function StatBox({ label, value }) {
  return (
    <Card size="sm">
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">
          {Number(value || 0).toLocaleString("fa-IR")}
        </p>
      </CardContent>
    </Card>
  );
}

function FormField({ label, value, onChange, disabled, inputMode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value || ""}
        inputMode={inputMode}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

function NumberField({ label, value, onChange, disabled }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="tabular-nums"
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, disabled, placeholder }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={value ?? ""}
        rows={3}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
