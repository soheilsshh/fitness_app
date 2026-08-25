import { Suspense } from "react";
import LegacyFunnelRedirect from "@/lib/funnel/LegacyFunnelRedirect";

export default function LegacyTahlilPaymentPage() {
  return (
    <Suspense fallback={null}>
      <LegacyFunnelRedirect />
    </Suspense>
  );
}
