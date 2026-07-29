"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Camera,
  Check,
  Lock,
  RefreshCw,
  Save,
  Shield,
} from "lucide-react";
import JalaliDateField from "@/components/forms/JalaliDateField";
import { Logo } from "@/components/Logo";
import PageHeader from "@/app/(panel)/user/_components/ui/PageHeader";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import { gregorianISOToJalali, jalaliToGregorianISO } from "@/lib/date/jalali";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { emitProfileUpdated } from "@/app/(panel)/user/_components/profileEvents";
import { getApiErrorMessage } from "@/lib/api/translateError";
import { cn } from "@/lib/utils";
import ChangePasswordModal from "./ChangePasswordModal";

const EMPTY_JALALI = { year: "", month: "", day: "" };
const MEDICAL_NONE = "ندارم";

const GOAL_OPTIONS = [
  { value: "muscle_gain", label: "افزایش حجم عضلانی" },
  { value: "weight_loss", label: "کاهش وزن و چربی‌سوزی" },
  { value: "fitness", label: "آمادگی عمومی" },
  { value: "endurance", label: "استقامت" },
  { value: "rehabilitation", label: "بازگشت به تمرین" },
];

const BODY_CONDITIONS = [
  { value: "slim", label: "لاغر" },
  { value: "average", label: "متوسط" },
  { value: "muscular", label: "عضلانی" },
  { value: "overweight", label: "اضافه وزن" },
  { value: "athletic", label: "ورزشکار" },
];

