import { absoluteUrl } from "@/lib/seo/siteUrl";
import { apiAssetUrl } from "@/lib/api/assets";

export default function CoachLandingJsonLd({ slug, coach }) {
  const url = absoluteUrl(`/${slug}/`);
  const image = apiAssetUrl(coach.coverImageUrl || coach.avatarUrl) || undefined;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "فیتینو", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "مربی‌ها", item: absoluteUrl("/coaches/") },
      { "@type": "ListItem", position: 3, name: coach.displayName, item: url },
    ],
  };

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: coach.displayName,
    jobTitle: coach.title || "مربی تناسب اندام",
    description: coach.specialty || coach.bio || undefined,
    image,
    url,
    ...(coach.social?.phone ? { telephone: coach.social.phone } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
      />
    </>
  );
}
