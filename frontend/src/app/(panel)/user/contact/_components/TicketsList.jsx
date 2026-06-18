"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

function faDate(d) {
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(d));
  } catch {
    return "";
  }
}

function statusLabel(status) {
  switch (status) {
    case "pending":
      return { label: "در حال بررسی", variant: "secondary" };
    case "in_review":
      return { label: "در حال بررسی", variant: "secondary" };
    case "answered":
      return { label: "پاسخ داده شده", variant: "default" };
    case "closed":
      return { label: "بسته شده", variant: "outline" };
    default:
      return { label: status || "نامشخص", variant: "outline" };
  }
}

function priorityLabel(priority) {
  switch (priority) {
    case "low":
      return { label: "کم", variant: "outline" };
    case "high":
      return { label: "بالا", variant: "destructive" };
    default:
      return { label: "معمولی", variant: "secondary" };
  }
}

function RowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="flex min-w-0 flex-col gap-2">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export default function TicketsList({ loading, error, items }) {
  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        {error}
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return <div className="py-6 text-center text-sm text-muted-foreground">تیکتی برای نمایش وجود ندارد.</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((t) => {
        const st = statusLabel(t.status);
        const pr = priorityLabel(t.priority);
        return (
          <div
            key={t.id}
            className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 text-start">
              <div className="truncate text-sm font-medium">{t.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{faDate(t.createdAt)}</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={st.variant}>{st.label}</Badge>
              <Badge variant={pr.variant}>{pr.label}</Badge>
              <Button asChild size="sm" variant="outline">
                <Link href={`/user/contact/${t.id}`}>جزئیات</Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

