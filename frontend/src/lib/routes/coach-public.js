/**
 * Public coach landing URL — Instagram-style root slug path (`/{slug}`).
 * Accepts raw slug or legacy `/coach/{slug}` values and normalizes them.
 */
export function getCoachPublicPath(slugOrPath) {
  if (!slugOrPath) return "";
  let value = String(slugOrPath).trim().replace(/^\/+/, "");
  if (value.toLowerCase().startsWith("coach/")) {
    value = value.slice("coach/".length).replace(/^\/+/, "");
  }
  if (!value) return "";
  return `/${value}`;
}
