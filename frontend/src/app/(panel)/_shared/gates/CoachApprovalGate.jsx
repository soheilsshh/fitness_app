"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCoachProfile } from "@/app/(panel)/coach/_context/CoachProfileContext";

const PROFILE_PATH = "/coach/profile";

function isProfilePath(pathname) {
  return pathname === PROFILE_PATH || pathname?.startsWith(`${PROFILE_PATH}/`);
}

/**
 * Redirects unapproved coaches to the profile page when they visit restricted panel routes.
 */
export default function CoachApprovalGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, isRestricted } = useCoachProfile();

  useEffect(() => {
    if (loading || !isRestricted) return;
    if (!pathname?.startsWith("/coach")) return;
    if (isProfilePath(pathname)) return;

    router.replace(PROFILE_PATH);
  }, [loading, isRestricted, pathname, router]);

  return children;
}
