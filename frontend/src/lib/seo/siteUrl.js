/** Production canonical domain — used when no NEXT_PUBLIC_SITE_URL is set (no .env needed). */
export const DEFAULT_SITE_URL = "https://fitinoo.ir";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL
).replace(/\/$/, "");

/** Builds an absolute, canonical URL for a site-relative path (must start with "/"). */
export function absoluteUrl(path = "/") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}
