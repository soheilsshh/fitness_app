"use client";

import { useEffect } from "react";
import { FiMail, FiPhone, FiUser, FiX } from "react-icons/fi";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatDateTimeFa(iso) {
  try {
    return new Date(iso).toLocaleString("fa-IR");
  } catch {
    return "—";
  }
}

export default function FeedbackDetailsModal({ open, onClose, item }) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);

    // Lock scroll behind modal
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close"
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-3 md:p-6">
        <div
          className={cn(
            "w-full max-w-2xl overflow-hidden rounded-[26px] border border-white/10 bg-zinc-950/90 shadow-2xl",
            "backdrop-blur"
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="min-w-0">
              <div className="text-base font-extrabold text-white">جزئیات پیام</div>
              <div className="mt-1 text-sm text-zinc-300">
                {item?.createdAt ? formatDateTimeFa(item.createdAt) : "—"}
              </div>
            </div>

            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
              aria-label="Close"
            >
              <FiX className="text-lg" />
            </button>
          </div>

          {/* Body */}
          {!item ? (
            <div className="p-6 text-sm text-zinc-300">پیامی انتخاب نشده است.</div>
          ) : (
            <div className="p-5 md:p-6">
              <div className="grid gap-3 md:grid-cols-3">
                <InfoChip icon={FiUser} label="نام و نام خانوادگی" value={item.fullName} />
                <InfoChip icon={FiPhone} label="شماره تماس" value={item.phone} />
                <InfoChip icon={FiMail} label="ایمیل" value={item.email} />
              </div>

              <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 text-[11px] font-bold text-zinc-400">متن پیام</div>
                <div className="whitespace-pre-wrap break-words text-sm text-zinc-100">
                  {item.message}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end border-t border-white/10 px-5 py-4">
            <button
              onClick={onClose}
              className="rounded-2xl bg-white px-5 py-2.5 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
        <Icon className="text-zinc-300" />
        {label}
      </div>
      <div className="mt-2 truncate text-sm font-extrabold text-white">{value || "—"}</div>
    </div>
  );
}
