"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiTarget,
  FiActivity,
  FiImage,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";
import JalaliDateField from "@/components/forms/JalaliDateField";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import { getDashboardPath, ROLES } from "@/lib/auth/roles";
import { gregorianISOToJalali, jalaliToGregorianISO } from "@/lib/date/jalali";

const STEPS = [
  { id: "personal", label: "اطلاعات شخصی", icon: FiUser },
  { id: "body", label: "اهداف و بدن", icon: FiTarget },
  { id: "medical", label: "سوابق پزشکی", icon: FiActivity },
  { id: "photos", label: "عکس‌های بدن", icon: FiImage },
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

  const toggleGoal = (value) => {
    setForm((prev) => {
      const has = prev.goals.includes(value);
      return {
        ...prev,
        goals: has ? prev.goals.filter((g) => g !== value) : [...prev.goals, value],
      };
    });
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.firstName.trim() || !form.lastName.trim()) return "نام و نام خانوادگی الزامی است.";
      const { year, month, day } = form.birthDateJalali || EMPTY_JALALI;
      if (!year || !month || !day) return "تاریخ تولد شمسی را کامل انتخاب کنید.";
      const isoBirth = jalaliToGregorianISO(year, month, day);
      if (!isoBirth) return "تاریخ تولد وارد شده معتبر نیست.";
      const h = Number(form.heightCm);
      const w = Number(form.weightKg);
      if (!Number.isFinite(h) || h < 80 || h > 250) return "قد باید بین ۸۰ تا ۲۵۰ سانتی‌متر باشد.";
      if (!Number.isFinite(w) || w < 20 || w > 300) return "وزن باید بین ۲۰ تا ۳۰۰ کیلوگرم باشد.";
      if (!/^\d{10}$/.test(form.nationalId.trim())) return "کد ملی باید ۱۰ رقم باشد.";
      if (!form.gender) return "جنسیت را انتخاب کنید.";
    }
    if (step === 1) {
      const tw = Number(form.targetWeightKg);
      if (!Number.isFinite(tw) || tw < 20 || tw > 300) return "وزن هدف باید بین ۲۰ تا ۳۰۰ کیلوگرم باشد.";
      if (!form.bodyCondition) return "وضعیت بدنی را انتخاب کنید.";
      if (form.goals.length === 0) return "حداقل یک هدف انتخاب کنید.";
      if (!form.primaryGoal.trim()) return "هدف اصلی را بنویسید.";
      if (form.bodyFatPercent !== "" && form.bodyFatPercent != null) {
        const bf = Number(form.bodyFatPercent);
        if (!Number.isFinite(bf) || bf < 1 || bf > 60) return "درصد چربی باید بین ۱ تا ۶۰ باشد.";
      }
    }
    if (step === 2) {
      if (!form.medicalHistory.trim()) return "سوابق پزشکی را وارد کنید (در صورت نداشتن بنویسید: ندارم).";
      if (!form.injuries.trim()) return "آسیب‌دیدگی‌ها را وارد کنید (در صورت نداشتن بنویسید: ندارم).";
      if (!form.physicalLimitations.trim()) return "محدودیت بدنی را وارد کنید (در صورت نداشتن بنویسید: ندارم).";
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
      const msg = e?.response?.data?.error || "ذخیره اطلاعات ناموفق بود.";
      setError(msg);
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
      setError(e?.response?.data?.error || "آپلود عکس ناموفق بود.");
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
        setError(e?.response?.data?.error || "بررسی نهایی پروفایل ناموفق بود.");
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
    return <div className="text-sm text-zinc-400">در حال بارگذاری...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white">تکمیل پروفایل</h1>
        <p className="mt-1 text-sm text-zinc-400">
          برای استفاده از پنل، لطفاً اطلاعات زیر را کامل کنید.
        </p>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/5 p-4">
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <div
                key={s.id}
                className={[
                  "rounded-2xl border px-3 py-2 text-center text-xs font-bold",
                  active
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                    : done
                      ? "border-white/10 bg-zinc-950/30 text-zinc-300"
                      : "border-white/10 bg-zinc-950/20 text-zinc-500",
                ].join(" ")}
              >
                <Icon className="mx-auto mb-1 text-base" />
                {s.label}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          className="rounded-[26px] border border-white/10 bg-white/5 p-6"
        >
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="نام" value={form.firstName} onChange={(v) => setField("firstName", v)} />
                <Field label="نام خانوادگی" value={form.lastName} onChange={(v) => setField("lastName", v)} />
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
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="قد (cm)"
                  type="number"
                  value={form.heightCm}
                  onChange={(v) => setField("heightCm", v)}
                />
                <Field
                  label="وزن فعلی (kg)"
                  type="number"
                  value={form.weightKg}
                  onChange={(v) => setField("weightKg", v)}
                />
              </div>
              <Field
                label="کد ملی"
                value={form.nationalId}
                onChange={(v) => setField("nationalId", v.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
              />
              <div>
                <div className="mb-2 text-xs font-bold text-zinc-300">جنسیت</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "male", label: "مرد" },
                    { value: "female", label: "زن" },
                  ].map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setField("gender", g.value)}
                      className={[
                        "rounded-2xl border px-4 py-3 text-sm font-bold",
                        form.gender === g.value
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                          : "border-white/10 bg-zinc-950/30 text-zinc-200 hover:bg-white/5",
                      ].join(" ")}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="وزن هدف (kg)" type="number" value={form.targetWeightKg} onChange={(v) => setField("targetWeightKg", v)} />
                <Field
                  label="درصد چربی (اختیاری)"
                  type="number"
                  value={form.bodyFatPercent}
                  onChange={(v) => setField("bodyFatPercent", v)}
                />
              </div>
              <div>
                <div className="mb-2 text-xs font-bold text-zinc-300">وضعیت بدنی</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BODY_CONDITIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setField("bodyCondition", c.value)}
                      className={[
                        "rounded-2xl border px-3 py-2 text-xs font-bold",
                        form.bodyCondition === c.value
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                          : "border-white/10 bg-zinc-950/30 text-zinc-200 hover:bg-white/5",
                      ].join(" ")}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs font-bold text-zinc-300">اهداف</div>
                <div className="flex flex-wrap gap-2">
                  {GOAL_OPTIONS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => toggleGoal(g.value)}
                      className={[
                        "rounded-2xl border px-3 py-2 text-xs font-bold",
                        form.goals.includes(g.value)
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                          : "border-white/10 bg-zinc-950/30 text-zinc-200 hover:bg-white/5",
                      ].join(" ")}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <Field
                label="هدف اصلی (توضیح کوتاه)"
                value={form.primaryGoal}
                onChange={(v) => setField("primaryGoal", v)}
                placeholder="مثلاً: کاهش ۸ کیلو تا شهریور"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <TextArea
                label="سوابق پزشکی"
                value={form.medicalHistory}
                onChange={(v) => setField("medicalHistory", v)}
                placeholder="در صورت نداشتن بنویسید: ندارم"
              />
              <TextArea
                label="بیماری‌ها و آسیب‌دیدگی‌ها"
                value={form.injuries}
                onChange={(v) => setField("injuries", v)}
                placeholder="در صورت نداشتن بنویسید: ندارم"
              />
              <TextArea
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
                  <div
                    key={slot.type}
                    className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4"
                  >
                    <div className="mb-3 text-sm font-extrabold text-white">نمای {slot.label}</div>
                    {photo?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={apiAssetUrl(photo.url)}
                        alt={slot.label}
                        className="mb-3 h-40 w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="mb-3 flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-xs text-zinc-500">
                        عکس انتخاب نشده
                      </div>
                    )}
                    <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-zinc-100 hover:bg-white/10">
                      {isUploading ? "در حال آپلود..." : photo ? "تغییر عکس" : "انتخاب عکس"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadPhoto(slot.type, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={step === 0 || saving}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-zinc-100 hover:bg-white/10 disabled:opacity-50"
        >
          <FiArrowRight />
          قبلی
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={saving || !!uploadingType}
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200 disabled:opacity-60"
        >
          {saving ? "در حال ذخیره..." : step === 3 ? "اتمام" : "بعدی"}
          {step === 3 ? <FiCheck /> : <FiArrowLeft />}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, inputMode }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-bold text-zinc-300">{label}</div>
      <input
        type={type}
        value={value ?? ""}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/20"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-bold text-zinc-300">{label}</div>
      <textarea
        value={value ?? ""}
        rows={4}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/20"
      />
    </label>
  );
}
