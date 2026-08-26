"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Check, Power, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/axios/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateFa } from "./helpers";

function SourceStatusBadges({ item }) {
  return (
    <>
      <Badge
        variant="outline"
        className={
          item.source === "ai"
            ? "gap-1 border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
            : "gap-1 border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
        }
      >
        {item.source === "ai" ? <Bot className="size-3" /> : <UserCheck className="size-3" />}
        {item.source === "ai" ? "هوش مصنوعی" : "مربی"}
      </Badge>
      {item.source === "ai" ? (
        <Badge
          variant="outline"
          className={
            item.status === "coach_approved"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          }
        >
          {item.status === "coach_approved" ? "تأییدشده توسط مربی" : "در انتظار تأیید مربی"}
        </Badge>
      ) : null}
    </>
  );
}

/**
 * Lists every saved version (active + inactive pool) of the student's
 * workout/nutrition program for the current subscription, with
 * activate/deactivate actions. Only one version can be active at a time —
 * activating a pooled one deactivates whatever else was active.
 */
export default function SavedPlansPoolCard({ type }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const listPath = type === "workout" ? "workout-programs" : "nutrition-programs";
  const title =
    type === "workout" ? "سایر برنامه‌های تمرینی ذخیره‌شده" : "سایر برنامه‌های غذایی ذخیره‌شده";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/me/${listPath}`);
      setItems(res.data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [listPath]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggle(item) {
    setBusyId(item.id);
    try {
      const action = item.isActive ? "deactivate" : "activate";
      await api.post(`/me/${listPath}/${item.id}/${action}`);
      toast.success(item.isActive ? "برنامه غیرفعال شد" : "برنامه فعال شد");
      // Activating/deactivating changes which program the rest of the page
      // (day plan, exercises) should show — a full reload keeps this simple
      // and correct instead of threading refetch callbacks through props.
      window.location.reload();
    } catch (error) {
      toast.error(error?.response?.data?.error || "عملیات ناموفق بود");
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-2 pt-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-14 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) return null;

  const activeItem = items.find((it) => it.isActive);
  const pool = items.filter((it) => !it.isActive);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>در آن واحد فقط یک برنامه می‌تواند فعال باشد</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {activeItem ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{activeItem.title}</span>
              <Badge>فعال</Badge>
              <SourceStatusBadges item={activeItem} />
              <span className="text-xs text-muted-foreground">
                {formatDateFa(activeItem.createdAt)}
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busyId === activeItem.id}
              onClick={() => handleToggle(activeItem)}
            >
              <Power data-icon="inline-start" />
              {busyId === activeItem.id ? "در حال اجرا..." : "غیرفعال‌سازی"}
            </Button>
          </div>
        ) : null}

        {pool.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{item.title}</span>
              <SourceStatusBadges item={item} />
              <span className="text-xs text-muted-foreground">{formatDateFa(item.createdAt)}</span>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={busyId === item.id}
              onClick={() => handleToggle(item)}
            >
              <Check data-icon="inline-start" />
              {busyId === item.id ? "در حال اجرا..." : "فعال‌سازی"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
