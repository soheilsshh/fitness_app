"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown, Users } from "lucide-react";
import { api } from "@/lib/axios/client";
import { getLeaderboard } from "@/lib/api/gamification";
import { apiAssetUrl } from "@/lib/api/assets";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const PERIODS = [
  { value: "daily", label: "روزانه" },
  { value: "weekly", label: "هفتگی" },
  { value: "monthly", label: "ماهانه" },
  { value: "quarterly", label: "سه‌ماهه" },
  { value: "yearly", label: "سالانه" },
];

const RANK_MEDAL_COLOR = {
  1: "text-amber-500",
  2: "text-zinc-400",
  3: "text-amber-700",
};

function RankBadge({ rank }) {
  const color = RANK_MEDAL_COLOR[rank];
  if (color) {
    return (
      <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-iranianSansBlack ${color}`}>
        {rank.toLocaleString("fa-IR")}
      </span>
    );
  }
  return (
    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-iranianSansDemiBold text-muted-foreground">
      {rank.toLocaleString("fa-IR")}
    </span>
  );
}

export default function LeaderboardClient() {
  const [period, setPeriod] = useState("weekly");
  const [scope, setScope] = useState("global"); // "global" | "coach"
  const [assignedCoachId, setAssignedCoachId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/me")
      .then((res) => {
        if (!cancelled) setAssignedCoachId(res.data?.assignedCoachId || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const coachId = scope === "coach" && assignedCoachId ? assignedCoachId : undefined;
      const data = await getLeaderboard({ period, coachId, limit: 50 });
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.error || "بارگذاری رتبه‌بندی ناموفق بود");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [period, scope, assignedCoachId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-iranianSansDemiBold transition-colors ${
              period === p.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {assignedCoachId ? (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setScope("global")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-iranianSansDemiBold transition-colors ${
              scope === "global"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            <Crown className="size-3.5" />
            سراسری
          </button>
          <button
            type="button"
            onClick={() => setScope("coach")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-iranianSansDemiBold transition-colors ${
              scope === "coach"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            <Users className="size-3.5" />
            فقط مربی من
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Crown className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              هنوز در این بازه امتیازی ثبت نشده است.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <Card
              key={entry.userId}
              className={
                entry.isCurrentUser
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/70"
              }
            >
              <CardContent className="flex items-center gap-3 px-3.5 py-3">
                <RankBadge rank={entry.rank} />
                <span className="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {entry.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={apiAssetUrl(entry.avatarUrl)}
                      alt={entry.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Users className="size-4 text-muted-foreground" />
                  )}
                </span>
                <div className="min-w-0 flex-1 text-start">
                  <p className="truncate text-sm font-iranianSansDemiBold text-foreground">
                    {entry.fullName}
                    {entry.isCurrentUser ? (
                      <span className="ms-1.5 text-[11px] font-normal text-primary">(شما)</span>
                    ) : null}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-iranianSansBlack tabular-nums text-foreground">
                  {entry.points.toLocaleString("fa-IR")}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
