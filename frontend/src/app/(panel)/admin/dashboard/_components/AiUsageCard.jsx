"use client";

import { useEffect, useState } from "react";
import { Bot } from "lucide-react";
import { api } from "@/lib/axios/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const REQUEST_TYPE_LABELS = {
  nutrition_plan: "برنامه غذایی",
  workout_plan: "برنامه تمرینی",
  ingredient_suggestion: "تک‌غذا",
  meal_replacement: "تعویض وعده",
  food_log_voice: "ثبت غذا با صدا",
  set_log_voice: "ثبت ست با صدا",
  transcribe_only: "تبدیل صدا به متن",
  chat: "چت راهنما",
};

export default function AiUsageCard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/admin/ai/usage", { params: { days: 30 } })
      .then((res) => {
        if (!cancelled) setItems(res.data?.items || []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalTokens = items.reduce(
    (sum, it) => sum + (it.PromptTokens || 0) + (it.CompletionTokens || 0),
    0
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="size-4 text-primary" />
          مصرف دستیار هوشمند (۳۰ روز اخیر)
        </CardTitle>
        <CardDescription>تعداد فراخوانی و توکن مصرفی به تفکیک نوع درخواست و نسخه پرامپت</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">هنوز داده‌ای ثبت نشده است.</p>
        ) : (
          <div className="space-y-2">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-start text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-2 text-start font-normal">نوع درخواست</th>
                    <th className="py-2 text-start font-normal">نسخه پرامپت</th>
                    <th className="py-2 text-start font-normal">تعداد</th>
                    <th className="py-2 text-start font-normal">موفق</th>
                    <th className="py-2 text-start font-normal">توکن (prompt+completion)</th>
                    <th className="py-2 text-start font-normal">میانگین تأخیر</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, i) => (
                    <tr key={`${row.RequestType}-${row.PromptVersion}-${i}`} className="border-b last:border-0">
                      <td className="py-2">
                        {REQUEST_TYPE_LABELS[row.RequestType] || row.RequestType}
                      </td>
                      <td className="py-2">
                        <Badge variant="outline" className="text-[10px]">
                          {row.PromptVersion || "—"}
                        </Badge>
                      </td>
                      <td className="py-2 tabular-nums">{row.Count?.toLocaleString("fa-IR")}</td>
                      <td className="py-2 tabular-nums">{row.SuccessCount?.toLocaleString("fa-IR")}</td>
                      <td className="py-2 tabular-nums">
                        {((row.PromptTokens || 0) + (row.CompletionTokens || 0)).toLocaleString("fa-IR")}
                      </td>
                      <td className="py-2 tabular-nums">
                        {Math.round(row.AvgLatencyMs || 0).toLocaleString("fa-IR")}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              جمع کل توکن: {totalTokens.toLocaleString("fa-IR")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
