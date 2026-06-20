import { ROLES, getPostLoginPath } from "@/lib/auth/roles";

/**
 * Validates an internal redirect path (prevents open redirects).
 */
export function getSafeRedirectPath(next) {
  if (!next || typeof next !== "string") return null;
  const path = next.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

/**
 * Reads `next` or `redirect` from URL search params.
 */
export function readRedirectParam(searchParams) {
  if (!searchParams) return null;
  return (
    getSafeRedirectPath(searchParams.get("next")) ||
    getSafeRedirectPath(searchParams.get("redirect"))
  );
}

/**
 * Where to send the user after login/register.
 * Payment flow: return to /payment even if student profile is incomplete.
 */
export function resolvePostAuthPath({ role, isProfileComplete, nextPath }) {
  const safe = getSafeRedirectPath(nextPath);

  if (safe?.startsWith("/payment")) {
    return safe;
  }

  if (role === ROLES.STUDENT && !isProfileComplete) {
    return getPostLoginPath(role, false);
  }

  if (safe) {
    return safe;
  }

  return getPostLoginPath(role, isProfileComplete);
}

export function buildAuthUrl(basePath, returnPath) {
  const safe = getSafeRedirectPath(returnPath);
  if (!safe) return basePath;
  const sep = basePath.includes("?") ? "&" : "?";
  return `${basePath}${sep}next=${encodeURIComponent(safe)}`;
}
