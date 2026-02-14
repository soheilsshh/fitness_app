"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FiUserCheck } from "react-icons/fi";
import { mockStudents } from "./studentsMock";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function StudentsClient() {
  const [filter, setFilter] = useState("pending"); // pending | active
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim();
    return mockStudents
      .filter((s) => s.status === filter)
      .filter((s) => {
        if (!query) return true;
        return (
          s.fullName.includes(query) ||
          String(s.phone).includes(query) ||
          s.planTitle.includes(query)
        );
      });
  }, [filter, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">شاگردهای من</div>
          <div className="mt-1 text-sm text-zinc-300">
            در انتظار: هنوز برنامه اختصاصی نگرفته • فعال: برنامه تخصیص داده شده
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-zinc-200">
          <FiUserCheck className="text-emerald-200" />
          نتایج: <span className="font-bold text-white">{filtered.length}</span>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2 rounded-3xl border border-white/10 bg-white/5 p-2">
          <Tab active={filter === "pending"} onClick={() => setFilter("pending")}>
            در انتظار
          </Tab>
          <Tab active={filter === "active"} onClick={() => setFilter("active")}>
            فعال
          </Tab>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجو (نام/موبایل/پلن)..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40 md:max-w-md"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
            موردی یافت نشد.
          </div>
        ) : (
          filtered.map((s) => (
            <Link
              key={s.id}
              href={`/admin/students/${s.id}`}
              className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold text-white">
                  {s.fullName}
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">{s.phone}</div>
                <div className="mt-2 text-[11px] text-zinc-300">
                  پلن: <span className="font-bold text-white">{s.planTitle}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] font-bold",
                    s.status === "active"
                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-zinc-950/30 text-zinc-200"
                  )}
                >
                  {s.status === "active" ? "فعال" : "در انتظار"}
                </span>

                <span className="rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1 text-[11px] text-zinc-200">
                  {s.planType === "both"
                    ? "تمرین + تغذیه"
                    : s.planType === "workout"
                    ? "تمرین"
                    : "تغذیه"}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function Tab({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl px-4 py-2 text-sm font-extrabold transition",
        active
          ? "bg-white text-zinc-950"
          : "border border-white/10 bg-zinc-950/30 text-zinc-200 hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}
