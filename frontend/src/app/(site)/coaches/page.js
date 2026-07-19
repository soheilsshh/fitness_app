"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiUsers } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import { getCoachPublicPath } from "@/lib/routes/coach-public";

export default function CoachesListPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/coaches", { params: { page, pageSize } });
        if (cancelled) return;
        setItems(res.data?.items || []);
        setTotal(res.data?.total || 0);
      } catch {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 text-on-surface">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-landing-heading md:text-3xl">
          مربی‌های فیتینو
        </h1>
        <p className="mt-2 max-w-2xl text-sm site-muted md:text-base">
          مربی مورد نظر خود را انتخاب کنید و از صفحه اختصاصی او پلن‌ها را ببینید.
        </p>
      </div>

      {loading ? (
        <div className="site-panel rounded-3xl p-6 text-sm site-muted">
          در حال بارگذاری...
        </div>
      ) : items.length === 0 ? (
        <div className="site-panel rounded-3xl p-6 text-sm site-muted">
          مربی منتشرشده‌ای یافت نشد.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((coach) => (
            <Link
              key={coach.coachId || coach.slug}
              href={getCoachPublicPath(coach.slug)}
              className="site-chip rounded-[26px] p-5 transition hover:bg-[var(--landing-nav-hover)]"
            >
              <div className="flex items-start gap-3">
                <div className="site-chip inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
                  {coach.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={apiAssetUrl(coach.avatarUrl)}
                      alt={coach.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FiUsers className="text-xl text-surface-tint" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-extrabold text-on-surface">
                    {coach.displayName}
                  </div>
                  <div className="mt-1 text-xs site-muted">{coach.title || "—"}</div>
                  {coach.specialty ? (
                    <div className="mt-2 text-xs text-on-surface-variant">{coach.specialty}</div>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="site-chip rounded-2xl px-4 py-2 text-sm disabled:opacity-40"
          >
            قبلی
          </button>
          <span className="px-3 py-2 text-sm site-muted">
            صفحه {page} از {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="site-chip rounded-2xl px-4 py-2 text-sm disabled:opacity-40"
          >
            بعدی
          </button>
        </div>
      ) : null}
    </main>
  );
}
