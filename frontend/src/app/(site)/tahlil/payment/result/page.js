import { Suspense } from "react";
import LegacyFunnelRedirect from "@/lib/funnel/LegacyFunnelRedirect";

export default function LegacyTahlilPaymentResultPage() {
  return (
    <Suspense fallback={null}>
      <LegacyFunnelRedirect />
    </Suspense>
  );
}
