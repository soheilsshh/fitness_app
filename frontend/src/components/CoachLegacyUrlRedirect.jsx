"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const COACH_PANEL_SEGMENTS = new Set([
  "dashboard",
  "profile",
  "plans",
  "students",
  "tickets",
  "tools",
  "tracking",
]);

export default function CoachLegacyUrlRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname?.startsWith("/coach/")) return;

    const segment = pathname.split("/")[2];
    if (!segment || COACH_PANEL_SEGMENTS.has(segment)) return;

    router.replace(`/${segment}`);
  }, [pathname, router]);

  return null;
}
