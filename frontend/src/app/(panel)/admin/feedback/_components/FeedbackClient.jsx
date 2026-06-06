"use client";

import { useEffect, useMemo, useState } from "react";
import { FiMessageSquare } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import FeedbackList from "./FeedbackList";
import FeedbackDetailsModal from "./FeedbackDetailsModal";
import PaginationBar from "./PaginationBar";

export default function FeedbackClient() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/admin/feedbacks", { params: { page, pageSize } });
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
  const pageSafe = Math.min(page, totalPages);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return items.find((x) => x.id === selectedId) || null;
  }, [selectedId, items]);

  const onSelect = (id) => {
    setSelectedId(id);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">فیدبک‌ها</div>
          <div className="mt-1 text-sm text-zinc-300">
            پیام‌های کاربران را مشاهده کنید
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-zinc-200">
          <FiMessageSquare className="text-emerald-200" />
          تعداد پیام‌ها: <span className="font-bold text-white">{total}</span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
          در حال بارگذاری...
        </div>
      ) : (
        <FeedbackList items={items} onSelect={onSelect} />
      )}

      <PaginationBar
        page={pageSafe}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />

      <FeedbackDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        item={selected}
      />
    </div>
  );
}
