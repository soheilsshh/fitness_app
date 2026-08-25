import { SITE_URL } from "@/lib/seo/siteUrl";

/**
 * Statically exported as /robots.txt at build time (works with output:"export"
 * since this route has no dynamic runtime dependencies).
 */
export const dynamic = "force-static";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/auth",
          "/auth/",
          "/login",
          "/login/",
          "/signup",
          "/signup/",
          "/dashboard",
          "/dashboard/",
          "/admin",
          "/admin/",
          "/coach",
          "/coach/",
          "/user",
          "/user/",
          "/payment",
          "/payment/",
          "/analiz/payment",
          "/analiz/payment/",
          "/analiz/success",
          "/analiz/success/",
          "/tahlil/payment",
          "/tahlil/payment/",
          "/tahlil/success",
          "/tahlil/success/",
          "/ali-rashidabadi/payment",
          "/ali-rashidabadi/payment/",
          "/ali-rashidabadi/success",
          "/ali-rashidabadi/success/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
