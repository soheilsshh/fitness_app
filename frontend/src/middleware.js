import { NextResponse } from "next/server";
import { getDashboardPath, ROLES } from "@/lib/auth/roles";

const COACH_PANEL_SEGMENTS = new Set([
  "dashboard",
  "profile",
  "plans",
  "students",
  "tools",
]);

function isCoachPanelPath(pathname) {
  if (pathname === "/coach") return true;
  if (!pathname.startsWith("/coach/")) return false;
  const segment = pathname.split("/")[2];
  return COACH_PANEL_SEGMENTS.has(segment);
}

function redirectToLogin(request) {
  const login = new URL("/auth/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

function redirectToRoleDashboard(request, role) {
  return NextResponse.redirect(new URL(getDashboardPath(role), request.url));
}

function redirectLegacyCoachLanding(request, pathname) {
  if (!pathname.startsWith("/coach/")) return null;
  const segment = pathname.split("/")[2];
  if (!segment || COACH_PANEL_SEGMENTS.has(segment)) return null;
  return NextResponse.redirect(new URL(`/${segment}`, request.url));
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("user_role")?.value;

  const legacyCoachRedirect = redirectLegacyCoachLanding(request, pathname);
  if (legacyCoachRedirect) return legacyCoachRedirect;

  if (pathname.startsWith("/admin")) {
    if (!role) return redirectToLogin(request);
    if (role !== ROLES.ADMIN) return redirectToRoleDashboard(request, role);
  }

  if (pathname.startsWith("/user")) {
    if (!role) return redirectToLogin(request);
    if (role !== ROLES.STUDENT) return redirectToRoleDashboard(request, role);
  }

  if (isCoachPanelPath(pathname)) {
    if (!role) return redirectToLogin(request);
    if (role !== ROLES.COACH) return redirectToRoleDashboard(request, role);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/user/:path*",
    "/coach/:path*",
    "/coach",
    "/coach/dashboard",
    "/coach/dashboard/:path*",
    "/coach/profile",
    "/coach/profile/:path*",
    "/coach/plans",
    "/coach/plans/:path*",
    "/coach/students",
    "/coach/students/:path*",
    "/coach/tools",
    "/coach/tools/:path*",
  ],
};
