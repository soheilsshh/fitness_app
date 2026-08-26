import { notFound } from "next/navigation";
import { isReservedPublicSlug } from "@/lib/routes/reserved-slugs";
import { fetchPublishedCoaches } from "@/lib/api/publishedCoaches";
import { fetchCoachLanding } from "@/lib/api/coachLanding";
import { absoluteUrl } from "@/lib/seo/siteUrl";
import { apiAssetUrl } from "@/lib/api/assets";
import CoachLandingClient from "./_components/CoachLandingClient";
import CoachLandingJsonLd from "./_components/CoachLandingJsonLd";

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
  const coaches = await fetchPublishedCoaches();

  if (coaches.length === 0) {
    console.warn("[coach-slugs] no published coaches — emitting placeholder only");
    return [{ slug: "placeholder" }];
  }

  const slugs = coaches.map((c) => c.slug);
  console.log(`[coach-slugs] emitting ${slugs.length} landing page(s): ${slugs.join(", ")}`);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (isReservedPublicSlug(slug)) return {};

  const { coach } = await fetchCoachLanding(slug);
  if (!coach) {
    return {
      title: "مربی یافت نشد | فیتینو",
      robots: { index: false, follow: false },
    };
  }

  const title = coach.title
    ? `${coach.displayName} — ${coach.title} | فیتینو`
    : `${coach.displayName} | مربی فیتینو`;
  const description = (coach.specialty || coach.bio || coach.aboutCoach || "")
    .slice(0, 155)
    .trim() || `صفحه اختصاصی مربی ${coach.displayName} در فیتینو — مشاهده برنامه‌های تمرینی و تغذیه و خرید آنلاین.`;
  const image = apiAssetUrl(coach.coverImageUrl || coach.avatarUrl) || undefined;
  const url = absoluteUrl(`/${slug}/`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "فیتینو",
      locale: "fa_IR",
      type: "profile",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PublicCoachLandingPage({ params }) {
  const { slug } = await params;

  if (isReservedPublicSlug(slug)) {
    notFound();
  }

  const { coach, plans } = await fetchCoachLanding(slug);

  return (
    <>
      {coach ? <CoachLandingJsonLd slug={slug} coach={coach} /> : null}
      <CoachLandingClient slug={slug} initialCoach={coach} initialPlans={plans} />
    </>
  );
}
