"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiLock } from "react-icons/fi";

export default function ChangePasswordModal({ open, onClose, onSuccess, onError }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrent("");
      setNext("");
      setConfirm("");
      setSubmitting(false);
    }
  }, [open]);

  const validate = () => {
    if (!current || !next || !confirm) return "همه فیلدها الزامی هستند.";
    if (next.length < 6) return "رمز جدید باید حداقل ۶ کاراکتر باشد.";
    if (next !== confirm) return "رمز جدید با تکرار آن یکسان نیست.";
    if (next === current) return "رمز جدید نباید با رمز فعلی یکسان باشد.";
    return null;
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) {
      onError?.(err);
      return;
    }

    setSubmitting(true);

    try {
      // TODO: Replace with API call
      await new Promise((r) => setTimeout(r, 600));

      onSuccess?.("رمز عبور با موفقیت تغییر کرد.");
      onClose?.();
    } catch (e) {
      onError?.("خطا در تغییر رمز عبور. دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
          >
            <div className="rounded-[26px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                  <FiLock className="text-emerald-300" />
                  تغییر رمز عبور
                </div>

                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-100 hover:bg-white/10"
                  aria-label="Close"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="mt-5 space-y-3">
                <Field
                  label="رمز فعلی"
                  value={current}
                  onChange={setCurrent}
                  type="password"
                />
                <Field
                  label="رمز جدید"
                  value={next}
                  onChange={setNext}
                  type="password"
                />
                <Field
                  label="تکرار رمز جدید"
                  value={confirm}
                  onChange={setConfirm}
                  type="password"
                />
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-zinc-100 hover:bg-white/10"
                >
                  انصراف
                </button>

                <button
                  onClick={onSubmit}
                  disabled={submitting}
                  className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200 disabled:opacity-60"
                >
                  {submitting ? "در حال ثبت..." : "تایید"}
                </button>
              </div>

              <div className="mt-3 text-[11px] text-zinc-500">
                نکته: این بخش فعلاً دمو است؛ بعداً به API متصل می‌شود.
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-bold text-zinc-300">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/20"
      />
    </label>
  );
}
