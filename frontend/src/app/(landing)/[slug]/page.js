import { notFound } from "next/navigation";
import { isReservedPublicSlug } from "@/lib/routes/reserved-slugs";
import { API_BASE_URL } from "@/lib/api/baseUrl";
import CoachLandingClient from "./_components/CoachLandingClient";

const API_BASE = API_BASE_URL.replace(/\/$/, "");

/**
 * Enumerate every published coach slug at build time so `output: export`
 * emits a real `dist/<slug>/index.html` per coach.
 *
 * Do NOT wrap CoachLandingClient in lazyPage — that bails out to CSR and the
 * first paint is only the site Navbar (looks like the homepage).
 *
 * New coaches require a rebuild/deploy after they are published in the API.
 */
export async function generateStaticParams() {
  const pageSize = 100;
  const slugs = new Set();

  try {
    let page = 1;
    for (let guard = 0; guard < 100; guard += 1) {
      const res = await fetch(
        `${API_BASE}/coaches?page=${page}&pageSize=${pageSize}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) {
        console.warn(`[coach-slugs] GET /coaches failed: HTTP ${res.status}`);
        break;
      }

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
    console.warn(
      `[coach-slugs] could not fetch ${API_BASE}/coaches (${error?.message || error}); building fallback shell only.`
    );
  }

  if (slugs.size === 0) {
    console.warn("[coach-slugs] no published coaches — emitting placeholder only");
    return [{ slug: "placeholder" }];
  }

  console.log(`[coach-slugs] emitting ${slugs.size} landing page(s): ${[...slugs].join(", ")}`);
  return [...slugs].map((slug) => ({ slug }));
}

export default async function PublicCoachLandingPage({ params }) {
  const { slug } = await params;

  if (isReservedPublicSlug(slug)) {
    notFound();
  }

  return <CoachLandingClient slug={slug} />;
}
