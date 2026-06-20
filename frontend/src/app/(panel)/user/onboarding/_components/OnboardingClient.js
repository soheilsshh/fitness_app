"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  Image as ImageIcon,
  Target,
  User,
} from "lucide-react";
import JalaliDateField from "@/components/forms/JalaliDateField";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import { getDashboardPath, ROLES } from "@/lib/auth/roles";
import { gregorianISOToJalali, jalaliToGregorianISO } from "@/lib/date/jalali";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getApiErrorMessage } from "@/lib/api/translateError";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "personal", label: "اطلاعات شخصی", icon: User },
  { id: "body", label: "اهداف و بدن", icon: Target },
  { id: "medical", label: "سوابق پزشکی", icon: Activity },
  { id: "photos", label: "عکس‌های بدن", icon: ImageIcon },
];

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

const EMPTY_JALALI = { year: "", month: "", day: "" };

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
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
};

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photos, setPhotos] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get("/me");
        if (cancelled) return;
        const data = res.data || {};
        if (data.isProfileComplete) {
          router.replace(getDashboardPath(ROLES.STUDENT));
          return;
        }
        const birthDateJalali = gregorianISOToJalali(data.birthDate);
        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          birthDate: data.birthDate || "",
          birthDateJalali,
          nationalId: data.nationalId || "",
          gender: data.gender || "",
          heightCm: data.heightCm ?? "",
          weightKg: data.weightKg ?? "",
          targetWeightKg: data.targetWeightKg ?? "",
          bodyCondition: data.bodyCondition || "",
          bodyFatPercent: data.bodyFatPercent ?? "",
          goals: data.goals || [],
          primaryGoal: data.primaryGoal || "",
          medicalHistory: data.medicalHistory || "",
          injuries: data.injuries || "",
          physicalLimitations: data.physicalLimitations || "",
        });
        const photoMap = {};
        for (const p of data.photos || []) {
          if (p.type) photoMap[p.type] = p;
        }
        setPhotos(photoMap);
      } catch {
        if (!cancelled) setError("بارگذاری اطلاعات ناموفق بود.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.firstName.trim() || !form.lastName.trim()) {
        return "نام و نام خانوادگی الزامی است.";
      }
      const { year, month, day } = form.birthDateJalali || EMPTY_JALALI;
      if (!year || !month || !day) return "تاریخ تولد شمسی را کامل انتخاب کنید.";
      const isoBirth = jalaliToGregorianISO(year, month, day);
      if (!isoBirth) return "تاریخ تولد وارد شده معتبر نیست.";
      const h = Number(form.heightCm);
      const w = Number(form.weightKg);
      if (!Number.isFinite(h) || h < 80 || h > 250) {
        return "قد باید بین ۸۰ تا ۲۵۰ سانتی‌متر باشد.";
      }
      if (!Number.isFinite(w) || w < 20 || w > 300) {
        return "وزن باید بین ۲۰ تا ۳۰۰ کیلوگرم باشد.";
      }
      if (!/^\d{10}$/.test(form.nationalId.trim())) return "کد ملی باید ۱۰ رقم باشد.";
      if (!form.gender) return "جنسیت را انتخاب کنید.";
    }
    if (step === 1) {
      const tw = Number(form.targetWeightKg);
      if (!Number.isFinite(tw) || tw < 20 || tw > 300) {
        return "وزن هدف باید بین ۲۰ تا ۳۰۰ کیلوگرم باشد.";
      }
      if (!form.bodyCondition) return "وضعیت بدنی را انتخاب کنید.";
      if (form.goals.length === 0) return "حداقل یک هدف انتخاب کنید.";
      if (!form.primaryGoal.trim()) return "هدف اصلی را بنویسید.";
      if (form.bodyFatPercent !== "" && form.bodyFatPercent != null) {
        const bf = Number(form.bodyFatPercent);
        if (!Number.isFinite(bf) || bf < 1 || bf > 60) {
          return "درصد چربی باید بین ۱ تا ۶۰ باشد.";
        }
      }
    }
    if (step === 2) {
      if (!form.medicalHistory.trim()) {
        return "سوابق پزشکی را وارد کنید (در صورت نداشتن بنویسید: ندارم).";
      }
      if (!form.injuries.trim()) {
        return "آسیب‌دیدگی‌ها را وارد کنید (در صورت نداشتن بنویسید: ندارم).";
      }
      if (!form.physicalLimitations.trim()) {
        return "محدودیت بدنی را وارد کنید (در صورت نداشتن بنویسید: ندارم).";
      }
    }
    if (step === 3) {
      for (const slot of PHOTO_SLOTS) {
        if (!photos[slot.type]) return `عکس ${slot.label} الزامی است.`;
      }
    }
    return "";
  };

  const buildPatchPayload = (currentStep) => {
    const { year, month, day } = form.birthDateJalali || EMPTY_JALALI;
    const birthDate = jalaliToGregorianISO(year, month, day) || form.birthDate;

    if (currentStep === 0) {
      return {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        birthDate,
        nationalId: form.nationalId.trim(),
        gender: form.gender,
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
      };
    }
    if (currentStep === 1) {
      const payload = {
        targetWeightKg: Number(form.targetWeightKg),
        bodyCondition: form.bodyCondition,
        goals: form.goals,
        primaryGoal: form.primaryGoal.trim(),
      };
      if (form.bodyFatPercent !== "" && form.bodyFatPercent != null) {
        payload.bodyFatPercent = Number(form.bodyFatPercent);
      }
      return payload;
    }
    if (currentStep === 2) {
      return {
        medicalHistory: form.medicalHistory.trim(),
        injuries: form.injuries.trim(),
        physicalLimitations: form.physicalLimitations.trim(),
      };
    }

    return null;
  };

  const saveProfile = async (currentStep = step) => {
    const payload = buildPatchPayload(currentStep);
    if (!payload) return null;

    setSaving(true);
    setError("");
    try {
      const res = await api.patch("/me", payload);
      window.localStorage.setItem(
        "profile_complete",
        res.data?.isProfileComplete ? "1" : "0"
      );
      return res.data;
    } catch (e) {
      setError(getApiErrorMessage(e, "ذخیره اطلاعات ناموفق بود."));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (type, file) => {
    if (!file?.type?.startsWith("image/")) {
      setError("فقط فایل تصویر مجاز است.");
      return;
    }
    setUploadingType(type);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("type", type);
      const res = await api.post("/me/body-photos", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPhotos((prev) => ({ ...prev, [type]: res.data }));
    } catch (e) {
      setError(getApiErrorMessage(e, "آپلود عکس ناموفق بود."));
    } finally {
      setUploadingType("");
    }
  };

  const onNext = async () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (step < 2) {
      const saved = await saveProfile(step);
      if (!saved) return;
      setStep((s) => s + 1);
      return;
    }
    if (step === 2) {
      const saved = await saveProfile(step);
      if (!saved) return;
      setStep(3);
      return;
    }
    if (step === 3) {
      setSaving(true);
      setError("");
      try {
        const res = await api.get("/me");
        if (res.data?.isProfileComplete) {
          window.localStorage.setItem("profile_complete", "1");
          router.replace(getDashboardPath(ROLES.STUDENT));
        } else {
          setError("هنوز برخی اطلاعات ناقص است. لطفاً همه فیلدها را بررسی کنید.");
        }
      } catch (e) {
        setError(getApiErrorMessage(e, "بررسی نهایی پروفایل ناموفق بود."));
      } finally {
        setSaving(false);
      }
    }
  };

  const onBack = () => {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 md:gap-6" dir="rtl">
      <div className="text-start">
        <h1 className="text-xl font-semibold tracking-tight">تکمیل پروفایل</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          برای استفاده از پنل، لطفاً اطلاعات زیر را کامل کنید.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>پیشرفت تکمیل</span>
              <span className="tabular-nums">
                {Math.round(progress).toLocaleString("fa-IR")}%
              </span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STEPS.map((item, index) => {
              const Icon = item.icon;
              const active = index === step;
              const done = index < step;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-center text-xs font-medium",
                    active && "border-primary/40 bg-primary/5 text-foreground",
                    done && !active && "border-border bg-muted/50 text-muted-foreground",
                    !active && !done && "border-border bg-muted/20 text-muted-foreground"
                  )}
                >
                  <Icon className="mx-auto mb-1 size-4" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{STEPS[step].label}</CardTitle>
          <CardDescription>
            مرحله {(step + 1).toLocaleString("fa-IR")} از{" "}
            {STEPS.length.toLocaleString("fa-IR")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="نام"
                  value={form.firstName}
                  onChange={(v) => setField("firstName", v)}
                />
                <FormField
                  label="نام خانوادگی"
                  value={form.lastName}
                  onChange={(v) => setField("lastName", v)}
                />
              </div>
              <JalaliDateField
                label="تاریخ تولد (شمسی)"
                year={form.birthDateJalali?.year || ""}
                month={form.birthDateJalali?.month || ""}
                day={form.birthDateJalali?.day || ""}
                onChange={(parts) => {
                  const iso = jalaliToGregorianISO(parts.year, parts.month, parts.day);
                  setForm((prev) => ({
                    ...prev,
                    birthDateJalali: parts,
                    birthDate: iso || prev.birthDate,
                  }));
                }}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="قد (cm)"
                  type="number"
                  value={form.heightCm}
                  onChange={(v) => setField("heightCm", v)}
                />
                <FormField
                  label="وزن فعلی (kg)"
                  type="number"
                  value={form.weightKg}
                  onChange={(v) => setField("weightKg", v)}
                />
              </div>
              <FormField
                label="کد ملی"
                value={form.nationalId}
                onChange={(v) =>
                  setField("nationalId", v.replace(/\D/g, "").slice(0, 10))
                }
                inputMode="numeric"
              />
              <div className="space-y-2">
                <Label>جنسیت</Label>
                <ToggleGroup
                  type="single"
                  value={form.gender}
                  onValueChange={(v) => v && setField("gender", v)}
                  variant="outline"
                  className="grid w-full grid-cols-2"
                >
                  <ToggleGroupItem value="male">مرد</ToggleGroupItem>
                  <ToggleGroupItem value="female">زن</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="وزن هدف (kg)"
                  type="number"
                  value={form.targetWeightKg}
                  onChange={(v) => setField("targetWeightKg", v)}
                />
                <FormField
                  label="درصد چربی (اختیاری)"
                  type="number"
                  value={form.bodyFatPercent}
                  onChange={(v) => setField("bodyFatPercent", v)}
                />
              </div>
              <div className="space-y-2">
                <Label>وضعیت بدنی</Label>
                <ToggleGroup
                  type="single"
                  value={form.bodyCondition}
                  onValueChange={(v) => v && setField("bodyCondition", v)}
                  variant="outline"
                  className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3"
                >
                  {BODY_CONDITIONS.map((condition) => (
                    <ToggleGroupItem
                      key={condition.value}
                      value={condition.value}
                      className="text-xs"
                    >
                      {condition.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <div className="space-y-2">
                <Label>اهداف</Label>
                <ToggleGroup
                  type="multiple"
                  value={form.goals}
                  onValueChange={(values) => setForm((prev) => ({ ...prev, goals: values }))}
                  variant="outline"
                  className="flex flex-wrap justify-start gap-2"
                >
                  {GOAL_OPTIONS.map((goal) => (
                    <ToggleGroupItem
                      key={goal.value}
                      value={goal.value}
                      className="text-xs"
                    >
                      {goal.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <FormField
                label="هدف اصلی (توضیح کوتاه)"
                value={form.primaryGoal}
                onChange={(v) => setField("primaryGoal", v)}
                placeholder="مثلاً: کاهش ۸ کیلو تا شهریور"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <TextAreaField
                label="سوابق پزشکی"
                value={form.medicalHistory}
                onChange={(v) => setField("medicalHistory", v)}
                placeholder="در صورت نداشتن بنویسید: ندارم"
              />
              <TextAreaField
                label="بیماری‌ها و آسیب‌دیدگی‌ها"
                value={form.injuries}
                onChange={(v) => setField("injuries", v)}
                placeholder="در صورت نداشتن بنویسید: ندارم"
              />
              <TextAreaField
                label="محدودیت‌های بدنی"
                value={form.physicalLimitations}
                onChange={(v) => setField("physicalLimitations", v)}
                placeholder="در صورت نداشتن بنویسید: ندارم"
              />
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {PHOTO_SLOTS.map((slot) => {
                const photo = photos[slot.type];
                const isUploading = uploadingType === slot.type;
                return (
                  <Card key={slot.type} size="sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">نمای {slot.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {photo?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={apiAssetUrl(photo.url)}
                          alt={slot.label}
                          className="mb-3 h-40 w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="mb-3 flex h-40 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                          عکس انتخاب نشده
                        </div>
                      )}
                      <label className="block cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={isUploading}
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
                          disabled={isUploading}
                          tabIndex={-1}
                        >
                          {isUploading
                            ? "در حال آپلود..."
                            : photo
                              ? "تغییر عکس"
                              : "انتخاب عکس"}
                        </Button>
                      </label>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={step === 0 || saving}
        >
          <ArrowRight data-icon="inline-start" />
          قبلی
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={saving || !!uploadingType}
        >
          {saving ? "در حال ذخیره..." : step === 3 ? "اتمام" : "بعدی"}
          {step === 3 ? (
            <Check data-icon="inline-end" />
          ) : (
            <ArrowLeft data-icon="inline-end" />
          )}
        </Button>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", placeholder, inputMode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value ?? ""}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={type === "number" ? "tabular-nums" : undefined}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={value ?? ""}
        rows={4}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}
