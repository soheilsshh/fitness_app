import { cache } from "react";
import { API_BASE_URL } from "@/lib/api/baseUrl";

const API_BASE = API_BASE_URL.replace(/\/$/, "");

/**
 * Fetches a coach's public profile + active plans at build time so the
 * static export ships real content (crawlable HTML) instead of a client-only
 * loading skeleton. Wrapped in React's cache() so generateMetadata and the
 * page component share one fetch per slug during static generation.
 */
export const fetchCoachLanding = cache(async function fetchCoachLanding(slug) {
  try {
    const [coachRes, plansRes] = await Promise.all([
      fetch(`${API_BASE}/coaches/${slug}`, { headers: { Accept: "application/json" } }),
      fetch(`${API_BASE}/coaches/${slug}/plans`, { headers: { Accept: "application/json" } }),
    ]);

    if (!coachRes.ok) return { coach: null, plans: [] };

    const coach = await coachRes.json();
    const plansData = plansRes.ok ? await plansRes.json() : null;
    return { coach, plans: plansData?.plans || [] };
  } catch {
    return { coach: null, plans: [] };
  }
});
