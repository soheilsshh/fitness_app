"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Check, UserCheck } from "lucide-react";
import { api } from "@/lib/axios/client";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
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

function formatDateFa(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/**
 * Coaches never generate/regenerate content with AI — this card only lets
 * them see a student's saved program versions (active + inactive pool) and
 * "approve" the ones the student built themselves with AI. Manual editing
 * stays on the normal editor form; this card doesn't touch program content.
 */
export default function SavedProgramsApprovalCard({ studentId, apiBase = "coach", type }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const listPath = type === "workout" ? "workout-programs" : "nutrition-programs";
  const title = type === "workout" ? "برنامه‌های تمرینی ذخیره‌شده" : "برنامه‌های غذایی ذخیره‌شده";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/${apiBase}/students/${studentId}/${listPath}`);
      setItems(res.data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase, studentId, listPath]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(programId) {
    setApprovingId(programId);
    try {
      await api.post(`/${apiBase}/students/${studentId}/${listPath}/${programId}/approve`);
      toastSuccess("تأیید شد", "برنامه تأیید شد.");
      await load();
    } catch (error) {
      toastError("خطا", error?.response?.data?.error || "تأیید ناموفق بود");
    } finally {
      setApprovingId(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-2 pt-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-16 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          نسخه‌های ذخیره‌شده‌ی این دانشجو (فعال و غیرفعال) — برنامه‌هایی که با هوش مصنوعی
          ساخته شده‌اند را می‌توانید تأیید کنید.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{p.title}</span>
              <Badge
                variant="outline"
                className={
                  p.source === "ai"
                    ? "gap-1 border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                    : "gap-1 border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                }
              >
                {p.source === "ai" ? <Bot className="size-3" /> : <UserCheck className="size-3" />}
                {p.source === "ai" ? "هوش مصنوعی" : "مربی"}
              </Badge>
              {p.isActive ? <Badge>فعال</Badge> : null}
              {p.source === "ai" ? (
                <Badge
                  variant="outline"
                  className={
                    p.status === "coach_approved"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  }
                >
                  {p.status === "coach_approved" ? "تأییدشده توسط مربی" : "در انتظار تأیید مربی"}
                </Badge>
              ) : null}
              <span className="text-xs text-muted-foreground">{formatDateFa(p.createdAt)}</span>
            </div>
            {p.source === "ai" && p.status !== "coach_approved" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={approvingId === p.id}
                onClick={() => handleApprove(p.id)}
              >
                <Check data-icon="inline-start" />
                {approvingId === p.id ? "در حال تأیید..." : "تأیید"}
              </Button>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
