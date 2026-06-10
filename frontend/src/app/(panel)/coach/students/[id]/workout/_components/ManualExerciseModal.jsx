"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiUpload, FiX } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import { toastError } from "@/app/(site)/auth/_components/helpers";

function isVideoFile(file) {
  return file?.type?.startsWith("video/");
}

export default function ManualExerciseModal({ open, onClose, onAdd, dayLabel }) {
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [equipment, setEquipment] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("12");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, submitting]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api.get("/coach/exercises/categories")
      .then((res) => {
        if (!cancelled) setCategories(res.data?.categories || []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setCategory("");
      setBodyPart("");
      setEquipment("");
      setSets("3");
      setReps("12");
      setMediaFile(null);
      setMediaPreview("");
      setError("");
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!mediaFile) {
      setMediaPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(mediaFile);
    setMediaPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [mediaFile]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "video/mp4", "video/webm", "video/quicktime",
    ];
    if (!allowed.includes(file.type)) {
      setError("فرمت فایل پشتیبانی نمی‌شود. تصویر، GIF یا ویدیو انتخاب کنید.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("حداکثر حجم فایل ۲۵ مگابایت است.");
      return;
    }
    setError("");
    setMediaFile(file);
  };

  const handleSubmit = async (andContinue) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("نام حرکت الزامی است.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("name", trimmedName);
      if (description.trim()) fd.append("description", description.trim());
      if (category.trim()) fd.append("category", category.trim());
      if (bodyPart.trim()) fd.append("bodyPart", bodyPart.trim());
      if (equipment.trim()) fd.append("equipment", equipment.trim());
      if (mediaFile) fd.append("media", mediaFile);

      const res = await api.post("/coach/exercises", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const created = res.data || {};
      const imageUrl = created.gifUrl || created.imageUrl || "";

      onAdd?.({
        exerciseId: created.id,
        name: created.name || trimmedName,
        imageUrl,
        sets,
        reps,
      });

      if (andContinue) {
        setName("");
        setDescription("");
        setCategory("");
        setBodyPart("");
        setEquipment("");
        setSets("3");
        setReps("12");
        setMediaFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        onClose?.();
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "ثبت حرکت ناموفق بود.";
      setError(msg);
      toastError("خطا", msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200]">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={() => !submitting && onClose?.()}
        aria-label="بستن"
      />
      <div className="absolute inset-0 flex items-center justify-center p-3 md:p-6">
        <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-[26px] border border-white/10 bg-zinc-950 shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div>
              <div className="text-base font-extrabold text-white">افزودن حرکت دستی</div>
              {dayLabel ? (
                <div className="mt-0.5 text-xs text-zinc-400">برنامه {dayLabel}</div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 disabled:opacity-50"
            >
              <FiX />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <label className="block space-y-1.5">
              <span className="text-sm text-zinc-300">نام حرکت <span className="text-rose-300">*</span></span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً: پرس سینه با دمبل"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/40"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm text-zinc-300">توضیحات حرکت</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="نحوه اجرا، نکات ایمنی و..."
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/40"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-sm text-zinc-300">تعداد ست</span>
                <input
                  type="number"
                  min="1"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/40"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-zinc-300">تعداد تکرار</span>
                <input
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="۱۲"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/40"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm text-zinc-300">دسته‌بندی</span>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="exercise-categories"
                placeholder="مثلاً: سینه"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/40"
              />
              <datalist id="exercise-categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-sm text-zinc-300">عضله هدف</span>
                <input
                  value={bodyPart}
                  onChange={(e) => setBodyPart(e.target.value)}
                  placeholder="مثلاً: سینه"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/40"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-zinc-300">تجهیزات</span>
                <input
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  placeholder="مثلاً: دمبل"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/40"
                />
              </label>
            </div>

            <div className="space-y-2">
              <span className="text-sm text-zinc-300">انیمیشن یا ویدیو</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                onChange={handleFileChange}
                className="hidden"
              />
              {mediaPreview ? (
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
                  {isVideoFile(mediaFile) ? (
                    <video
                      src={mediaPreview}
                      className="max-h-48 w-full object-contain"
                      controls
                      muted
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="پیش‌نمایش"
                      className="max-h-48 w-full object-contain"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMediaFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute left-2 top-2 rounded-xl bg-black/60 p-2 text-zinc-200 hover:bg-black/80"
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-8 text-sm text-zinc-400 hover:border-emerald-400/30 hover:bg-emerald-400/5 hover:text-emerald-200"
                >
                  <FiUpload className="text-xl" />
                  <span>انتخاب تصویر، GIF یا ویدیو</span>
                  <span className="text-[11px] text-zinc-500">حداکثر ۲۵ مگابایت</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 border-t border-white/10 px-5 py-4">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-zinc-100 hover:bg-white/10 disabled:opacity-50"
            >
              {submitting ? "در حال ثبت..." : "ثبت و ادامه"}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="flex-1 rounded-2xl bg-white py-2.5 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
            >
              {submitting ? "در حال ثبت..." : "ثبت و افزودن به برنامه"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
