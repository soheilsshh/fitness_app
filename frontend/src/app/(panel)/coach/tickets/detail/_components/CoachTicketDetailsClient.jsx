"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/axios/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

function faDateTime(d) {
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(d)
    );
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

export default function CoachTicketDetailsClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ticket, setTicket] = useState(null);
  const [answer, setAnswer] = useState("");

  async function loadTicket() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/coach/tickets/${id}`);
      setTicket(res.data || null);
      setAnswer(res.data?.answer || "");
    } catch (err) {
      setTicket(null);
      setError(err?.response?.data?.error || "بارگذاری تیکت ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSubmitAnswer(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.patch(`/coach/tickets/${id}/answer`, { answer });
      setTicket(res.data || null);
      setAnswer(res.data?.answer || answer);
      setSuccess("پاسخ شما ثبت شد.");
    } catch (err) {
      setError(err?.response?.data?.error || "ثبت پاسخ ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onMarkInReview() {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.patch(`/coach/tickets/${id}/status`, { status: "in_review" });
      setTicket(res.data || null);
      setSuccess("وضعیت تیکت به «در حال بررسی» تغییر کرد.");
    } catch (err) {
      setError(err?.response?.data?.error || "تغییر وضعیت ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onCloseTicket() {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.patch(`/coach/tickets/${id}/status`, { status: "closed" });
      setTicket(res.data || null);
      setSuccess("تیکت بسته شد.");
    } catch (err) {
      setError(err?.response?.data?.error || "بستن تیکت ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  }

  const isClosed = ticket?.status === "closed";

  return (
    <div dir="rtl" className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-start">
          <h2 className="text-lg font-semibold tracking-tight">جزئیات تیکت</h2>
          <p className="mt-1 text-sm text-muted-foreground">مشاهده پیام دانشجو و ارسال پاسخ</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/coach/tickets">بازگشت به لیست</Link>
        </Button>
      </div>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="pt-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}
      {success ? (
        <Card className="border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="pt-4 text-sm text-emerald-700 dark:text-emerald-300">
            {success}
          </CardContent>
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
        <>
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
              <div className="text-start">
                <CardTitle className="text-base">{ticket.title}</CardTitle>
                <div className="mt-1 text-xs text-muted-foreground">
                  {ticket.studentName || "دانشجو"}
                  {ticket.studentPhone ? ` • ${ticket.studentPhone}` : ""}
                  {" • "}
                  {faDateTime(ticket.createdAt)}
                </div>
              </div>
              <Badge variant={statusLabel(ticket.status).variant}>
                {statusLabel(ticket.status).label}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-start">
                <div className="mb-2 text-xs font-medium text-muted-foreground">پیام دانشجو</div>
                <div className="whitespace-pre-wrap text-sm leading-7">{ticket.message}</div>
              </div>

              {ticket.answer ? (
                <div className="rounded-lg border border-border bg-linear-to-t from-primary/5 to-card p-4 text-start">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    پاسخ شما
                    {ticket.answeredAt ? ` • ${faDateTime(ticket.answeredAt)}` : ""}
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-7">{ticket.answer}</div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ارسال پاسخ</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmitAnswer}>
                <div className="space-y-2">
                  <Label htmlFor="coach-answer">متن پاسخ</Label>
                  <Textarea
                    id="coach-answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="پاسخ خود را بنویسید…"
                    disabled={isClosed || submitting}
                    required
                    className="min-h-28 text-start leading-7"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={isClosed || submitting}>
                    {submitting ? "در حال ارسال..." : "ثبت پاسخ"}
                  </Button>
                  {ticket.status === "pending" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={submitting}
                      onClick={onMarkInReview}
                    >
                      در حال بررسی
                    </Button>
                  ) : null}
                  {!isClosed ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={submitting}
                      onClick={onCloseTicket}
                    >
                      بستن تیکت
                    </Button>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>
        </>
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
