"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Check } from "lucide-react";
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
 * Conditional coach approval: only pending AI drafts. Nutrition approve
 * also activates that version as the student's live program.
 */
function isPendingAI(p) {
  return p.source === "ai" && p.status !== "coach_approved";
}

export default function SavedProgramsApprovalCard({
  studentId,
  apiBase = "coach",
  type,
  onApproved,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const listPath = type === "workout" ? "workout-programs" : "nutrition-programs";
  const title = type === "workout" ? "برنامه تمرینی در انتظار تأیید" : "برنامه غذایی در انتظار تأیید";

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
      toastSuccess(
        "تأیید شد",
        type === "nutrition"
          ? "برنامه روی برنامه اصلی شاگرد اعمال شد."
          : "برنامه تأیید شد."
      );
      await load();
      onApproved?.();
    } catch (error) {
      toastError("خطا", error?.response?.data?.error || "تأیید ناموفق بود");
    } finally {
      setApprovingId(null);
    }
  }

  if (loading) return null;

  const pending = items.filter(isPendingAI);
  if (pending.length === 0) return null;

  const approveLabel =
    type === "nutrition" ? "تأیید و اعمال روی برنامه شاگرد" : "تأیید";

  return (
    <Card className="border-amber-500/25 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          {type === "nutrition"
            ? "برنامه‌های هوش مصنوعی که شاگرد برایت فرستاده. با تأیید، همان نسخه برنامه فعال شاگرد می‌شود."
            : "برنامه‌های هوش مصنوعی در انتظار تأیید — فقط همین نسخه‌ها دکمه تأیید دارند."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {pending.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background px-3 py-3"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{p.title}</span>
              <Badge
                variant="outline"
                className="gap-1 border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
              >
                <Bot className="size-3" />
                هوش مصنوعی
              </Badge>
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              >
                در انتظار تأیید
              </Badge>
              <span className="text-xs text-muted-foreground">{formatDateFa(p.createdAt)}</span>
            </div>
            <Button
              type="button"
              className="h-11 min-w-[11rem] cursor-pointer touch-manipulation gap-2"
              disabled={approvingId === p.id}
              onClick={() => handleApprove(p.id)}
            >
              <Check className="size-4" data-icon="inline-start" />
              {approvingId === p.id ? "در حال تأیید..." : approveLabel}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
