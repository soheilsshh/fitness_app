"use client";

import { useEffect, useMemo, useState } from "react";
import { FiMessageSquare } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import FeedbackList from "./FeedbackList";
import FeedbackDetailsModal from "./FeedbackDetailsModal";
import PaginationBar from "./PaginationBar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function faNum(value) {
  return new Intl.NumberFormat("fa-IR").format(value ?? 0);
}

export default function FeedbackClient() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/admin/feedbacks", { params: { page, pageSize } });
        if (cancelled) return;
        setItems(res.data?.items || []);
        setTotal(res.data?.total || 0);
      } catch (err) {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
          setError(err?.response?.data?.error || "بارگذاری فیدبک‌ها ناموفق بود.");
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
    <div dir="rtl" className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>فیدبک‌ها</CardTitle>
            <CardDescription>پیام‌های کاربران را مشاهده کنید</CardDescription>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <FiMessageSquare className="text-emerald-500" />
            تعداد پیام‌ها: <span className="font-bold">{faNum(total)}</span>
          </div>
        </CardHeader>
      </Card>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="pt-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {loading ? (
        <Card>
          <CardContent className="space-y-2 py-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </CardContent>
        </Card>
      ) : (
        <FeedbackList items={items} onSelect={onSelect} />
      )}

      <Card>
        <CardContent className="pt-4">
          <PaginationBar
            page={pageSafe}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </CardContent>
      </Card>

      <FeedbackDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        item={selected}
      />
    </div>
  );
}
