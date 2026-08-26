import { api } from "@/lib/axios/client";

/** Points-economy API paths (relative to NEXT_PUBLIC_API_BASE_URL). */
export const GAMIFICATION_SUMMARY_PATH = "/me/gamification";
export const LEADERBOARD_PATH = "/leaderboard";

/**
 * @typedef {{
 *   level: number;
 *   levelTitle: string;
 *   totalXP: number;
 *   xpThisWeek: number;
 *   xpIntoLevel: number;
 *   xpNeededForLevel: number;
 *   totalMedalPoints: number;
 *   medalCount: number;
 *   reputation: number;
 * }} GameSummary
 */

/** @returns {Promise<GameSummary>} */
export async function getMyGameSummary() {
  const res = await api.get(GAMIFICATION_SUMMARY_PATH);
  return res.data;
}

/**
 * @typedef {{
 *   rank: number;
 *   userId: number;
 *   fullName: string;
 *   avatarUrl?: string;
 *   points: number;
 *   isCurrentUser: boolean;
 * }} LeaderboardEntry
 */

/**
 * @param {{ period?: "daily"|"weekly"|"monthly"|"quarterly"|"yearly"; coachId?: number; limit?: number }} [params]
 * @returns {Promise<LeaderboardEntry[]>}
 */
export async function getLeaderboard({ period = "weekly", coachId, limit } = {}) {
  const res = await api.get(LEADERBOARD_PATH, {
    params: {
      period,
      coachId: coachId || undefined,
      limit: limit || undefined,
    },
  });
  return res.data;
}
