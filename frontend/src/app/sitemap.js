import { fetchPublishedCoaches } from "@/lib/api/publishedCoaches";
import { absoluteUrl } from "@/lib/seo/siteUrl";

/**
 * Statically exported as /sitemap.xml at build time. Only canonical,
 * indexable, public pages belong here — never auth/dashboard/admin/payment
 * or the root duplicate /login, /signup, /dashboard pages.
 */
export const dynamic = "force-static";

export default async function sitemap() {
  const now = new Date();

  const staticEntries = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/coaches/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/analiz/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  const coaches = await fetchPublishedCoaches();
  const coachEntries = coaches
    .filter((c) => c.slug !== "placeholder")
    .map((coach) => ({
      url: absoluteUrl(`/${coach.slug}/`),
      lastModified: coach.updatedAt ? new Date(coach.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.9,
    }));

  return [...staticEntries, ...coachEntries];
}
