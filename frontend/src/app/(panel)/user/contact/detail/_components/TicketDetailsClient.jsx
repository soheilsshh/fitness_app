"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/axios/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function faDateTime(d) {
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
  } catch {
    return "";
  }
}

function statusLabel(status) {
  switch (status) {
    case "pending":
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

export default function TicketDetailsClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/me/tickets/${id}`);
        if (cancelled) return;
        setTicket(res.data || null);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || "بارگذاری تیکت ناموفق بود.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-start">
          <h2 className="text-lg font-semibold tracking-tight">جزئیات تیکت</h2>
          <p className="mt-1 text-sm text-muted-foreground">پیگیری وضعیت و مشاهده پاسخ مربی</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/user/contact">بازگشت</Link>
        </Button>
      </div>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="pt-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {loading ? (
        <Card>
          <CardContent className="space-y-3 py-6">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ) : ticket ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div className="text-start">
              <CardTitle className="text-base">{ticket.title}</CardTitle>
              <div className="mt-1 text-xs text-muted-foreground">
                ثبت شده در {faDateTime(ticket.createdAt)}
                {ticket.answeredAt ? ` • پاسخ در ${faDateTime(ticket.answeredAt)}` : ""}
              </div>
            </div>
            <Badge variant={statusLabel(ticket.status).variant}>{statusLabel(ticket.status).label}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-start text-sm leading-7">
              <div className="mb-2 text-xs font-medium text-muted-foreground">پیام شما</div>
              <div className="whitespace-pre-wrap">{ticket.message}</div>
            </div>

            <div className="rounded-lg border border-border bg-linear-to-t from-primary/5 to-card p-4 text-start text-sm leading-7">
              <div className="mb-2 text-xs font-medium text-muted-foreground">پاسخ مربی</div>
              {ticket.answer ? (
                <div className="whitespace-pre-wrap">{ticket.answer}</div>
              ) : (
                <div className="text-muted-foreground">هنوز پاسخی ثبت نشده است.</div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            تیکت موردنظر یافت نشد.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

