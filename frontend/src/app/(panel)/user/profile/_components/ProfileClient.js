"use client";

import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiEdit3,
  FiSave,
  FiLock,
  FiActivity,
  FiUploadCloud,
  FiTrash2,
  FiImage,
} from "react-icons/fi";

import ChangePasswordModal from "./ChangePasswordModal";
import { mockPrograms } from "../../my-programs/_components/mock";
import { computeTimeline } from "../../my-programs/_components/helpers";

function Toast({ type, text, onClose }) {
  const styles =
    type === "success"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
      : "border-rose-400/20 bg-rose-400/10 text-rose-100";

  return (
    <div className={["rounded-3xl border px-4 py-3 text-sm", styles].join(" ")}>
      <div className="flex items-center justify-between gap-3">
        <span className="break-words">{text}</span>
        <button
          onClick={onClose}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs"
        >
          بستن
        </button>
      </div>
    </div>
  );
}

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function ProfileClient() {
  // Demo profile state (later replace with API/Redux)
  const [profile, setProfile] = useState({
    firstName: "شهاب",
    lastName: "صفری",
    phone: "09xxxxxxxxx",
    heightCm: 178,
    weightKg: 78,
    photos: [], // [{id, url, name}]
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    photos: profile.photos,
  });

  const [toast, setToast] = useState(null); // {type, text}
  const [pwdOpen, setPwdOpen] = useState(false);

  const fileRef = useRef(null);

  const stats = useMemo(() => {
    const total = mockPrograms.length;
    const active = mockPrograms.filter(
      (p) => computeTimeline(p.startDate, p.durationDays).isActive
    ).length;
    return { total, active };
  }, []);

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

  const onSave = () => {
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
    if ((draft.photos || []).length > 5) {
      setToast({ type: "error", text: "حداکثر ۵ عکس می‌توانید آپلود کنید." });
      return;
    }

    setProfile((prev) => ({
      ...prev,
      firstName: f,
      lastName: l,
      heightCm: h,
      weightKg: w,
      photos: draft.photos || [],
    }));

    setEditing(false);
    setToast({ type: "success", text: "اطلاعات پروفایل با موفقیت ذخیره شد." });
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
      setToast({ type: "error", text: `فقط ${remaining} عکس دیگر می‌توانید اضافه کنید.` });
    }
  };

  const removePhoto = (id) => {
    if (!editing) return;
    setDraft((p) => ({ ...p, photos: (p.photos || []).filter((x) => x.id !== id) }));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">پروفایل</div>
          <div className="mt-1 text-sm text-zinc-300">اطلاعات حساب و تنظیمات امنیتی</div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Toast type={toast.type} text={toast.text} onClose={() => setToast(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats + Profile card */}
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Stats */}
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 text-sm font-extrabold text-white">
            <FiActivity className="text-emerald-300" />
            خلاصه حساب
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
              <div className="text-[11px] text-zinc-400">برنامه‌های فعال</div>
              <div className="mt-2 text-2xl font-extrabold text-white">{stats.active}</div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
              <div className="text-[11px] text-zinc-400">کل برنامه‌های خریداری‌شده</div>
              <div className="mt-2 text-2xl font-extrabold text-white">{stats.total}</div>
            </div>
          </div>

          {/* Body stats */}
          <div className="mt-4 rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] text-zinc-400">قد</div>
                <div className="mt-1 text-lg font-extrabold text-white">
                  {profile.heightCm} <span className="text-sm text-zinc-400">cm</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-400">وزن</div>
                <div className="mt-1 text-lg font-extrabold text-white">
                  {profile.weightKg} <span className="text-sm text-zinc-400">kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile form */}
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <FiUser className="text-cyan-300" />
              اطلاعات پروفایل
            </div>

            {!editing ? (
              <button
                onClick={onStartEdit}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
              >
                <FiEdit3 />
                ویرایش
              </button>
            ) : (
              <button
                onClick={onSave}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
              >
                <FiSave />
                ذخیره
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field
              label="نام"
              value={editing ? draft.firstName : profile.firstName}
              onChange={(v) => setDraft((p) => ({ ...p, firstName: v }))}
              disabled={!editing}
            />
            <Field
              label="نام خانوادگی"
              value={editing ? draft.lastName : profile.lastName}
              onChange={(v) => setDraft((p) => ({ ...p, lastName: v }))}
              disabled={!editing}
            />
          </div>

          <div className="mt-3">
            <Field label="شماره تماس" value={profile.phone} disabled />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
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

          {/* Photos */}
          <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-white">عکس‌های بدن</div>
                <div className="mt-1 text-[11px] text-zinc-400">
                  حداکثر ۵ عکس • برای ثبت پیشرفت (Front/Side/Back)
                </div>
              </div>

              <div className="text-[11px] text-zinc-400">
                {((editing ? draft.photos : profile.photos) || []).length}/5
              </div>
            </div>

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
              {((editing ? draft.photos : profile.photos) || []).map((p) => (
                <div
                  key={p.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.name || "photo"}
                    className="h-36 w-full object-cover sm:h-40"
                  />

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <div className="truncate text-[11px] text-zinc-200">
                      {p.name || "photo"}
                    </div>
                  </div>

                  {editing && (
                    <button
                      onClick={() => removePhoto(p.id)}
                      className="absolute left-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/50 text-zinc-100 opacity-100 hover:bg-black/65 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Remove photo"
                      title="حذف"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              ))}

              {((editing ? draft.photos : profile.photos) || []).length === 0 && (
                <div className="col-span-2 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300 sm:col-span-3">
                  هنوز عکسی اضافه نشده.
                </div>
              )}
            </div>
          </div>

          {/* Change password */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
            <div>
              <div className="text-sm font-extrabold text-white">امنیت حساب</div>
              <div className="mt-1 text-[11px] text-zinc-400">
                برای امنیت بیشتر، رمز عبور را دوره‌ای تغییر دهید.
              </div>
            </div>

            <button
              onClick={() => setPwdOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-zinc-100 hover:bg-white/10"
            >
              <FiLock />
              تغییر رمز عبور
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <ChangePasswordModal
        open={pwdOpen}
        onClose={() => setPwdOpen(false)}
        onSuccess={(msg) => setToast({ type: "success", text: msg })}
        onError={(msg) => setToast({ type: "error", text: msg })}
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
      onClick={() => !disabled && onPick?.()}
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
        "mt-4 cursor-pointer rounded-3xl border border-dashed p-4 transition",
        drag ? "border-emerald-400/40 bg-emerald-400/10" : "border-white/10 bg-white/5",
        disabled ? "cursor-not-allowed opacity-60" : "hover:bg-white/10"
      )}
    >
      <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-right">
        <div className="flex items-center gap-2 text-sm font-extrabold text-white">
          <FiUploadCloud className="text-emerald-300 text-xl" />
          آپلود عکس (حداکثر ۵)
        </div>

        <div className="text-[11px] text-zinc-400">
          {disabled ? "برای آپلود، وارد حالت ویرایش شوید." : "کلیک کنید یا فایل را درگ کنید."}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-end">
        <Chip icon={FiImage} text="Front" />
        <Chip icon={FiImage} text="Side" />
        <Chip icon={FiImage} text="Back" />
      </div>
    </div>
  );
}

function Chip({ icon: Icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-3 py-2 text-xs text-zinc-200">
      <Icon className="text-[16px]" />
      {text}
    </div>
  );
}

function Field({ label, value, onChange, disabled }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-bold text-zinc-300">{label}</div>
      <input
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={[
          "w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-white outline-none",
          "placeholder:text-zinc-500 focus:border-white/20",
          disabled ? "opacity-70" : "",
        ].join(" ")}
      />
    </label>
  );
}

function NumberField({ label, value, onChange, disabled, min, max }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-bold text-zinc-300">{label}</div>
      <input
        type="number"
        value={value ?? ""}
        min={min}
        max={max}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={[
          "w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-white outline-none",
          "placeholder:text-zinc-500 focus:border-white/20",
          disabled ? "opacity-70" : "",
        ].join(" ")}
      />
    </label>
  );
}
