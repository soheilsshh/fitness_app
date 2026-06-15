"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/axios/client";
import { ROLES } from "@/lib/auth/roles";

/**
 * Wraps student panel content and redirects incomplete profiles to onboarding.
 * Skip on /user/onboarding itself to avoid redirect loops.
 */
export default function StudentOnboardingGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith("/user")) return;
    if (pathname.startsWith("/user/onboarding")) return;

    const role =
      typeof window !== "undefined"
        ? window.localStorage.getItem("user_role")
        : "";
    if (role !== ROLES.STUDENT) return;

    let cancelled = false;

    async function ensureProfileComplete() {
      try {
        const res = await api.get("/me");
        if (cancelled) return;

        if (!res.data?.isProfileComplete) {
          router.replace("/user/onboarding");
          return;
        }

        window.localStorage.setItem("profile_complete", "1");
      } catch {
        // auth errors are handled elsewhere
      }
    }

    ensureProfileComplete();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return children;
}
