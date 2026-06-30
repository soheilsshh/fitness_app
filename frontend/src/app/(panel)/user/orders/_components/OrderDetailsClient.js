"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { api } from "@/lib/axios/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import OrderDetailsPanel from "./OrderDetailsPanel";

function OrderDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <Skeleton className="h-9 w-40" />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

function BackLink({ href, children }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={href}>
        <ChevronRight data-icon="inline-start" />
        {children}
      </Link>
    </Button>
  );
}

function EmptyState({ href, backLabel, message }) {
  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <BackLink href={href}>{backLabel}</BackLink>
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {message}
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrderDetailsClient() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("id");
  const id = decodeURIComponent(String(rawId || "")).trim();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/me/orders/${id}`);
        if (!cancelled) setOrder(res.data);
      } catch {
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!rawId) {
    return (
      <EmptyState
        href="/user/orders"
        backLabel="برگشت به سفارش‌ها"
        message="پارامتر آیدی دریافت نشد."
      />
    );
  }

  if (loading) {
    return <OrderDetailsSkeleton />;
  }

  if (!order) {
    return (
      <EmptyState
        href="/user/orders"
        backLabel="برگشت به سفارش‌ها"
        message="سفارش پیدا نشد."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <BackLink href="/user/orders">برگشت به سفارش‌ها</BackLink>
      <OrderDetailsPanel order={order} />
    </div>
  );
}
