"use client";

import { useCallback, useEffect, useState } from "react";
import { Award, Medal, Sparkles } from "lucide-react";
import { api } from "@/lib/axios/client";
import PageHeader from "@/app/(panel)/user/_components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

function AwardCard({ award }) {
  return (
    <Card className="border-amber-500/20 bg-gradient-to-t from-amber-500/5 to-card">
      <CardContent className="flex items-start gap-3 pt-5">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
          {award.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={award.iconUrl} alt="" className="size-6" />
          ) : (
            <Medal className="size-5 text-amber-600 dark:text-amber-400" />
          )}
        </span>
        <div className="min-w-0 flex-1 text-start">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-iranianSansDemiBold text-foreground">
              {award.title}
            </p>
            <Badge variant="outline" className="text-[10px] tabular-nums">
              +{award.points?.toLocaleString("fa-IR")} امتیاز
            </Badge>
          </div>
          {award.description ? (
            <p className="mt-1 text-xs text-muted-foreground">{award.description}</p>
          ) : null}
          {award.awardedAt ? (
            <p className="mt-1.5 text-[11px] tabular-nums text-muted-foreground">
              {new Date(award.awardedAt).toLocaleDateString("fa-IR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AchievementsClient() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/me/achievements");
      setSummary(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.error || "بارگذاری دستاوردها ناموفق بود");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const awards = summary?.awards || [];

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="دستاوردها و امتیاز"
        description="مدال‌هایی که با تمرین، تغذیه و پیگیری منظم کسب کرده‌اید"
      />

      <Card className="border-primary/15 bg-gradient-to-t from-primary/5 to-card">
        <CardContent className="flex items-center justify-between gap-3 pt-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">مجموع امتیاز شما</p>
              {loading ? (
                <Skeleton className="mt-1 h-6 w-20" />
              ) : (
                <p className="text-xl font-iranianSansBlack tabular-nums text-foreground">
                  {(summary?.totalPoints ?? 0).toLocaleString("fa-IR")}
                </p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="tabular-nums">
            {awards.length.toLocaleString("fa-IR")} مدال
          </Badge>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : awards.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Award className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              هنوز دستاوردی کسب نکرده‌اید — با ثبت اولین تمرین یا وعده غذایی شروع کنید
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {awards.map((award) => (
            <AwardCard key={award.code} award={award} />
          ))}
        </div>
      )}
    </div>
  );
}
