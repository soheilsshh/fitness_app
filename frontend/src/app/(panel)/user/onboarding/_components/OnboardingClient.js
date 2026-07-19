"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Image as ImageIcon,
  Shield,
  Target,
  User,
  X,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import { getDashboardPath, ROLES } from "@/lib/auth/roles";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/api/translateError";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "name", label: "نام شما", icon: User },
  { id: "goal", label: "هدف اصلی", icon: Target },
  { id: "photos", label: "عکس بدن (اختیاری)", icon: ImageIcon },
];

const GOAL_OPTIONS = [
  { value: "weight_loss", label: "کاهش وزن" },
  { value: "muscle_gain", label: "افزایش حجم عضلانی" },
  { value: "fitness", label: "آمادگی عمومی" },
  { value: "endurance", label: "استقامت" },
  { value: "flexibility", label: "انعطاف‌پذیری" },
  { value: "rehabilitation", label: "بازگشت به تمرین" },
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

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
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
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        const goalFromTags = Array.isArray(data.goals) ? data.goals[0] : "";
        const matched = GOAL_OPTIONS.find(
          (g) => g.value === goalFromTags || g.label === data.primaryGoal
        );
        setPrimaryGoal(matched?.value || goalFromTags || "");
        const photoMap = {};
        for (const p of data.photos || []) {
          if (p.type && !p.checkInDate) photoMap[p.type] = p;
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

  const goDashboard = (complete) => {
    window.localStorage.setItem("profile_complete", complete ? "1" : "0");
    router.replace(getDashboardPath(ROLES.STUDENT));
  };

  const saveName = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError("نام و نام خانوادگی را وارد کنید.");
      return false;
    }
    setSaving(true);
    setError("");
    try {
      await api.patch("/me", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      return true;
    } catch (e) {
      setError(getApiErrorMessage(e, "ذخیره نام ناموفق بود."));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveGoal = async () => {
    if (!primaryGoal) {
      setError("هدف اصلی را انتخاب کنید.");
      return null;
    }
    const label =
      GOAL_OPTIONS.find((g) => g.value === primaryGoal)?.label || primaryGoal;
    setSaving(true);
    setError("");
    try {
      const res = await api.patch("/me", {
        goals: [primaryGoal],
        primaryGoal: label,
      });
      window.localStorage.setItem(
        "profile_complete",
        res.data?.isProfileComplete ? "1" : "0"
      );
      return res.data;
    } catch (e) {
      setError(getApiErrorMessage(e, "ذخیره هدف ناموفق بود."));
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

  const finishToDashboard = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await api.get("/me");
      goDashboard(Boolean(res.data?.isProfileComplete));
    } catch (e) {
      setError(getApiErrorMessage(e, "ورود به داشبورد ناموفق بود."));
      setSaving(false);
    }
  };

  const onNext = async () => {
    if (step === 0) {
      const ok = await saveName();
      if (!ok) return;
      setStep(1);
      return;
    }
    if (step === 1) {
      const saved = await saveGoal();
      if (!saved) return;
      setStep(2);
      return;
    }
    await finishToDashboard();
  };

  const onSkipPhotos = async () => {
    await finishToDashboard();
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 md:gap-6" dir="rtl">
      <div className="text-center sm:text-start">
        <h1 className="text-xl font-iranianSansBlack tracking-tight sm:text-2xl">
          شروع سریع
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          فقط دو مرحله کوتاه؛ بعداً می‌توانید بقیه اطلاعات را تکمیل کنید.
        </p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>پیشرفت</span>
              <span className="tabular-nums">
                {Math.round(progress).toLocaleString("fa-IR")}٪
              </span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {STEPS.map((item, index) => {
              const Icon = item.icon;
              const active = index === step;
              const done = index < step;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border px-2 py-2.5 text-center text-[11px] font-iranianSansMedium sm:text-xs",
                    active && "border-primary/40 bg-primary/10 text-foreground",
                    done &&
                      !active &&
                      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                    !active &&
                      !done &&
                      "border-border bg-muted/20 text-muted-foreground"
                  )}
                >
                  <span className="mx-auto mb-1 flex size-6 items-center justify-center">
                    {done ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </span>
                  {item.label}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-iranianSansDemiBold">
            {STEPS[step].label}
          </CardTitle>
          <CardDescription>
            {step === 0 &&
              "نامتان را می‌خواهیم تا مربی بداند با چه کسی حرف می‌زند."}
            {step === 1 &&
              "هدف اصلی کمک می‌کند مسیر برنامه از همان اول درست شکل بگیرد."}
            {step === 2 &&
              "عکس‌ها اختیاری‌اند؛ می‌توانید همین حالا رد کنید و بعداً در پروفایل بفرستید."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="onb-first">نام</Label>
                  <Input
                    id="onb-first"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="نام"
                    autoComplete="given-name"
                    className="h-12 rounded-xl"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onb-last">نام خانوادگی</Label>
                  <Input
                    id="onb-last"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="نام خانوادگی"
                    autoComplete="family-name"
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
              <PrivacyNote text="اطلاعات هویتی شما نزد فیتینو محفوظ است و فقط برای خدمات مربی‌گری استفاده می‌شود." />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>هدف اصلی‌تان چیست؟</Label>
                <ToggleGroup
                  type="single"
                  value={primaryGoal}
                  onValueChange={(v) => v && setPrimaryGoal(v)}
                  variant="outline"
                  className="grid w-full grid-cols-2 gap-2"
                >
                  {GOAL_OPTIONS.map((goal) => (
                    <ToggleGroupItem
                      key={goal.value}
                      value={goal.value}
                      className="h-11 text-xs sm:text-sm"
                    >
                      {goal.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <PrivacyNote text="هدف شما فقط برای طراحی برنامه شخصی‌تان استفاده می‌شود." />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-3">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  نمونه و نکات گرفتن عکس استاندارد
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
                          <div className="font-iranianSansDemiBold text-foreground">
                            {item.title}
                          </div>
                          <p className="mt-1 text-muted-foreground">{item.body}</p>
                        </li>
                      ))}
                    </ul>
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {PHOTO_SLOTS.map((slot) => (
                        <div
                          key={slot.type}
                          className="flex aspect-[3/4] items-end justify-center rounded-lg border border-dashed border-border bg-muted/50 pb-2 text-[10px] text-muted-foreground"
                        >
                          {slot.label}
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <PrivacyNote text="این تصاویر فقط توسط مربی شما قابل مشاهده است و در هیچ جای دیگری نمایش داده نخواهد شد." />

              <div className="grid gap-3 sm:grid-cols-2">
                {PHOTO_SLOTS.map((slot) => {
                  const photo = photos[slot.type];
                  const isUploading = uploadingType === slot.type;
                  return (
                    <div
                      key={slot.type}
                      className="rounded-2xl border border-border/60 bg-card/70 p-3"
                    >
                      <div className="mb-2 text-sm font-iranianSansMedium">
                        نمای {slot.label}
                      </div>
                      {photo?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={apiAssetUrl(photo.url)}
                          alt={slot.label}
                          className="mb-3 h-36 w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="mb-3 flex h-36 items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">
                          اختیاری
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setError("");
            setStep((s) => Math.max(0, s - 1));
          }}
          disabled={step === 0 || saving}
          className="order-2 sm:order-1"
        >
          <ArrowRight data-icon="inline-start" />
          قبلی
        </Button>

        <div className="order-1 flex flex-col gap-2 sm:order-2 sm:flex-row">
          {step === 2 && (
            <Button
              type="button"
              variant="secondary"
              className="h-11 gap-2"
              onClick={onSkipPhotos}
              disabled={saving || !!uploadingType}
            >
              <X className="size-4" />
              فعلاً رد می‌کنم
            </Button>
          )}
          <Button
            type="button"
            className="h-11 gap-2"
            onClick={onNext}
            disabled={saving || !!uploadingType}
          >
            {saving
              ? "لطفاً صبر کنید..."
              : step === 2
                ? "ورود به داشبورد"
                : "ادامه"}
            {step === 2 ? (
              <Check data-icon="inline-end" />
            ) : (
              <ArrowLeft data-icon="inline-end" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PrivacyNote({ text }) {
  return (
    <div className="flex gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs text-emerald-900 dark:text-emerald-100 sm:text-sm">
      <Shield className="mt-0.5 size-4 shrink-0 text-emerald-600" />
      <p className="text-start leading-relaxed">{text}</p>
    </div>
  );
}
