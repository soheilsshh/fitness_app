"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Static-export-safe alias: /auth/login|register → /auth
 * Preserves `next` / `redirect` query params on the client.
 */
export default function AuthAliasRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = new URLSearchParams();
    const next = searchParams.get("next");
    const redirectTo = searchParams.get("redirect");
    if (next) qs.set("next", next);
    if (redirectTo) qs.set("redirect", redirectTo);
    const suffix = qs.toString();
    router.replace(suffix ? `/auth?${suffix}` : "/auth");
  }, [router, searchParams]);

  return (
    <div className="py-20 text-center text-muted-foreground">
      در حال انتقال…
    </div>
  );
}
