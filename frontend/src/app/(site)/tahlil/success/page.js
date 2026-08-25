import { Suspense } from "react";
import LegacyFunnelRedirect from "@/lib/funnel/LegacyFunnelRedirect";

export default function LegacyTahlilSuccessPage() {
  return (
    <Suspense fallback={null}>
      <LegacyFunnelRedirect />
    </Suspense>
  );
}
