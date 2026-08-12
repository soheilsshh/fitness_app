import { api } from "@/lib/axios/client";

const LAST_SEEN_KEY = "fitino:streak:lastMilestoneSeen";

/**
 * Call after any activity that could extend the user's streak (workout log,
 * food log). Fetches the current streak and, if it just landed exactly on a
 * milestone we haven't already celebrated, returns {shouldCelebrate: true}.
 *
 * The "already celebrated" guard is per-browser (localStorage), not
 * per-server-call, so refreshing the page right after a celebration won't
 * show the popup again for the same milestone.
 */
export async function checkStreakMilestone() {
  try {
    const res = await api.get("/me/streak");
    const data = res.data || {};
    if (!data.isMilestone) return { shouldCelebrate: false };

    const lastSeen = Number(window.localStorage.getItem(LAST_SEEN_KEY) || 0);
    if (data.currentStreak <= lastSeen) return { shouldCelebrate: false };

    window.localStorage.setItem(LAST_SEEN_KEY, String(data.currentStreak));
    return { shouldCelebrate: true, streak: data.currentStreak };
  } catch {
    return { shouldCelebrate: false };
  }
}
