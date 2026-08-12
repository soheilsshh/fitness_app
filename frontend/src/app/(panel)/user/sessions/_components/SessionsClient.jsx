"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Video, Users2 } from "lucide-react";
import { api } from "@/lib/axios/client";
import PageHeader from "@/app/(panel)/user/_components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const STATUS_LABEL = {
  scheduled: { label: "برنامه‌ریزی‌شده", variant: "outline" },
  completed: { label: "برگزار شده", variant: "secondary" },
  cancelled: { label: "لغو شده", variant: "destructive" },
};

function SessionRow({ session }) {
  const status = STATUS_LABEL[session.status] || STATUS_LABEL.scheduled;
  const date = session.scheduledAt ? new Date(session.scheduledAt) : null;

  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3">
      <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
        {session.type === "online" ? (
          <Video className="size-4 text-primary" />
        ) : (
          <Users2 className="size-4 text-primary" />
        )}
      </span>
      <div className="min-w-0 flex-1 text-start">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-iranianSansDemiBold">
            {session.type === "online" ? "جلسه آنلاین" : "جلسه حضوری"}
          </p>
          <Badge variant={status.variant} className="text-[10px]">
            {status.label}
          </Badge>
        </div>
        {date ? (
          <p className="mt-1 text-xs tabular-nums text-muted-foreground">
            {date.toLocaleDateString("fa-IR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {" · "}
            {date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
            {" · "}
            {session.durationMinutes?.toLocaleString("fa-IR")} دقیقه
          </p>
        ) : null}
        {session.notes ? (
          <p className="mt-1.5 text-xs text-muted-foreground">{session.notes}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function SessionsClient() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/me/sessions");
      setSessions(res.data?.items || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || "بارگذاری جلسات ناموفق بود");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="جلسات من با مربی"
        description="تقویم جلسات برنامه‌ریزی‌شده — این صفحه فقط مشاهده است، زمان‌بندی توسط مربی انجام می‌شود"
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <CalendarClock className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              هنوز جلسه‌ای با مربی شما برنامه‌ریزی نشده است
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
