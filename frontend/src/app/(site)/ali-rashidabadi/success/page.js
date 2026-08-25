import { Suspense } from "react";
import LegacyFunnelRedirect from "@/lib/funnel/LegacyFunnelRedirect";

export default function LegacyFunnelSuccessPage() {
  return (
    <Suspense fallback={null}>
      <LegacyFunnelRedirect />
    </Suspense>
  );
}
