"use client";

import { FiMail, FiPhone, FiUser, FiMessageSquare } from "react-icons/fi";

function formatDateTimeFa(iso) {
  try {
    return new Date(iso).toLocaleString("fa-IR");
  } catch {
    return "—";
  }
}

export default function FeedbackDetails({ item }) {
  if (!item) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
        یک پیام را از لیست انتخاب کنید.
      </div>
    );
  }

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-extrabold text-white">جزئیات پیام</div>
          <div className="mt-1 text-sm text-zinc-300">
            {formatDateTimeFa(item.createdAt)}
          </div>
        </div>

        <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-3 py-2 text-xs text-zinc-200">
          <FiMessageSquare className="text-cyan-200" />
          پیام کامل
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <InfoChip icon={FiUser} label="نام و نام خانوادگی" value={item.fullName} />
        <InfoChip icon={FiPhone} label="شماره تماس" value={item.phone} />
        <InfoChip icon={FiMail} label="ایمیل" value={item.email} />
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
        <div className="mb-2 text-[11px] font-bold text-zinc-400">متن پیام</div>
        <div className="whitespace-pre-wrap break-words text-sm text-zinc-100">
          {item.message}
        </div>
      </div>
    </div>
  );
}

function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
        <Icon className="text-zinc-300" />
        {label}
      </div>
      <div className="mt-2 text-sm font-extrabold text-white">{value || "—"}</div>
    </div>
  );
}
