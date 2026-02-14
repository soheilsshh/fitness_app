"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FiSearch, FiUsers, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import {  mockUsers } from "./usersMock";

function formatDateFa(iso) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return "—";
  }
}

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function UsersClient() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all"); // all | active | inactive
  const [page, setPage] = useState(1);

  const pageSize = 8;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return mockUsers
      .filter((u) => {
        if (status === "active") return u.activeProgram;
        if (status === "inactive") return !u.activeProgram;
        return true;
      })
      .filter((u) => {
        if (!q) return true;
        const full = `${u.firstName} ${u.lastName}`.toLowerCase();
        return full.includes(q) || String(u.phone).includes(q);
      });
  }, [query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Never out of range (derived, no setState needed)
  const pageSafe = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSafe]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">کاربران</div>
          <div className="mt-1 text-sm text-zinc-300">
            کاربران ثبت‌نام‌شده را مدیریت کنید
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-zinc-200">
          <FiUsers className="text-emerald-200" />
          تعداد نتایج: <span className="font-bold text-white">{filtered.length}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <FiSearch className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="جستجو با نام یا شماره موبایل..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-3 pr-9 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
          />
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={status === "all"}
            onClick={() => {
              setStatus("all");
              setPage(1);
            }}
          >
            همه
          </FilterChip>
          <FilterChip
            active={status === "active"}
            onClick={() => {
              setStatus("active");
              setPage(1);
            }}
          >
            فعال‌ها
          </FilterChip>
          <FilterChip
            active={status === "inactive"}
            onClick={() => {
              setStatus("inactive");
              setPage(1);
            }}
          >
            غیرفعال‌ها
          </FilterChip>
        </div>
      </div>

      {/* Table-like list */}
      <div className="overflow-hidden rounded-3xl border border-white/10">
        <div className="hidden grid-cols-12 gap-2 border-b border-white/10 bg-zinc-950/40 px-4 py-3 text-[11px] text-zinc-400 md:grid">
          <div className="col-span-4">کاربر</div>
          <div className="col-span-3">شماره</div>
          <div className="col-span-2">دوره‌ها</div>
          <div className="col-span-2">سفارش‌ها</div>
          <div className="col-span-1 text-left">وضعیت</div>
        </div>

        <div className="divide-y divide-white/10 bg-white/5">
          {pageItems.length === 0 ? (
            <div className="p-5 text-sm text-zinc-300">کاربری پیدا نشد.</div>
          ) : (
            pageItems.map((u) => (
              <Link
                key={u.id}
                href={`/admin/users/${u.id}`}
                className="block px-4 py-4 hover:bg-white/10"
              >
                <div className="grid grid-cols-1 gap-2 md:grid-cols-12 md:gap-2">
                  <div className="md:col-span-4">
                    <div className="text-sm font-extrabold text-white">
                      {u.firstName} {u.lastName}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-400">
                      عضویت: {formatDateFa(u.createdAt)}
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <div className="text-sm text-zinc-200">{u.phone}</div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-sm text-zinc-200">{u.programsCount}</div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-sm text-zinc-200">{u.ordersCount}</div>
                  </div>

                  <div className="md:col-span-1 md:text-left">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-3 py-1 text-[11px] font-bold",
                        u.activeProgram
                          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                          : "border-white/10 bg-zinc-950/30 text-zinc-200"
                      )}
                    >
                      {u.activeProgram ? "فعال" : "غیرفعال"}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-zinc-400">
          صفحه <span className="text-white font-bold">{pageSafe}</span> از{" "}
          <span className="text-white font-bold">{totalPages}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={pageSafe <= 1}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10",
              pageSafe <= 1 ? "pointer-events-none opacity-50" : ""
            )}
          >
            <FiChevronRight />
            قبلی
          </button>

          <button
            onClick={goNext}
            disabled={pageSafe >= totalPages}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10",
              pageSafe >= totalPages ? "pointer-events-none opacity-50" : ""
            )}
          >
            بعدی
            <FiChevronLeft />
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-2xl px-4 py-2 text-sm font-extrabold transition",
        active
          ? "bg-white text-zinc-950"
          : "border border-white/10 bg-zinc-950/30 text-zinc-200 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
