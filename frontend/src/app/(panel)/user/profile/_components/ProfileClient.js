"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Edit3,
  Image as ImageIcon,
  Lock,
  Save,
  Trash2,
  UploadCloud,
  User,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import HealthStatusCard from "@/components/health/HealthStatusCard";
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
import { cn } from "@/lib/utils";
import ChangePasswordModal from "./ChangePasswordModal";

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <Skeleton className="h-8 w-32" />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
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
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    heightCm: null,
    weightKg: null,
    age: null,
    bmi: null,
    bmiStatus: "",
    photos: [],
    programsCount: 0,
    ordersCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    photos: profile.photos,
  });

  const [toast, setToast] = useState(null);
  const [pwdOpen, setPwdOpen] = useState(false);

  const fileRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get("/me");
        if (cancelled) return;
        const data = res.data || {};
        setProfile({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phone: data.phone || "",
          heightCm: data.heightCm ?? null,
          weightKg: data.weightKg ?? null,
          age: data.age ?? null,
          bmi: data.bmi ?? null,
          bmiStatus: data.bmiStatus || "",
          photos: data.photos || [],
          programsCount: data.programsCount || 0,
          ordersCount: data.ordersCount || 0,
        });
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

  const stats = useMemo(
    () => ({
      total: profile.programsCount || 0,
      active: profile.programsCount || 0,
    }),
    [profile.programsCount]
  );

  const onStartEdit = () => {
    setDraft({
      firstName: profile.firstName,
      lastName: profile.lastName,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      photos: profile.photos,
    });
    setEditing(true);
  };

  const validateNumber = (n, min, max) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return null;
    if (num < min || num > max) return null;
    return num;
  };

  const onSave = async () => {
    const f = String(draft.firstName || "").trim();
    const l = String(draft.lastName || "").trim();

    const h = validateNumber(draft.heightCm, 80, 250);
    const w = validateNumber(draft.weightKg, 20, 300);

    if (!f || !l) {
      setToast({ type: "error", text: "نام و نام خانوادگی نمی‌تواند خالی باشد." });
      return;
    }
    if (h === null) {
      setToast({ type: "error", text: "قد نامعتبر است (بین 80 تا 250 سانتی‌متر)." });
      return;
    }
    if (w === null) {
      setToast({ type: "error", text: "وزن نامعتبر است (بین 20 تا 300 کیلوگرم)." });
      return;
    }

    try {
      const res = await api.patch("/me", {
        firstName: f,
        lastName: l,
        heightCm: h,
        weightKg: w,
      });
      const data = res.data || {};
      setProfile((prev) => ({
        ...prev,
        firstName: data.firstName || f,
        lastName: data.lastName || l,
        heightCm: data.heightCm ?? h,
        weightKg: data.weightKg ?? w,
        age: data.age ?? prev.age,
        bmi: data.bmi ?? prev.bmi,
        bmiStatus: data.bmiStatus ?? prev.bmiStatus,
      }));
      setEditing(false);
      setToast({ type: "success", text: "اطلاعات پروفایل با موفقیت ذخیره شد." });
    } catch (e) {
      setToast({
        type: "error",
        text: e?.response?.data?.error || "ذخیره ناموفق بود.",
      });
    }
  };

  const addFiles = (files) => {
    if (!editing) return;

    const list = Array.from(files || []);
    if (list.length === 0) return;

    const onlyImages = list.filter((f) => f.type?.startsWith("image/"));
    if (onlyImages.length !== list.length) {
      setToast({ type: "error", text: "فقط فایل تصویر مجاز است." });
      return;
    }

    const current = draft.photos || [];
    const remaining = 5 - current.length;
    if (remaining <= 0) {
      setToast({ type: "error", text: "حداکثر ۵ عکس مجاز است." });
      return;
    }

    const toAdd = onlyImages.slice(0, remaining).map((f) => ({
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      url: URL.createObjectURL(f),
      name: f.name,
    }));

    setDraft((p) => ({ ...p, photos: [...(p.photos || []), ...toAdd] }));

    if (onlyImages.length > remaining) {
      setToast({
        type: "error",
        text: `فقط ${remaining} عکس دیگر می‌توانید اضافه کنید.`,
      });
    }
  };

  const removePhoto = (id) => {
    if (!editing) return;
    setDraft((p) => ({
      ...p,
      photos: (p.photos || []).filter((x) => x.id !== id),
    }));
  };

  const visiblePhotos = (editing ? draft.photos : profile.photos) || [];

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="text-start">
        <h2 className="text-lg font-semibold tracking-tight">پروفایل</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          اطلاعات حساب و تنظیمات امنیتی
        </p>
      </div>

      {toast ? (
        <AlertBanner
          type={toast.type}
          text={toast.text}
          onClose={() => setToast(null)}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-gradient-to-t from-primary/5 to-card dark:bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-primary" />
              خلاصه حساب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card size="sm">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">برنامه‌های فعال</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">
                    {stats.active.toLocaleString("fa-IR")}
                  </p>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">
                    کل برنامه‌های خریداری‌شده
                  </p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">
                    {stats.total.toLocaleString("fa-IR")}
                  </p>
                </CardContent>
              </Card>
            </div>

            <HealthStatusCard
              bmi={profile.bmi}
              bmiStatus={profile.bmiStatus}
              weightKg={profile.weightKg}
              heightCm={profile.heightCm}
              age={profile.age}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4 text-primary" />
                اطلاعات پروفایل
              </CardTitle>
              {!editing ? (
                <Button type="button" variant="outline" size="sm" onClick={onStartEdit}>
                  <Edit3 data-icon="inline-start" />
                  ویرایش
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={onSave}>
                  <Save data-icon="inline-start" />
                  ذخیره
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="نام"
                value={editing ? draft.firstName : profile.firstName}
                onChange={(v) => setDraft((p) => ({ ...p, firstName: v }))}
                disabled={!editing}
              />
              <FormField
                label="نام خانوادگی"
                value={editing ? draft.lastName : profile.lastName}
                onChange={(v) => setDraft((p) => ({ ...p, lastName: v }))}
                disabled={!editing}
              />
            </div>

            <FormField label="شماره تماس" value={profile.phone} disabled />

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="قد (cm)"
                value={editing ? draft.heightCm : profile.heightCm}
                onChange={(v) => setDraft((p) => ({ ...p, heightCm: v }))}
                disabled={!editing}
                min={80}
                max={250}
              />
              <NumberField
                label="وزن (kg)"
                value={editing ? draft.weightKg : profile.weightKg}
                onChange={(v) => setDraft((p) => ({ ...p, weightKg: v }))}
                disabled={!editing}
                min={20}
                max={300}
              />
            </div>

            <Card size="sm">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="text-start">
                    <CardTitle className="text-sm">عکس‌های بدن</CardTitle>
                    <CardDescription>
                      حداکثر ۵ عکس • برای ثبت پیشرفت (Front/Side/Back)
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="tabular-nums">
                    {visiblePhotos.length.toLocaleString("fa-IR")}/۵
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />

                <DropZone
                  disabled={!editing}
                  onPick={() => fileRef.current?.click()}
                  onDropFiles={addFiles}
                />

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {visiblePhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative overflow-hidden rounded-lg border bg-muted/30"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.name || "photo"}
                        className="h-36 w-full object-cover sm:h-40"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="truncate text-[11px] text-white/90">
                          {photo.name || "photo"}
                        </p>
                      </div>
                      {editing ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon-sm"
                          className="absolute start-3 top-3 bg-background/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          onClick={() => removePhoto(photo.id)}
                          aria-label="حذف عکس"
                        >
                          <Trash2 />
                        </Button>
                      ) : null}
                    </div>
                  ))}

                  {visiblePhotos.length === 0 ? (
                    <div className="col-span-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground sm:col-span-3">
                      هنوز عکسی اضافه نشده.
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div className="text-start">
                  <p className="text-sm font-medium">امنیت حساب</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    برای امنیت بیشتر، رمز عبور را دوره‌ای تغییر دهید.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={() => setPwdOpen(true)}>
                  <Lock data-icon="inline-start" />
                  تغییر رمز عبور
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
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

function FormField({ label, value, onChange, disabled }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

function NumberField({ label, value, onChange, disabled, min, max }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value ?? ""}
        min={min}
        max={max}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="tabular-nums"
      />
    </div>
  );
}

function DropZone({ disabled, onPick, onDropFiles }) {
  const [drag, setDrag] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    if (disabled) return;
    onDropFiles?.(e.dataTransfer.files);
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onPick?.()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) onPick?.();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        setDrag(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        setDrag(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDrag(false);
      }}
      onDrop={handleDrop}
      className={cn(
        "cursor-pointer rounded-lg border border-dashed p-4 transition-colors",
        drag
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-muted/20",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-start">
        <div className="flex items-center gap-2 text-sm font-medium">
          <UploadCloud className="size-4 text-primary" />
          آپلود عکس (حداکثر ۵)
        </div>
        <p className="text-xs text-muted-foreground">
          {disabled
            ? "برای آپلود، وارد حالت ویرایش شوید."
            : "کلیک کنید یا فایل را درگ کنید."}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-end">
        <Badge variant="outline">
          <ImageIcon data-icon="inline-start" />
          Front
        </Badge>
        <Badge variant="outline">
          <ImageIcon data-icon="inline-start" />
          Side
        </Badge>
        <Badge variant="outline">
          <ImageIcon data-icon="inline-start" />
          Back
        </Badge>
      </div>
    </div>
  );
}
