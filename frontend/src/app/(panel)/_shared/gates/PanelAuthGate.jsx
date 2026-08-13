"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/roles";
import {
  navigateAfterAuth,
  withTrailingSlash,
} from "@/lib/auth/postAuthRedirect";

export default function PanelAuthGate({ requiredRole, children }) {
  const pathname = usePathname();

  useEffect(() => {
    const role = getAuthSession()?.role;

    if (!role) {
      const next = encodeURIComponent(pathname || "/");
      window.location.assign(withTrailingSlash(`/auth?next=${next}`));
      return;
    }

    if (role !== requiredRole) {
      navigateAfterAuth(getDashboardPath(role));
    }
  }, [pathname, requiredRole]);

  return children;
}
