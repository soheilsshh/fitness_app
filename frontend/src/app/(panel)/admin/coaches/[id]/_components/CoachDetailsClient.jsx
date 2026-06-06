"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { FiChevronLeft, FiExternalLink } from "react-icons/fi";
import { api } from "@/lib/axios/client";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function CoachDetailsClient({ id }) {
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/coaches/${id}`);
      setCoach(res.data);
    } catch {
      setCoach(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (patchBody) => {
    setSaving(true);
    try {
      const res = await api.patch(`/admin/coaches/${id}`, patchBody);
      setCoach(res.data);
    } catch {
      await Swal.fire({
        icon: "error",
        title: "خطا",
        text: "بروزرسانی انجام نشد.",
        confirmButtonText: "باشه",
        background: "#0a0a0a",
        color: "#fff",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
        در حال بارگذاری...
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
        مربی پیدا نشد.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/coaches"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
          >
            <FiChevronLeft />
            بازگشت
          </Link>
          <div className="text-lg font-extrabold text-white">{coach.displayName}</div>
        </div>
        {coach.isPublished && coach.slug ? (
          <Link
            href={`/coach/${coach.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
          >
            صفحه عمومی
            <FiExternalLink />
          </Link>
        ) : null}
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs text-zinc-400">عنوان</div>
            <div className="mt-1 text-sm text-white">{coach.title || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">اسلاگ</div>
            <div className="mt-1 text-sm text-white">/{coach.slug}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">تخصص</div>
            <div className="mt-1 text-sm text-white">{coach.specialty || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">تعداد دانشجویان</div>
            <div className="mt-1 text-sm font-bold text-white">{coach.studentCount}</div>
          </div>
        </div>

        {coach.bio ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
            <div className="text-sm font-bold text-white">بیو</div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{coach.bio}</div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <ToggleButton
            label="انتشار"
            active={coach.isPublished}
            disabled={saving}
            onToggle={() => patch({ isPublished: !coach.isPublished })}
            activeText="منتشر شده"
            inactiveText="پیش‌نویس"
          />
          <ToggleButton
            label="وضعیت"
            active={coach.isActive}
            disabled={saving}
            onToggle={() => patch({ isActive: !coach.isActive })}
            activeText="فعال"
            inactiveText="غیرفعال"
          />
        </div>
      </div>
    </div>
  );
}

function ToggleButton({ label, active, disabled, onToggle, activeText, inactiveText }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm font-extrabold transition disabled:opacity-50",
        active
          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-zinc-950/30 text-zinc-200 hover:bg-white/10"
      )}
    >
      {label}: {active ? activeText : inactiveText}
    </button>
  );
}
