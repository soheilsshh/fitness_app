"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FUNNEL_PATH } from "@/lib/funnel/offer";

/** Keeps old /ali-rashidabadi and /tahlil links working after the public path moved to /analiz. */
export default function LegacyFunnelRedirect() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const params = useSearchParams();

  useEffect(() => {
    const nextPath =
      pathname.replace(/^\/ali-rashidabadi/, FUNNEL_PATH).replace(/^\/tahlil/, FUNNEL_PATH) ||
      FUNNEL_PATH;
    const qs = params?.toString();
    router.replace(qs ? `${nextPath}?${qs}` : nextPath);
  }, [pathname, params, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-white/50">
      در حال انتقال به ارزیابی هوشمند...
    </div>
  );
}
