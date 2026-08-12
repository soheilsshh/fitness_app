"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Dedicated "پیشنهاد AI برای این برنامه" entry point — separate from the
 * plain edit form at /coach/plans/detail. Placeholder for the Before/After
 * diff + accept/reject flow (Phase 3).
 */
export default function CoachAISuggestClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-iranianSansDemiBold text-foreground">
            <SparklesIcon className="size-5 text-primary" />
            پیشنهاد AI برای این برنامه
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مقایسهٔ نسخهٔ فعلی و پیشنهاد هوش مصنوعی، به‌همراه امکان قبول یا رد تک‌به‌تک تغییرات.
          </p>
        </div>
        {id ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/coach/plans/detail?id=${id}`}>
              <ChevronLeft data-icon="inline-start" />
              بازگشت به برنامه
            </Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {id
            ? "پنل مقایسهٔ Before/After و اکشن‌های قبول/رد به‌زودی اینجا قرار می‌گیرد."
            : "برنامه‌ای مشخص نشده — از صفحهٔ جزئیات یک پلن وارد این بخش شوید."}
        </CardContent>
      </Card>
    </div>
  );
}
