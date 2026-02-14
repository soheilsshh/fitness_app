"use client";

import { useMemo, useState } from "react";
import { FiMessageSquare } from "react-icons/fi";
import { mockFeedbacks } from "./feedbackMock";
import FeedbackList from "./FeedbackList";
import FeedbackDetailsModal from "./FeedbackDetailsModal";
import PaginationBar from "./PaginationBar";

export default function FeedbackClient() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [page, setPage] = useState(1);
  const pageSize = 8;

  const totalPages = Math.max(1, Math.ceil(mockFeedbacks.length / pageSize));
  const pageSafe = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return mockFeedbacks.slice(start, start + pageSize);
  }, [pageSafe]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return mockFeedbacks.find((x) => x.id === selectedId) || null;
  }, [selectedId]);

  const onSelect = (id) => {
    setSelectedId(id);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">فیدبک‌ها</div>
          <div className="mt-1 text-sm text-zinc-300">
            پیام‌های کاربران را مشاهده کنید
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-zinc-200">
          <FiMessageSquare className="text-emerald-200" />
          تعداد پیام‌ها: <span className="font-bold text-white">{mockFeedbacks.length}</span>
        </div>
      </div>

      {/* Full-width list */}
      <FeedbackList items={pageItems} onSelect={onSelect} />

      {/* Pagination */}
      <PaginationBar
        page={pageSafe}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />

      {/* Modal details */}
      <FeedbackDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        item={selected}
      />
    </div>
  );
}
