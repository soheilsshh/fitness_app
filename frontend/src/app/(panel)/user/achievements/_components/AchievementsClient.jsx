"use client";

import { useCallback, useEffect, useState } from "react";
import { Award, Flame, Medal, Sparkles, Crown } from "lucide-react";
import { api } from "@/lib/axios/client";
import { getMyGameSummary } from "@/lib/api/gamification";
import PageHeader from "@/app/(panel)/user/_components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import LeaderboardClient from "./LeaderboardClient";

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

// Tailwind's JIT scanner only picks up class names it can see as literal
// strings, so the tint variants must be spelled out here — not interpolated.
const TINT_CLASSES = {
  amber: {
    card: "border-amber-500/15 bg-gradient-to-t from-amber-500/5 to-card",
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  teal: {
    card: "border-teal-500/15 bg-gradient-to-t from-teal-500/5 to-card",
    icon: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  orange: {
    card: "border-orange-500/15 bg-gradient-to-t from-orange-500/5 to-card",
    icon: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  violet: {
    card: "border-violet-500/15 bg-gradient-to-t from-violet-500/5 to-card",
    icon: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
};

function StatTile({ icon: Icon, label, value, loading, tint }) {
  const cls = TINT_CLASSES[tint] || TINT_CLASSES.amber;
  return (
    <Card className={cls.card}>
      <CardContent className="flex items-center gap-2.5 px-3.5 py-4">
        <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${cls.icon}`}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-5 w-12" />
          ) : (
            <p className="text-base font-iranianSansBlack tabular-nums text-foreground">
              {(value ?? 0).toLocaleString("fa-IR")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AchievementsClient() {
  const [summary, setSummary] = useState(null);
  const [game, setGame] = useState(null);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [achievementsRes, gameSummary, streakRes] = await Promise.all([
        api.get("/me/achievements"),
        getMyGameSummary().catch(() => null),
        api.get("/me/streak").catch(() => null),
      ]);
      setSummary(achievementsRes.data);
      setGame(gameSummary);
      setStreak(streakRes?.data || null);
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

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <StatTile icon={Award} tint="amber" label="مدال" loading={loading} value={awards.length} />
        <StatTile icon={Sparkles} tint="teal" label="XP این هفته" loading={loading} value={game?.xpThisWeek} />
        <StatTile icon={Flame} tint="orange" label="استریک" loading={loading} value={streak?.currentStreak} />
        <StatTile icon={Crown} tint="violet" label="اعتبار" loading={loading} value={game?.reputation} />
      </div>

      {!loading && game ? (
        <Card className="border-primary/15 bg-gradient-to-t from-primary/5 to-card">
          <CardContent className="flex items-center justify-between gap-3 pt-6">
            <div>
              <p className="text-xs text-muted-foreground">سطح شما</p>
              <p className="text-lg font-iranianSansBlack text-foreground">
                سطح {game.level.toLocaleString("fa-IR")} · {game.levelTitle}
              </p>
              <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                {game.xpIntoLevel.toLocaleString("fa-IR")} از {game.xpNeededForLevel.toLocaleString("fa-IR")} XP تا سطح بعد
              </p>
            </div>
            <Badge variant="outline" className="tabular-nums">
              {game.totalXP.toLocaleString("fa-IR")} XP کل
            </Badge>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="medals" dir="rtl">
        <TabsList>
          <TabsTrigger value="medals">مدال‌ها</TabsTrigger>
          <TabsTrigger value="leaderboard">رتبه‌بندی</TabsTrigger>
        </TabsList>

        <TabsContent value="medals" className="mt-4">
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
              {awards.map((award, i) => (
                <AwardCard key={`${award.code}-${award.awardedAt}-${i}`} award={award} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <LeaderboardClient />
        </TabsContent>
      </Tabs>
    </div>
  );
}