const PHOTO_SLOTS = [
  { type: "front", label: "جلو" },
  { type: "back", label: "عقب" },
  { type: "right", label: "راست" },
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

const PROFILE_TABS = [
  { id: "personal", emoji: "👤", label: "اطلاعات شخصی" },
  { id: "body", emoji: "📏", label: "اهداف و اندازه‌ها" },
  { id: "medical", emoji: "🏥", label: "سوابق پزشکی" },
  { id: "photos", emoji: "📸", label: "عکس‌های بدن" },
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

function isMedicalNone(value) {
  const v = String(value || "").trim();
  return !v || v === MEDICAL_NONE;
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

function sectionStats(draft) {
  const personalChecks = [
    Boolean(String(draft.firstName || "").trim()),
    Boolean(String(draft.lastName || "").trim()),
    Boolean(draft.gender),
    Boolean(
      draft.birthDateJalali?.year &&
        draft.birthDateJalali?.month &&
        draft.birthDateJalali?.day
    ),
  ];
  const bodyChecks = [
    Number(draft.heightCm) > 0,
    Number(draft.weightKg) > 0,
    Number(draft.targetWeightKg) > 0,
    Boolean(draft.bodyCondition),
    Boolean(draft.primaryGoal || (draft.goals || []).length),
  ];
  const medicalChecks = [
    Boolean(String(draft.medicalHistory || "").trim()),
    Boolean(String(draft.injuries || "").trim()),
    Boolean(String(draft.physicalLimitations || "").trim()),
  ];
  const photoChecks = PHOTO_SLOTS.map((s) => Boolean(draft.photos?.[s.type]?.url));

  const pct = (checks) =>
    checks.length
      ? Math.round((checks.filter(Boolean).length / checks.length) * 100)
      : 0;

  return {
    personal: {
      percent: pct(personalChecks),
      done: Boolean(
        String(draft.firstName || "").trim() && String(draft.lastName || "").trim()
      ),
    },
    body: {
      percent: pct(bodyChecks),
      done: bodyChecks.every(Boolean),
    },
    medical: {
      percent: pct(medicalChecks),
      done: medicalChecks.every(Boolean),
    },
    photos: {
      percent: pct(photoChecks),
      done: photoChecks.every(Boolean),
    },
  };
}

function ProfileSkeleton() {
  return (
    <div
      className="profile-theme flex min-h-full flex-col gap-4 bg-background text-foreground md:gap-6"
      dir="rtl"
    >
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-24 w-full rounded-xl" />
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
        <span className="wrap-break-word">{text}</span>
        <Button type="button" variant="outline" size="xs" onClick={onClose}>
          بستن
        </Button>
      </div>
    </div>
  );
}

function PillOption({ selected, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-2 text-xs font-iranianSansMedium transition-colors sm:text-sm",
        selected
          ? "border-primary bg-primary/15 text-primary"
          : "border-border/70 bg-background/60 text-muted-foreground hover:border-primary/35 hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export default function ProfileClient() {
  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const [savingSection, setSavingSection] = useState("");
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

  const stats = useMemo(() => sectionStats(draft), [draft]);

  const setDraftField = (key, value) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const applySaved = (mapped, { keepPhotos = true, isProfileComplete } = {}) => {
    const next = { ...mapped };
    if (keepPhotos) {
      next.photos = { ...profile.photos, ...mapped.photos };
    }
    setProfile(next);
    setDraft(next);
    if (typeof isProfileComplete === "boolean") {
      window.localStorage.setItem(
        "profile_complete",
        isProfileComplete ? "1" : "0"
      );
    }
    emitProfileUpdated({
      avatarUrl: next.avatarUrl,
      percent: next.profileProgress?.percent,
      name: `${next.firstName} ${next.lastName}`.trim(),
    });
  };

  const validateNumber = (raw, min, max, label) => {
    if (raw === "" || raw == null) return { ok: true, value: undefined };
    const num = Number(raw);
    if (!Number.isFinite(num) || num < min || num > max) {
      return {
        ok: false,
        error: `${label} نامعتبر است (بین ${min} تا ${max}).`,
      };
    }
    return { ok: true, value: num };
  };

  const savePersonal = async () => {
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

    setSavingSection("personal");
    try {
      const res = await api.patch("/me", payload);
      applySaved(mapMeToProfile(res.data || {}), {
        isProfileComplete: res.data?.isProfileComplete,
      });
      setToast({ type: "success", text: "اطلاعات شخصی ذخیره شد." });
    } catch (e) {
      setToast({
        type: "error",
        text: getApiErrorMessage(e, "ذخیره ناموفق بود."),
      });
    } finally {
      setSavingSection("");
    }
  };

  const saveBody = async () => {
    const payload = {};
    const fields = [
      ["heightCm", draft.heightCm, 80, 250, "قد"],
      ["weightKg", draft.weightKg, 20, 300, "وزن"],
      ["targetWeightKg", draft.targetWeightKg, 20, 300, "وزن هدف"],
      ["bodyFatPercent", draft.bodyFatPercent, 1, 60, "درصد چربی"],
    ];
    for (const [key, raw, min, max, label] of fields) {
      const result = validateNumber(raw, min, max, label);
      if (!result.ok) {
        setToast({ type: "error", text: result.error });
        return;
      }
      if (result.value !== undefined) payload[key] = result.value;
    }
    if (draft.bodyCondition) payload.bodyCondition = draft.bodyCondition;
    if (draft.primaryGoal || (draft.goals || []).length) {
      const tag = draft.primaryGoal || draft.goals[0];
      const label =
        GOAL_OPTIONS.find((g) => g.value === tag)?.label || draft.primaryGoal;
      payload.goals = [tag];
      payload.primaryGoal = label;
    }

    setSavingSection("body");
    try {
      const res = await api.patch("/me", payload);
      applySaved(mapMeToProfile(res.data || {}), {
        isProfileComplete: res.data?.isProfileComplete,
      });
      setToast({ type: "success", text: "اهداف و اندازه‌ها ذخیره شد." });
    } catch (e) {
      setToast({
        type: "error",
        text: getApiErrorMessage(e, "ذخیره ناموفق بود."),
      });
    } finally {
      setSavingSection("");
    }
  };

  const saveMedical = async () => {
    const payload = {
      medicalHistory: String(draft.medicalHistory || "").trim() || MEDICAL_NONE,
      injuries: String(draft.injuries || "").trim() || MEDICAL_NONE,
      physicalLimitations:
        String(draft.physicalLimitations || "").trim() || MEDICAL_NONE,
    };

    setSavingSection("medical");
    try {
      const res = await api.patch("/me", payload);
      applySaved(mapMeToProfile(res.data || {}), {
        isProfileComplete: res.data?.isProfileComplete,
      });
      setToast({ type: "success", text: "سوابق پزشکی ذخیره شد." });
    } catch (e) {
      setToast({
        type: "error",
        text: getApiErrorMessage(e, "ذخیره ناموفق بود."),
      });
    } finally {
      setSavingSection("");
    }
  };

  const savePhotosSection = async () => {
    setSavingSection("photos");
    try {
      const me = await api.get("/me");
      const mapped = mapMeToProfile(me.data || {});
      applySaved(mapped, {
        keepPhotos: false,
        isProfileComplete: me.data?.isProfileComplete,
      });
      setToast({
        type: "success",
        text: stats.photos.done
          ? "آلبوم بدن به‌روز است."
          : "عکس‌ها با آپلود ذخیره می‌شوند؛ در صورت نیاز نماهای باقی‌مانده را اضافه کنید.",
      });
    } catch (e) {
      setToast({
        type: "error",
        text: getApiErrorMessage(e, "بروزرسانی وضعیت عکس‌ها ناموفق بود."),
      });
    } finally {
      setSavingSection("");
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
      setDraft((prev) => ({ ...prev, avatarUrl: absolute }));
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
      const me = await api.get("/me");
      const mapped = mapMeToProfile(me.data || {});
      const withPhoto = {
        ...mapped,
        photos: { ...mapped.photos, [type]: res.data },
      };
      setProfile(withPhoto);
      setDraft(withPhoto);
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

  const setMedicalMode = (field, mode) => {
    if (mode === "no") {
      setDraftField(field, MEDICAL_NONE);
      return;
    }
    setDraft((prev) => ({
      ...prev,
      [field]: isMedicalNone(prev[field]) ? "" : prev[field],
    }));
  };

  if (loading) return <ProfileSkeleton />;

  const overallPercent = Math.round(
    Object.values(stats).reduce((sum, s) => sum + s.percent, 0) / 4
  );

  return (
    <div
      className="profile-theme flex min-h-full flex-col gap-4 bg-background text-foreground md:gap-6"
      dir="rtl"
    >
      <PageHeader
        title="تکمیل پروفایل"
        description="هر بخش را جداگانه تکمیل و ذخیره کنید؛ بدون اسکرول طولانی بین تب‌ها جابه‌جا شوید."
        meta={
          <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-iranianSansMedium tabular-nums text-primary">
            پیشرفت کلی {(overallPercent || 0).toLocaleString("fa-IR")}٪
          </span>
        }
      />

      {toast ? (
        <AlertBanner
          type={toast.type}
          text={toast.text}
          onClose={() => setToast(null)}
        />
      ) : null}

      {/* Stepper */}
      <nav aria-label="مراحل تکمیل پروفایل" className="w-full">
        <ol className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {PROFILE_TABS.map((tab, index) => {
            const section = stats[tab.id];
            const active = activeTab === tab.id;
            return (
              <li key={tab.id} className="relative min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex h-full w-full flex-col gap-2 rounded-2xl border px-3 py-3 text-start transition-colors",
                    active
                      ? "border-primary/45 bg-primary/10 shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_20%,transparent)]"
                      : "border-border/70 bg-card/70 hover:border-primary/30 hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5 text-xs font-iranianSansDemiBold text-foreground sm:text-sm">
                      <span aria-hidden>{tab.emoji}</span>
                      <span className="leading-snug">{tab.label}</span>
                    </span>
                    {section.done ? (
                      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] tabular-nums text-muted-foreground">
                        {(index + 1).toLocaleString("fa-IR")}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        section.done ? "bg-emerald-500" : "bg-primary"
                      )}
                      style={{ width: `${section.percent}%` }}
                      aria-hidden
                    />
                    <span className="sr-only">
                      {section.percent.toLocaleString("fa-IR")} درصد تکمیل
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Tab panels */}
      {activeTab === "personal" ? (
        <Card className="min-w-0 overflow-visible">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">اطلاعات شخصی و حساب کاربری</CardTitle>
            <CardDescription>
              مشخصات پایه و خلاصه حساب در یک نمای فشرده دو ستونه.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 space-y-5">
            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
              {/* RTL: first cell = right = account summary */}
              <aside className="min-w-0 space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
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
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="relative size-16 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                    aria-label="تغییر عکس پروفایل"
                  >
                    <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-border">
                      {draft.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={draft.avatarUrl}
                          alt="عکس پروفایل"
                          className="size-full object-cover"
                        />
                      ) : (
                        <Logo className="h-8 w-8 object-contain opacity-90" />
                      )}
                    </span>
                    <span className="absolute -bottom-0.5 -start-0.5 inline-flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background">
                      <Camera className="size-3" />
                    </span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-iranianSansDemiBold">عکس پروفایل</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 gap-1.5"
                      disabled={uploadingAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <Camera className="size-3.5" />
                      {uploadingAvatar ? "در حال آپلود..." : "تغییر عکس"}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-lg border border-border/70 bg-background/70 px-2.5 py-1.5">
                    برنامه‌های فعال:{" "}
                    <span className="font-iranianSansDemiBold tabular-nums text-foreground">
                      {Number(profile.programsCount || 0).toLocaleString("fa-IR")}
                    </span>
                  </span>
                  <span className="rounded-lg border border-border/70 bg-background/70 px-2.5 py-1.5">
                    سفارش‌ها:{" "}
                    <span className="font-iranianSansDemiBold tabular-nums text-foreground">
                      {Number(profile.ordersCount || 0).toLocaleString("fa-IR")}
                    </span>
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-1.5"
                  onClick={() => setPwdOpen(true)}
                >
                  <Lock className="size-4" />
                  تغییر رمز عبور
                </Button>
              </aside>

              {/* RTL: second cell = left = personal form */}
              <div className="min-w-0 space-y-4 rounded-2xl border border-border/70 bg-card/40 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField
                    label="نام"
                    value={draft.firstName}
                    onChange={(v) => setDraftField("firstName", v)}
                  />
                  <FormField
                    label="نام خانوادگی"
                    value={draft.lastName}
                    onChange={(v) => setDraftField("lastName", v)}
                  />
                </div>
                <FormField
                  label="شماره تماس"
                  value={profile.phone}
                  disabled
                  hint="غیرقابل تغییر"
                />
                <JalaliDateField
                  label="تاریخ تولد"
                  year={draft.birthDateJalali?.year || ""}
                  month={draft.birthDateJalali?.month || ""}
                  day={draft.birthDateJalali?.day || ""}
                  onChange={(parts) => {
                    const iso = jalaliToGregorianISO(
                      parts.year,
                      parts.month,
                      parts.day
                    );
                    setDraft((prev) => ({
                      ...prev,
                      birthDateJalali: parts,
                      birthDate: iso || prev.birthDate,
                    }));
                  }}
                />
                <FormField
                  label="کد ملی — اختیاری"
                  value={draft.nationalId}
                  onChange={(v) =>
                    setDraftField("nationalId", v.replace(/\D/g, "").slice(0, 10))
                  }
                  inputMode="numeric"
                />
                <div className="space-y-2">
                  <Label>جنسیت</Label>
                  <div className="flex flex-wrap gap-2">
                    <PillOption
                      selected={draft.gender === "male"}
                      onClick={() => setDraftField("gender", "male")}
                      className="min-w-24"
                    >
                      مرد
                    </PillOption>
                    <PillOption
                      selected={draft.gender === "female"}
                      onClick={() => setDraftField("gender", "female")}
                      className="min-w-24"
                    >
                      زن
                    </PillOption>
                  </div>
                </div>
              </div>
            </div>

            <SectionSaveBar
              saving={savingSection === "personal"}
              onSave={savePersonal}
            />
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "body" ? (
        <Card className="min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">شاخص‌ها و هدف‌گذاری بدنی</CardTitle>
            <CardDescription>
              این داده‌ها مبنای اصلی محاسبه کالری و تنظیم برنامه‌های شما هستند.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <NumberField
                label="قد"
                suffix="cm"
                value={draft.heightCm}
                onChange={(v) => setDraftField("heightCm", v)}
              />
              <NumberField
                label="وزن فعلی"
                suffix="kg"
                value={draft.weightKg}
                onChange={(v) => setDraftField("weightKg", v)}
              />
              <NumberField
                label="وزن هدف"
                suffix="kg"
                value={draft.targetWeightKg}
                onChange={(v) => setDraftField("targetWeightKg", v)}
              />
              <NumberField
                label="درصد چربی — اختیاری"
                suffix="٪"
                value={draft.bodyFatPercent}
                onChange={(v) => setDraftField("bodyFatPercent", v)}
              />
            </div>

            <div className="space-y-2">
              <Label>وضعیت فعلی بدن</Label>
              <div className="flex flex-wrap gap-2">
                {BODY_CONDITIONS.map((c) => (
                  <PillOption
                    key={c.value}
                    selected={draft.bodyCondition === c.value}
                    onClick={() => setDraftField("bodyCondition", c.value)}
                  >
                    {c.label}
                  </PillOption>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>هدف اصلی شما در فیتینو</Label>
              <div className="flex flex-wrap gap-2">
                {GOAL_OPTIONS.map((g) => (
                  <PillOption
                    key={g.value}
                    selected={draft.primaryGoal === g.value}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        primaryGoal: g.value,
                        goals: [g.value],
                      }))
                    }
                  >
                    {g.label}
                  </PillOption>
                ))}
              </div>
            </div>

            <SectionSaveBar
              saving={savingSection === "body"}
              onSave={saveBody}
            />
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "medical" ? (
        <Card className="min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">سوابق پزشکی و ایمنی تمرین</CardTitle>
            <CardDescription>
              جهت طراحی ایمن‌ترین برنامه تمرینی و جلوگیری از آسیب‌دیدگی.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MedicalSmartField
              question="آیا سابقه بیماری خاصی دارید؟"
              value={draft.medicalHistory}
              onModeChange={(mode) => setMedicalMode("medicalHistory", mode)}
              onChange={(v) => setDraftField("medicalHistory", v)}
            />
            <MedicalSmartField
              question="آیا آسیب‌دیدگی یا درد مفاصل دارید؟"
              value={draft.injuries}
              onModeChange={(mode) => setMedicalMode("injuries", mode)}
              onChange={(v) => setDraftField("injuries", v)}
            />
            <MedicalSmartField
              question="آیا محدودیت حرکتی خاصی دارید؟"
              value={draft.physicalLimitations}
              onModeChange={(mode) => setMedicalMode("physicalLimitations", mode)}
              onChange={(v) => setDraftField("physicalLimitations", v)}
            />
            <SectionSaveBar
              saving={savingSection === "medical"}
              onSave={saveMedical}
            />
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "photos" ? (
        <Card className="min-w-0">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">تصاویر آنالیز بدنی</CardTitle>
                <CardDescription className="mt-1.5">
                  چهار نمای اصلی بدن برای ارزیابی آناتومیک مربی.
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="gap-1.5">
                    <BookOpen className="size-3.5" />
                    راهنمای ثبت عکس صحیح
                  </Button>
                </DialogTrigger>
                <DialogContent className="profile-theme max-w-md" dir="rtl">
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
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-3 text-xs text-emerald-900 dark:text-emerald-100 sm:text-sm">
              <Shield className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <p>
                حریم خصوصی شما محفوظ است: این تصاویر کاملاً محرمانه بوده و تنها توسط
                مربی علی برای ارزیابی آناتومیک قابل مشاهده است.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PHOTO_SLOTS.map((slot) => {
                const photo = draft.photos?.[slot.type];
                const isUploading = uploadingType === slot.type;
                return (
                  <div
                    key={slot.type}
                    className="rounded-2xl border border-border/60 bg-card/70 p-3"
                  >
                    <div className="mb-2 text-sm font-iranianSansDemiBold">
                      نمای {slot.label}
                    </div>
                    {photo?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={apiAssetUrl(photo.url)}
                        alt={slot.label}
                        className="mb-3 h-40 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="mb-3 flex h-40 items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">
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
                        className="pointer-events-none w-full gap-1.5"
                        disabled={!!uploadingType}
                        tabIndex={-1}
                      >
                        <RefreshCw className="size-3.5" />
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

            <SectionSaveBar
              saving={savingSection === "photos"}
              onSave={savePhotosSection}
            />
          </CardContent>
        </Card>
      ) : null}

      <ChangePasswordModal
        open={pwdOpen}
        onClose={() => setPwdOpen(false)}
        onSuccess={(msg) => setToast({ type: "success", text: msg })}
        onError={(msg) => setToast({ type: "error", text: msg })}
      />
    </div>
  );
}

function SectionSaveBar({ saving, onSave }) {
  return (
    <div className="border-t border-border/60 pt-4">
      <Button
        type="button"
        className="w-full sm:w-auto"
        onClick={onSave}
        disabled={saving}
      >
        <Save data-icon="inline-start" />
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات این بخش"}
      </Button>
    </div>
  );
}

function MedicalSmartField({ question, value, onModeChange, onChange }) {
  const hasDetail = !isMedicalNone(value);
  const mode = hasDetail ? "yes" : "no";

  return (
    <div className="rounded-2xl border border-border/60 bg-muted/15 p-4 text-start">
      <p className="text-sm font-iranianSansDemiBold text-foreground">{question}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <PillOption
          selected={mode === "no"}
          onClick={() => onModeChange("no")}
          className="min-w-32"
        >
          خیر، ندارم
        </PillOption>
        <PillOption
          selected={mode === "yes"}
          onClick={() => onModeChange("yes")}
          className="min-w-32"
        >
          بله، توضیح دهید...
        </PillOption>
      </div>
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          hasDetail ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <Textarea
            value={hasDetail ? value : ""}
            rows={3}
            placeholder="توضیح کوتاه بنویسید..."
            onChange={(e) => onChange(e.target.value)}
            className="resize-none"
          />
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, disabled, inputMode, hint }) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {hint ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Lock className="size-3" />
            {hint}
          </span>
        ) : null}
      </div>
      <Input
        value={value || ""}
        inputMode={inputMode}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="h-10"
      />
    </div>
  );
}

function NumberField({ label, value, onChange, suffix }) {
  return (
    <div className="min-w-0 space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="h-10 pe-10 tabular-nums"
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}
