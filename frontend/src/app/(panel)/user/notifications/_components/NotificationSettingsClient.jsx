"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Quote } from "lucide-react";
import { api } from "@/lib/axios/client";
import PageHeader from "@/app/(panel)/user/_components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function QuoteCard() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/me/optimal/quote");
        if (!cancelled) setQuote(res.data);
      } catch {
        if (!cancelled) setQuote(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Quote className="size-4 text-primary" />
          جمله انگیزشی امروز
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-10 w-full" />
        ) : quote ? (
          <blockquote className="border-r-2 border-primary/40 pr-3 text-sm leading-relaxed text-foreground">
            {quote.text}
            {quote.author ? (
              <footer className="mt-1 text-xs text-muted-foreground">
                — {quote.author}
              </footer>
            ) : null}
          </blockquote>
        ) : (
          <p className="text-sm text-muted-foreground">جمله‌ای برای نمایش یافت نشد</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function NotificationSettingsClient() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/me/notifications/settings");
      setEnabled(Boolean(res.data?.notificationsEnabled));
    } catch (err) {
      toast.error(err?.response?.data?.error || "بارگذاری تنظیمات ناموفق بود");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async () => {
    const next = !enabled;
    setSaving(true);
    try {
      const res = await api.patch("/me/notifications/settings", {
        notificationsEnabled: next,
      });
      setEnabled(Boolean(res.data?.notificationsEnabled ?? next));
      toast.success(
        next ? "یادآوری‌ها فعال شد" : "یادآوری‌ها غیرفعال شد"
      );
    } catch (err) {
      toast.error(err?.response?.data?.error || "به‌روزرسانی تنظیمات ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="اعلان‌ها و یادآوری‌ها"
        description="روشن/خاموش کردن یادآوری‌های بی‌فعالی (پیامک و اپ)"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">یادآوری‌های خودکار</CardTitle>
          <CardDescription>
            وقتی این گزینه فعال باشد، اگر مدتی برنامه را باز نکنید، پیامک و
            نوتیفیکیشن یادآوری برای شما ارسال می‌شود
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2">
                {enabled ? (
                  <Bell className="size-4 text-primary" />
                ) : (
                  <BellOff className="size-4 text-muted-foreground" />
                )}
                <span className="text-sm font-iranianSansMedium">
                  {enabled ? "یادآوری‌ها فعال است" : "یادآوری‌ها غیرفعال است"}
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant={enabled ? "outline" : "default"}
                disabled={saving}
                onClick={toggle}
                className={cn(enabled && "text-muted-foreground")}
              >
                {enabled ? "غیرفعال کردن" : "فعال کردن"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <QuoteCard />
    </div>
  );
}
