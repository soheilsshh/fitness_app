/**
 * Single-segment paths that must never resolve as public coach landing pages.
 * Static Next.js routes take precedence; this list is a safety net for `/[slug]`.
 */
export const RESERVED_PUBLIC_SLUGS = new Set([
  "auth",
  "blog",
  "about",
  "me",
  "dashboard",
  "payment",
  "coaches",
  "coach",
  "admin",
  "user",
  "api",
  "login",
  "register",
  "forgot",
]);

export function isReservedPublicSlug(slug) {
  if (!slug || typeof slug !== "string") return true;
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return true;
  return RESERVED_PUBLIC_SLUGS.has(normalized);
}
