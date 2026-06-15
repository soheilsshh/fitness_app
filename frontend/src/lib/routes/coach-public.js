/**
 * Public coach landing URL — Instagram-style root slug path.
 */
export function getCoachPublicPath(slug) {
  if (!slug) return "/";
  return `/${String(slug).replace(/^\/+/, "")}`;
}
