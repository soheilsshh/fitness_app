import { ROLES, getPostLoginPath } from "@/lib/auth/roles";

/** Paths that must never be used as post-login return targets. */
function isAuthLoopPath(path) {
  const bare = path.split("?")[0].replace(/\/+$/, "") || "/";
  return (
    bare === "/auth" ||
    bare === "/login" ||
    bare.startsWith("/auth/") ||
    bare.startsWith("/login/")
  );
}

/**
 * Ensures a path works with next.config trailingSlash + static export.
 */
export function withTrailingSlash(path) {
  if (!path || typeof path !== "string") return "/";
  const [pathname, query = ""] = path.split("?");
  const base = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return query ? `${base}?${query}` : base;
}

/**
 * Validates an internal redirect path (prevents open redirects + auth loops).
 */
export function getSafeRedirectPath(next) {
  if (!next || typeof next !== "string") return null;
  const path = next.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (isAuthLoopPath(path)) return null;
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
    return withTrailingSlash(safe);
  }

  if (role === ROLES.STUDENT && !isProfileComplete) {
    return withTrailingSlash(getPostLoginPath(role, false));
  }

  if (safe) {
    return withTrailingSlash(safe);
  }

  return withTrailingSlash(getPostLoginPath(role, isProfileComplete));
}

/**
 * Hard navigation after auth. Soft router.replace is unreliable with
 * `output: "export"` + trailingSlash — session is saved but the URL stays on /auth.
 */
export function navigateAfterAuth(path) {
  if (typeof window === "undefined") return;
  window.location.assign(withTrailingSlash(path || "/"));
}

export function buildAuthUrl(basePath, returnPath) {
  const safe = getSafeRedirectPath(returnPath);
  if (!safe) return basePath;
  const sep = basePath.includes("?") ? "&" : "?";
  return `${basePath}${sep}next=${encodeURIComponent(safe)}`;
}
