import { isReservedPublicSlug } from "@/lib/routes/reserved-slugs";
import { API_BASE_URL } from "@/lib/api/baseUrl";

const API_BASE = API_BASE_URL.replace(/\/$/, "");

/**
 * Fetches every published coach at build time (paginated), for use by
 * generateStaticParams (per-coach static HTML) and the sitemap (canonical
 * URL list). Both must stay in sync — a coach missing from one must be
 * missing from the other.
 */
export async function fetchPublishedCoaches() {
  const pageSize = 100;
  const coaches = new Map();

  try {
    let page = 1;
    for (let guard = 0; guard < 100; guard += 1) {
      const res = await fetch(
        `${API_BASE}/coaches?page=${page}&pageSize=${pageSize}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) {
        console.warn(`[published-coaches] GET /coaches failed: HTTP ${res.status}`);
        break;
      }

      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      for (const coach of items) {
        const slug = typeof coach?.slug === "string" ? coach.slug.trim() : "";
        if (slug && !isReservedPublicSlug(slug)) coaches.set(slug, coach);
      }

      const total = Number(data?.total) || 0;
      if (items.length === 0 || page * pageSize >= total) break;
      page += 1;
    }
  } catch (error) {
    console.warn(
      `[published-coaches] could not fetch ${API_BASE}/coaches (${error?.message || error}).`
    );
  }

  return [...coaches.values()];
}
