import { notFound } from "next/navigation";
import { isReservedPublicSlug } from "@/lib/routes/reserved-slugs";
import { lazyPage } from "@/lib/lazy-page";

const CoachLandingClient = lazyPage(() => import("./_components/CoachLandingClient"));

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.fitinoo.ir"
).replace(/\/$/, "");

/**
 * Enumerate every published coach slug at build time so `output: export`
 * emits a real `dist/<slug>/index.html` per coach. This is what makes the
 * standard nginx `try_files $uri $uri/ =404` correct — no placeholder shell
 * and no rewrite/fallback rules needed.
 *
 * Trade-off: a coach who registers after a build only appears on the next
 * build/deploy. If instant availability is required, drop `output: export`
 * and serve via a Node server instead.
 */
export async function generateStaticParams() {
  const pageSize = 100;
  const slugs = new Set();

  try {
    let page = 1;
    // Cap pages to avoid an unbounded loop if the API misreports `total`.
    for (let guard = 0; guard < 100; guard += 1) {
      const res = await fetch(
        `${API_BASE}/coaches?page=${page}&pageSize=${pageSize}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) break;

      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      for (const coach of items) {
        const slug = typeof coach?.slug === "string" ? coach.slug.trim() : "";
        if (slug && !isReservedPublicSlug(slug)) slugs.add(slug);
      }

      const total = Number(data?.total) || 0;
      if (items.length === 0 || page * pageSize >= total) break;
      page += 1;
    }
  } catch (error) {
    // Non-fatal: if the coach API is unreachable at build time, keep the build
    // green instead of aborting the whole deploy. The route still exists via
    // the fallback below; re-run the build once the API is reachable to emit
    // every coach page.
    console.warn(
      `[coach-slugs] could not fetch ${API_BASE}/coaches (${error?.message || error}); building fallback shell only.`
    );
  }

  // Always emit at least one param so `output: export` produces the route.
  if (slugs.size === 0) return [{ slug: "placeholder" }];

  return [...slugs].map((slug) => ({ slug }));
}

export default async function PublicCoachLandingPage({ params }) {
  const { slug } = await params;

  if (isReservedPublicSlug(slug)) {
    notFound();
  }

  return <CoachLandingClient slug={slug} />;
}
