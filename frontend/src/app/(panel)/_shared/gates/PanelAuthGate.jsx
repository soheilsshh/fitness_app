"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/roles";

export default function PanelAuthGate({ requiredRole, children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const role = getAuthSession()?.role;

    if (!role) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    if (role !== requiredRole) {
      router.replace(getDashboardPath(role));
    }
  }, [pathname, requiredRole, router]);

  return children;
}
