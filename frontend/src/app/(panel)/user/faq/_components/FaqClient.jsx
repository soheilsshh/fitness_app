"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getFaq } from "@/lib/api/content";
import PanelEmptyState from "@/app/(panel)/user/_components/ui/PanelEmptyState";

function FaqLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5" dir="rtl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}

export default function FaqClient() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getFaq();
      setGroups(res?.groups || []);
    } catch {
      setGroups([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: (group.items || []).filter(
          (item) =>
            item.q?.toLowerCase().includes(q) || item.a?.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  const total = filtered.reduce((n, g) => n + (g.items?.length || 0), 0);

  if (loading) return <FaqLoading />;

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl" dir="rtl">
        <PanelEmptyState
          icon={HelpCircle}
          title="بارگذاری سوالات ناموفق بود"
          description="اتصال به سرور برقرار نشد."
        />
        <div className="mt-4 flex justify-center">
          <Button type="button" onClick={load}>
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5" dir="rtl">
      <div className="text-start">
        <div className="fitino-meta-badge mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-iranianSansMedium text-[#187272] dark:text-[#6ceade]">
          <HelpCircle className="size-3.5" />
          مرکز راهنما
        </div>
        <div className="mb-2 h-1 w-10 rounded-full bg-[linear-gradient(90deg,#26fce3,#187272)]" />
        <h2 className="font-iranianSansBlack text-xl tracking-tight sm:text-2xl">
          سوالات متداول
        </h2>
        <p className="mt-1.5 text-sm font-iranianSansMedium text-muted-foreground">
          پاسخ‌های واقعی برای مسیر تمرین، تغذیه، پایش و ارتباط با مربی در فیتینو.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجو در سوالات… مثلاً عکس بدن، پرداخت، تیکت"
          className="h-12 rounded-2xl ps-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="tabular-nums">
          {total.toLocaleString("fa-IR")} پاسخ
        </Badge>
        {query ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setQuery("")}>
            پاک کردن جستجو
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 py-10 text-center text-sm text-muted-foreground">
            <p>{groups.length === 0 ? "هنوز سوالی ثبت نشده." : "موردی با این جستجو پیدا نشد."}</p>
            <Button asChild variant="outline">
              <Link href="/user/contact">پرسیدن از مربی</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        filtered.map((group) => (
          <section key={group.id} className="space-y-3">
            <h3 className="text-sm font-iranianSansDemiBold text-foreground">
              {group.title}
            </h3>
            <Accordion type="single" collapsible className="rounded-2xl border border-border/70 px-2">
              {(group.items || []).map((item, index) => (
                <AccordionItem
                  key={`${group.id}-${index}`}
                  value={`${group.id}-${index}`}
                  className="border-border/60"
                >
                  <AccordionTrigger className="px-2 text-start text-sm font-iranianSansMedium hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-2 text-sm leading-7 text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))
      )}

      <Card className="border-primary/20 bg-primary/[0.04]">
        <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-start text-sm">
            <p className="font-iranianSansDemiBold text-foreground">
              جوابتان اینجا نبود؟
            </p>
            <p className="mt-1 text-muted-foreground">
              از بخش ارتباط با مربی سوال اختصاصی بپرسید.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/user/contact">ارتباط با مربی</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
