"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FiPhone,
  FiCalendar,
  FiActivity,
  FiCheckCircle,
  FiXCircle,
  FiShoppingBag,
  FiClipboard,
  FiChevronLeft,
} from "react-icons/fi";
import { api } from "@/lib/axios/client";
import UserBodySection from "./UserBodySection";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatDateFa(iso) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return "—";
  }
}

function formatToman(n) {
  const num = Number(n) || 0;
  return `${num.toLocaleString("fa-IR")} تومان`;
}

export default function UserDetailsClient({ id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchDetails() {
      setLoading(true);
      try {
        const res = await api.get(`/admin/users/${id}`);
        if (cancelled) return;
        setData(res.data || null);
      } catch (error) {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error("Failed to load admin user details", error);
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) {
      fetchDetails();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
        در حال بارگذاری جزئیات کاربر...
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
        کاربر پیدا نشد.
      </div>
    );
  }

  const user = data.user;
  const programs = Array.isArray(data.programs) ? data.programs : [];
  const body = data.body || {};
  const activeCount = programs.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-4">
      {/* Top actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
          >
            <FiChevronLeft />
            بازگشت
          </Link>

          <div className="text-lg font-extrabold text-white">جزئیات کاربر</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => alert("Demo: open user orders")}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
          >
            <FiShoppingBag />
            سفارش‌ها
          </button>

          <Link
            href="/admin/students"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
          >
            رفتن به شاگردها
          </Link>
        </div>
      </div>

      {/* Profile card */}
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-sm text-zinc-400">نام و نام خانوادگی</div>
            <div className="mt-1 truncate text-xl font-extrabold text-white">
              {user.firstName} {user.lastName}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <MetaBadge icon={FiPhone} label={user.phone} />
              <MetaBadge
                icon={FiCalendar}
                label={`عضویت: ${formatDateFa(user.createdAt)}`}
              />
              <MetaBadge
                icon={FiActivity}
                label={
                  user.activeProgram ? "برنامه فعال دارد" : "برنامه فعال ندارد"
                }
                tone={user.activeProgram ? "success" : "neutral"}
              />
            </div>
          </div>

          {/* KPIs */}
          <div className="grid w-full gap-2 md:w-auto md:grid-cols-3">
            <KpiCard
              title="دوره‌های خریداری‌شده"
              value={user.programsCount}
              icon={FiClipboard}
            />
            <KpiCard
              title="سفارش‌ها"
              value={user.ordersCount}
              icon={FiShoppingBag}
            />
            <KpiCard
              title="دوره‌های فعال"
              value={activeCount}
              icon={FiCheckCircle}
            />
          </div>
        </div>
      </div>

      <UserBodySection
        heightCm={body.heightCm}
        weightKg={body.weightKg}
        photos={body.photos}
      />

      {/* Programs list */}
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-base font-extrabold text-white">
              دوره‌های خریداری‌شده
            </div>
            <div className="mt-1 text-sm text-zinc-300">
              لیست دوره‌ها و وضعیت هر کدام
            </div>
          </div>

          <div className="text-xs text-zinc-400">
            مجموع:{" "}
            <span className="font-bold text-white">{programs.length}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {programs.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4 text-sm text-zinc-300">
              هنوز دوره‌ای خریداری نشده است.
            </div>
          ) : (
            programs.map((p) => (
              <div
                key={p.id}
                className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold text-white">
                      {p.title}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-400">
                      نوع:{" "}
                      {p.type === "both"
                        ? "تمرین + تغذیه"
                        : p.type === "workout"
                          ? "تمرین"
                          : "تغذیه"}{" "}
                      • شروع: {formatDateFa(p.startDate)} • مدت:{" "}
                      {p.durationDays} روز
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={p.status} />

                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-zinc-200">
                      مبلغ:{" "}
                      <span className="font-bold text-white">
                        {formatToman(p.price)}
                      </span>
                    </div>

                    <button
                      onClick={() => alert("Demo: open program details")}
                      className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
                    >
                      مشاهده
                    </button>
                  </div>
                </div>

                {/* Quick note */}
                {p.status === "active" && (
                  <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                    این دوره فعال است. {p.remainingDays} روز باقی‌مانده.
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MetaBadge({ icon: Icon, label, tone = "neutral" }) {
  const toneClass =
    tone === "success"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
      : "border-white/10 bg-white/5 text-zinc-200";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs",
        toneClass,
      )}
    >
      <Icon className="text-[16px]" />
      <span>{label}</span>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-zinc-400">{title}</div>
          <div className="mt-1 text-lg font-extrabold text-white">{value}</div>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-100">
          <Icon className="text-[18px]" />
        </span>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const isActive = status === "active";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold",
        isActive
          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-zinc-950/30 text-zinc-200",
      )}
    >
      {isActive ? <FiCheckCircle /> : <FiXCircle />}
      {isActive ? "فعال" : "اتمام"}
    </span>
  );
}
